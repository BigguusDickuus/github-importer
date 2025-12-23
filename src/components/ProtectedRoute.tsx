import { ReactNode, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

const MFA_BUSY_UNTIL_KEY = "to_mfa_busy_until";
const MFA_LOGIN_PENDING_KEY = "to_mfa_login_pending_v1";

const isMfaBusy = () => {
  try {
    const until = Number(sessionStorage.getItem(MFA_BUSY_UNTIL_KEY) || "0");
    return until > 0 && Date.now() < until;
  } catch {
    return false;
  }
};

const isMfaLoginPending = () => {
  try {
    return sessionStorage.getItem(MFA_LOGIN_PENDING_KEY) === "1";
  } catch {
    return false;
  }
};

const isGetUserTimeout = (err: any) => {
  const msg = String(err?.message ?? err ?? "");
  return msg.includes("GET_USER_TIMEOUT");
};

const getUserWithTimeout = async (timeoutMs: number) => {
  let timerId: number | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timerId = window.setTimeout(() => reject(new Error("GET_USER_TIMEOUT")), timeoutMs);
  });

  try {
    const res = (await Promise.race([supabase.auth.getUser(), timeoutPromise])) as any;
    return res as { data: { user: any | null }; error: any };
  } finally {
    if (timerId !== null) window.clearTimeout(timerId);
  }
};

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);

  const runCheck = async (opts?: { bootstrap?: boolean }) => {
    const bootstrap = opts?.bootstrap ?? false;
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    if (bootstrap) setChecking(true);

    try {
      // Evita deadlock durante janelas críticas do MFA
      if (!bootstrap && isMfaBusy()) return;

      // 🔒 Se MFA está pendente, bloqueia qualquer rota protegida (sem loop):
      if (isMfaLoginPending()) {
        setAllowed(false);
        setChecking(false);
        navigate("/", { replace: true, state: { from: location.pathname, mfaRequired: true } });
        return;
      }

      const { data, error } = await getUserWithTimeout(3500);
      if (!mountedRef.current) return;

      const user = data?.user ?? null;

      if (error || !user) {
        // Timeout: NÃO redireciona (evita loop). Só tenta de novo.
        if (isGetUserTimeout(error)) {
          setChecking(true);
          window.setTimeout(() => runCheck({ bootstrap: false }), 800);
          return;
        }

        setAllowed(false);
        setChecking(false);
        navigate("/", { replace: true, state: { from: location.pathname } });
        return;
      }

      if (!requireAdmin) {
        setAllowed(true);
        setChecking(false);
        return;
      }

      const userId = user.id;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", userId)
        .maybeSingle();

      if (!mountedRef.current) return;

      if (profileError || !profile?.is_admin) {
        setAllowed(false);
        setChecking(false);
        navigate("/dashboard", { replace: true, state: { from: location.pathname } });
        return;
      }

      setAllowed(true);
      setChecking(false);
    } catch (e: any) {
      if (!mountedRef.current) return;

      // Timeout: NÃO redireciona, só retry.
      if (isGetUserTimeout(e)) {
        setChecking(true);
        window.setTimeout(() => runCheck({ bootstrap: false }), 800);
        return;
      }

      setAllowed(false);
      setChecking(false);
      navigate("/", { replace: true, state: { from: location.pathname } });
    } finally {
      inFlightRef.current = false;
      if (mountedRef.current && bootstrap) setChecking(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    runCheck({ bootstrap: true });

    const wake = () => {
      if (document.visibilityState !== "visible") return;
      if (isMfaBusy()) return;
      runCheck({ bootstrap: false });
    };

    document.addEventListener("visibilitychange", wake);
    window.addEventListener("focus", wake);
    window.addEventListener("pageshow", wake as any);

    return () => {
      mountedRef.current = false;
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("focus", wake);
      window.removeEventListener("pageshow", wake as any);
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
