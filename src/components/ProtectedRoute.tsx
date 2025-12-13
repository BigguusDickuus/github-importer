import { ReactNode, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

/**
 * Protege rotas:
 * - Enquanto checa a sessão, mostra "Carregando..."
 * - Se não tiver sessão, redireciona pra "/"
 * - Se requireAdmin=true, exige profiles.is_admin=true
 *
 * Correção anti-trava:
 * - Timeout no getSession
 * - Re-check quando a aba volta a ficar visível
 */
export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);

  const getSessionWithTimeout = async (ms: number) => {
    return await Promise.race([
      supabase.auth.getSession(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("GET_SESSION_TIMEOUT")), ms)),
    ]);
  };

  const runCheck = async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      setChecking(true);

      const { data, error } = (await getSessionWithTimeout(2500)) as Awaited<
        ReturnType<typeof supabase.auth.getSession>
      >;

      if (!mountedRef.current) return;

      if (error) {
        console.error("Erro ao checar sessão:", error);
        setAllowed(false);
        setChecking(false);
        navigate("/", { replace: true, state: { from: location } });
        return;
      }

      if (!data.session) {
        setAllowed(false);
        setChecking(false);
        navigate("/", { replace: true, state: { from: location } });
        return;
      }

      // Se não exige admin, liberou.
      if (!requireAdmin) {
        setAllowed(true);
        setChecking(false);
        return;
      }

      // Exige admin: checa is_admin
      const userId = data.session.user.id;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", userId)
        .maybeSingle();

      if (!mountedRef.current) return;

      if (profileError) {
        console.error("Erro ao checar is_admin:", profileError);
        setAllowed(false);
        setChecking(false);
        navigate("/dashboard", { replace: true, state: { from: location } });
        return;
      }

      if (!profile?.is_admin) {
        setAllowed(false);
        setChecking(false);
        navigate("/dashboard", { replace: true, state: { from: location } });
        return;
      }

      setAllowed(true);
      setChecking(false);
    } catch (err) {
      console.error("Erro inesperado ao checar sessão:", err);

      // Timeout ou erro intermitente: não deixa preso em "Carregando..."
      if (!mountedRef.current) return;
      setAllowed(false);
      setChecking(false);
      navigate("/", { replace: true, state: { from: location } });
    } finally {
      inFlightRef.current = false;
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    // 1) Checa ao montar / trocar rota
    runCheck();

    // 2) Quando a aba volta a ficar visível, re-checa (resolve o “travo ao voltar pra aba”)
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        runCheck();
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
