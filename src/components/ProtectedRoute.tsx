import { ReactNode, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

type CachedAuth = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user?: any;
};

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const [checking, setChecking] = useState(true); // só no bootstrap
  const [allowed, setAllowed] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);
  const bootstrappedRef = useRef(false);

  const withTimeout = async <T,>(p: Promise<T>, ms: number, code: string) => {
    return await Promise.race([p, new Promise<T>((_, reject) => setTimeout(() => reject(new Error(code)), ms))]);
  };

  const getCachedAuth = (): CachedAuth | null => {
    try {
      const keys = Object.keys(localStorage || {}).filter((k) => k.startsWith("sb-") && k.includes("auth-token"));

      for (const k of keys) {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const parsed = JSON.parse(raw);

        if (parsed?.access_token && parsed?.refresh_token) {
          // se tiver expires_at e já expirou, ignora
          const exp = Number(parsed.expires_at ?? 0);
          if (exp) {
            const now = Math.floor(Date.now() / 1000);
            if (exp <= now) continue;
          }
          return parsed as CachedAuth;
        }
      }
    } catch {
      // ignore
    }
    return null;
  };

  const rehydrateSessionFromCache = async () => {
    const cached = getCachedAuth();
    if (!cached?.access_token || !cached?.refresh_token) return false;

    try {
      await withTimeout(
        supabase.auth.setSession({
          access_token: cached.access_token,
          refresh_token: cached.refresh_token,
        }),
        2000,
        "SET_SESSION_TIMEOUT",
      );
      return true;
    } catch (e) {
      console.warn("ProtectedRoute: falhou rehydrateSessionFromCache:", e);
      return false;
    }
  };

  const getSessionSafe = async () => {
    try {
      const { data, error } = (await withTimeout(supabase.auth.getSession(), 6000, "GET_SESSION_TIMEOUT")) as Awaited<
        ReturnType<typeof supabase.auth.getSession>
      >;

      if (error) throw error;
      return data.session ?? null;
    } catch (err: any) {
      const msg = String(err?.message || err);

      if (msg === "GET_SESSION_TIMEOUT") {
        // ✅ Se travou, re-hidrata a sessão no Supabase client e tenta de novo
        const ok = await rehydrateSessionFromCache();
        if (!ok) return null;

        try {
          const { data } = (await withTimeout(supabase.auth.getSession(), 3000, "GET_SESSION_TIMEOUT_2")) as Awaited<
            ReturnType<typeof supabase.auth.getSession>
          >;
          return data.session ?? null;
        } catch {
          return null;
        }
      }

      // outros erros => trata como sem sessão
      return null;
    }
  };

  const runCheck = async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      if (!silent && !bootstrappedRef.current) setChecking(true);

      const session = await getSessionSafe();

      if (!mountedRef.current) return;

      if (!session) {
        setAllowed(false);
        setChecking(false);
        bootstrappedRef.current = true;
        navigate("/", { replace: true, state: { from: location } });
        return;
      }

      if (!requireAdmin) {
        setAllowed(true);
        setChecking(false);
        bootstrappedRef.current = true;
        return;
      }

      const userId = session.user.id;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", userId)
        .maybeSingle();

      if (!mountedRef.current) return;

      if (profileError || !profile?.is_admin) {
        setAllowed(false);
        setChecking(false);
        bootstrappedRef.current = true;
        navigate("/dashboard", { replace: true, state: { from: location } });
        return;
      }

      setAllowed(true);
      setChecking(false);
      bootstrappedRef.current = true;
    } finally {
      inFlightRef.current = false;
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    // bootstrap (pode mostrar carregando)
    runCheck({ silent: false });

    // ✅ ao voltar pra aba: recheck silencioso + rehydrate se travar
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        runCheck({ silent: true });
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      mountedRef.current = false;
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requireAdmin, location.pathname]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-night-sky text-starlight-text">
        Carregando...
      </div>
    );
  }

  if (!allowed) return null;
  return <>{children}</>;
}
