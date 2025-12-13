import { ReactNode, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

/**
 * Protege rotas:
 * - Inicial: mostra "Carregando..."
 * - Depois: ao voltar pra aba, revalida sessão em background (sem tela azul)
 */
export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const [checking, setChecking] = useState(true); // só deve ser "true" no bootstrap
  const [allowed, setAllowed] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);
  const bootstrappedRef = useRef(false);

  const getSessionWithTimeout = async (ms: number) => {
    return await Promise.race([
      supabase.auth.getSession(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("GET_SESSION_TIMEOUT")), ms)),
    ]);
  };

  const runCheck = async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      // ✅ Só mostra tela azul se ainda não bootstrapou.
      if (!silent && !bootstrappedRef.current) setChecking(true);

      const { data, error } = (await getSessionWithTimeout(900)) as Awaited<
        ReturnType<typeof supabase.auth.getSession>
      >;

      if (!mountedRef.current) return;

      if (error || !data.session) {
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

      // requireAdmin => checa is_admin
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
        bootstrappedRef.current = true;

        navigate("/dashboard", { replace: true, state: { from: location } });
        return;
      }

      setAllowed(true);
      setChecking(false);
      bootstrappedRef.current = true;
    } catch (err) {
      console.error("ProtectedRoute: erro ao checar sessão:", err);

      if (!mountedRef.current) return;

      setAllowed(false);
      setChecking(false);
      bootstrappedRef.current = true;

      navigate("/", { replace: true, state: { from: location } });
    } finally {
      inFlightRef.current = false;
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    // Bootstrap (aqui pode ter tela azul)
    runCheck({ silent: false });

    // ✅ Ao voltar pra aba: recheck silencioso (sem tela azul)
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
