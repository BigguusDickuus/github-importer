import { ReactNode, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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
  const inFlightRef = useRef(false);

  const runCheck = async (opts?: { bootstrap?: boolean }) => {
    const bootstrap = opts?.bootstrap ?? false;
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    if (bootstrap) setChecking(true);

    const watchdog = window.setTimeout(() => {
      if (document.visibilityState === "visible") {
        console.warn("ProtectedRoute: auth travou; recarregando página para destravar.");
        window.location.reload();
      }
    }, 12000);

    try {
      const { data, error } = await supabase.auth.getSession();
      if (!mountedRef.current) return;

      if (error || !data.session) {
        setAllowed(false);
        setChecking(false);
        navigate("/", { replace: true, state: { from: location } });
        return;
      }

      if (!requireAdmin) {
        setAllowed(true);
        setChecking(false);
        return;
      }

      const userId = data.session.user.id;

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
      clearTimeout(watchdog);
      inFlightRef.current = false;
      if (mountedRef.current && bootstrap) setChecking(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    // Bootstrap inicial (pode mostrar carregando)
    runCheck({ bootstrap: true });

    // Ao voltar pra aba: revalida em background (sem tela azul)
    const onVisibility = () => {
      if (document.visibilityState === "visible") runCheck({ bootstrap: false });
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
