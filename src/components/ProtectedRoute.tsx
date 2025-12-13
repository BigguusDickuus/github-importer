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
 * - Sem sessão -> "/"
 * - Com sessão -> renderiza children
 * - Se requireAdmin=true -> exige profiles.is_admin=true (senão "/dashboard")
 */
export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let retryTimer: any = null;

    const finish = (ok: boolean) => {
      if (!isMountedRef.current) return;
      setAllowed(ok);
      setChecking(false);
    };

    const goLanding = () => navigate("/", { replace: true, state: { from: location } });
    const goDashboard = () => navigate("/dashboard", { replace: true, state: { from: location } });

    const checkSession = async (attempt = 0) => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!isMountedRef.current) return;

        if (error) {
          const msg = (error as any)?.message ?? "";
          // ✅ erro intermitente pós-login: tenta novamente rapidamente
          if (msg.includes("Auth session missing") && attempt < 5) {
            retryTimer = setTimeout(() => checkSession(attempt + 1), 180);
            return;
          }

          console.error("Erro ao checar sessão:", error);
          finish(false);
          goLanding();
          return;
        }

        if (!data.session) {
          finish(false);
          goLanding();
          return;
        }

        if (requireAdmin) {
          const userId = data.session.user.id;

          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", userId)
            .maybeSingle();

          if (!isMountedRef.current) return;

          if (profileError) {
            console.error("Erro ao checar is_admin:", profileError);
            finish(false);
            goDashboard();
            return;
          }

          if (!profile?.is_admin) {
            finish(false);
            goDashboard();
            return;
          }
        }

        finish(true);
      } catch (err) {
        console.error("Erro inesperado ao checar sessão:", err);
        if (!isMountedRef.current) return;
        finish(false);
        goLanding();
      }
    };

    setChecking(true);
    setAllowed(false);
    checkSession(0);

    // Se a sessão “aparecer” depois, revalida
    const { data: listener } = supabase.auth.onAuthStateChange((_event, _session) => {
      if (!isMountedRef.current) return;
      setChecking(true);
      setAllowed(false);
      checkSession(0);
    });

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      listener?.subscription?.unsubscribe();
    };
  }, [navigate, location, requireAdmin]);

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
