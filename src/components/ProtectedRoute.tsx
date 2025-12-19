import { ReactNode, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase, resetSupabaseClient } from "@/integrations/supabase/client";

// PATCH_MARK: PROTECTED_ROUTE_TIMEOUT_V1

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const [checking, setChecking] = useState(true); // só bootstrap
  const [allowed, setAllowed] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const mountedRef = useRef(true);

  // evita concorrência / duplicação
  const inFlightRef = useRef(false);
  const inFlightStartedAtRef = useRef<number>(0);

  const getSessionWithTimeout = async (timeoutMs: number) => {
    let timerId: number | null = null;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timerId = window.setTimeout(() => reject(new Error("GET_SESSION_TIMEOUT")), timeoutMs);
    });

    try {
      const res = (await Promise.race([supabase.auth.getSession(), timeoutPromise])) as any;
      return res as { data: any; error: any };
    } finally {
      if (timerId !== null) window.clearTimeout(timerId);
    }
  };

  const runCheck = async (opts?: { bootstrap?: boolean }) => {
    const bootstrap = opts?.bootstrap ?? false;
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    inFlightStartedAtRef.current = Date.now();

    if (bootstrap) setChecking(true);

    try {
      // 1) tentativa normal (rápida)
      let sessionRes: { data: any; error: any } | null = null;
      try {
        sessionRes = await getSessionWithTimeout(3000);
      } catch (e: any) {
        if (e?.message === "GET_SESSION_TIMEOUT") {
          console.warn("ProtectedRoute: getSession timeout (1). Tentando resetSupabaseClient + retry.");
        } else {
          console.warn("ProtectedRoute: getSession erro (1). Tentando resetSupabaseClient + retry.", e);
        }
      }

      // 2) retry com reset (controlado)
      if (!sessionRes) {
        try {
          resetSupabaseClient();
        } catch {}
        try {
          sessionRes = await getSessionWithTimeout(3000);
        } catch (e: any) {
          console.warn("ProtectedRoute: getSession falhou também após reset.", e);
          sessionRes = null;
        }
      }

      if (!mountedRef.current) return;

      // 3) se ainda não conseguiu sessão, falha com segurança (sem reload)
      if (!sessionRes || sessionRes.error || !sessionRes.data?.session) {
        setAllowed(false);
        setChecking(false);

        // segurança: manda pro login
        navigate("/", { replace: true, state: { from: location } });
        return;
      }

      // 4) sem admin requerido
      if (!requireAdmin) {
        setAllowed(true);
        setChecking(false);
        return;
      }

      // 5) valida admin
      const userId = sessionRes.data.session.user.id;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", userId)
        .maybeSingle();

      if (!mountedRef.current) return;

      if (profileError || !profile?.is_admin) {
        setAllowed(false);
        setChecking(false);
        navigate("/dashboard", { replace: true, state: { from: location } });
        return;
      }

      setAllowed(true);
      setChecking(false);
    } finally {
      inFlightRef.current = false;
      inFlightStartedAtRef.current = 0;
      if (mountedRef.current && bootstrap) setChecking(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    // Bootstrap inicial (pode mostrar carregando)
    runCheck({ bootstrap: true });

    // Ao voltar pra aba: revalida em background.
    // Importante: NÃO resetar client aqui (isso pode interferir em fluxos MFA quando o usuário troca de app)
    const wake = () => {
      if (document.visibilityState !== "visible") return;

      // Se ficou travado, tenta destravar sem reload
      if (inFlightRef.current) {
        const startedAt = inFlightStartedAtRef.current || 0;
        const age = startedAt ? Date.now() - startedAt : 0;

        // se passou tempo demais, libera e tenta de novo
        if (age > 6000) {
          console.warn("ProtectedRoute: inFlight travado há >6s. Liberando e revalidando sem reload.");
          inFlightRef.current = false;
          inFlightStartedAtRef.current = 0;
          runCheck({ bootstrap: false });
        }
        return;
      }

      runCheck({ bootstrap: false });
    };

    document.addEventListener("visibilitychange", wake);
    window.addEventListener("focus", wake);

    return () => {
      mountedRef.current = false;
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("focus", wake);
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
