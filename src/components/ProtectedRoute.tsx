import { ReactNode, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

const MFA_BUSY_UNTIL_KEY = "to_mfa_busy_until";
const LAST_USER_ID_KEY = "to_last_user_id_v1";

const isMfaBusy = () => {
  try {
    const until = Number(sessionStorage.getItem(MFA_BUSY_UNTIL_KEY) || "0");
    return until > 0 && Date.now() < until;
  } catch {
    return false;
  }
};

const getStoredUserId = (): string | null => {
  try {
    return localStorage.getItem(LAST_USER_ID_KEY);
  } catch {
    return null;
  }
};

const setStoredUserId = (userId: string) => {
  try {
    localStorage.setItem(LAST_USER_ID_KEY, userId);
  } catch {}
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
      // Durante MFA (janela crítica), não revalida no wake/focus (evita deadlock).
      if (!bootstrap && isMfaBusy()) return;

      const { data, error } = await getUserWithTimeout(3500);
      if (!mountedRef.current) return;

      const user = data?.user ?? null;

      if (error || !user) {
        const storedUserId = getStoredUserId();

        // Timeout: NÃO desloga.
        // Segurança:
        // - Rotas admin: NÃO libera por storage.
        // - Rotas não-admin: só libera por storage SE estivermos em janela MFA busy
        //   (para não expulsar durante verificação), caso contrário mantém retry.
        if (isGetUserTimeout(error)) {
          if (!requireAdmin && storedUserId && isMfaBusy()) {
            setAllowed(true);
            setChecking(false);
            window.setTimeout(() => runCheck({ bootstrap: false }), 800);
            return;
          }

          setChecking(true);
          window.setTimeout(() => runCheck({ bootstrap: false }), 800);
          return;
        }

        setAllowed(false);
        setChecking(false);
        navigate("/", { replace: true, state: { from: location } });
        return;
      }

      // Guarda id para casos transitórios de timeout (apenas referência, não auth real)
      if (user?.id) setStoredUserId(user.id);

      // 🔒 Enforce MFA (AAL2) para rotas logadas:
      // Se o usuário tem MFA configurado (nextLevel=aal2) e ainda está em AAL1, bloqueia.
      try {
        const { data: aalData, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

        if (!aalError) {
          const needsMfa = aalData?.nextLevel === "aal2" && aalData?.currentLevel !== "aal2";
          if (needsMfa) {
            setAllowed(false);
            setChecking(false);
            navigate("/", { replace: true, state: { from: location, mfaRequired: true } });
            return;
          }
        }
      } catch {
        // se falhar AAL check, não assume MFA; segue fluxo normal
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
        navigate("/dashboard", { replace: true, state: { from: location } });
        return;
      }

      setAllowed(true);
      setChecking(false);
    } catch (e: any) {
      if (!mountedRef.current) return;

      const storedUserId = getStoredUserId();

      if (isGetUserTimeout(e)) {
        if (!requireAdmin && storedUserId && isMfaBusy()) {
          setAllowed(true);
          setChecking(false);
          window.setTimeout(() => runCheck({ bootstrap: false }), 800);
          return;
        }

        setChecking(true);
        window.setTimeout(() => runCheck({ bootstrap: false }), 800);
        return;
      }

      setAllowed(false);
      setChecking(false);
      navigate("/", { replace: true, state: { from: location } });
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
