import { ReactNode, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Componente que protege rotas:
 * - Enquanto checa a sessão, mostra tela de "Carregando..."
 * - Se não tiver sessão, redireciona pra "/"
 * - Se tiver sessão, renderiza o children normalmente
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
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
          navigate("/", {
            replace: true,
            state: { from: location },
          });
          return;
        }

        if (!data.session) {
          // Não tem sessão → manda pra landing
          setAllowed(false);
          setChecking(false);
          navigate("/", {
            replace: true,
            state: { from: location },
          });
          return;
        }

        // Tem sessão → permite acesso
        setAllowed(true);
        setChecking(false);
      } catch (err) {
        console.error("Erro inesperado ao checar sessão:", err);
        if (!isMounted) return;
        setAllowed(false);
        setChecking(false);
        navigate("/", {
          replace: true,
          state: { from: location },
        });
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [navigate, location]);

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
