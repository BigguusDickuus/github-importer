import { ReactNode, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

/**
 * Componente que protege rotas:
 * - Enquanto checa a sessão, mostra tela de "Carregando..."
 * - Se não tiver sessão, redireciona pra "/"
 * - Se tiver sessão, renderiza o children normalmente
 * - Se requireAdmin=true, exige profiles.is_admin=true (senão manda pra /dashboard)
 */
export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (error) {
          console.error("Erro ao checar sessão:", error);
          setAllowed(false);
          setChecking(false);
          navigate("/", { replace: true, state: { from: location } });
          return;
        }

        if (!data.session) {
          // Não tem sessão → manda pra landing
          setAllowed(false);
          setChecking(false);
          navigate("/", { replace: true, state: { from: location } });
          return;
        }

        // Tem sessão. Se rota exigir admin, valida is_admin
        if (requireAdmin) {
          const userId = data.session.user.id;

          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", userId)
            .maybeSingle();

          if (!isMounted) return;

          if (profileError) {
            console.error("Erro ao checar is_admin:", profileError);
            setAllowed(false);
            setChecking(false);
            navigate("/dashboard", { replace: true, state: { from: location } });
            return;
          }

          if (!profile?.is_admin) {
            // Logado, mas não-admin → volta pro dashboard
            setAllowed(false);
            setChecking(false);
            navigate("/dashboard", { replace: true, state: { from: location } });
            return;
          }
        }

        // Permite acesso
        setAllowed(true);
        setChecking(false);
      } catch (err) {
        console.error("Erro inesperado ao checar sessão:", err);
        if (!isMounted) return;
        setAllowed(false);
        setChecking(false);
        navigate("/", { replace: true, state: { from: location } });
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [navigate, location, requireAdmin]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-night-sky text-starlight-text">
        Carregando...
      </div>
    );
  }

  if (!allowed) {
    // Já estamos redirecionando, então não renderiza nada
    return null;
  }

  return <>{children}</>;
}
