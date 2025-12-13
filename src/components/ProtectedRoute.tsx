import { ReactNode, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase, resetSupabaseClient } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

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
        // ✅ correção determinística: reset e tenta 1 vez
        resetSupabaseClient();
        try {
          const { data } = (await withTimeout(supabase.auth.getSession(), 4000, "GET_SESSION_TIMEOUT_2")) as Awaited<
            ReturnType<typeof supabase.auth.getSession>
          >;
          return data.session ?? null;
        } catch {
          return null;
        }
      }
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

    runCheck({ silent: false });

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        resetSupabaseClient();
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
