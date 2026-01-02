import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";

interface HeaderProps {
  isLoggedIn?: boolean;
  onBuyCredits?: () => void;
  onLoginClick?: () => void;
  onHowItWorksClick?: () => void;
}

export function Header({ isLoggedIn = false, onBuyCredits, onLoginClick, onHowItWorksClick }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [credits, setCredits] = useState<number | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const location = useLocation();

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(false);

  const fetchCredits = async () => {
    try {
      setCreditsLoading(true);

      // 1) Pega usuário atual
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Erro ao buscar usuário logado:", userError);
        setCredits(null);
        return;
      }

      if (!user) {
        // Não logado → sem saldo
        setCredits(null);
        return;
      }

      // 2) Pega saldo na tabela credit_balances
      const { data, error } = await supabase
        .from("credit_balances")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle(); // retorna null se não tiver linha

      if (error) {
        console.error("Erro ao buscar créditos:", error);
        // Se der erro de RLS ou qualquer outra coisa, melhor mostrar 0 do que quebrar
        setCredits(null);
        return;
      }

      if (!data) {
        // Sem linha -> assume saldo 0
        setCredits(0);
        return;
      }

      setCredits(data.balance ?? 0);
    } catch (err) {
      console.error("Erro inesperado ao buscar créditos:", err);
      setCredits(null);
    } finally {
      setCreditsLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Verifica se o usuário é admin (para exibir link do Admin no Header)
  useEffect(() => {
    const checkAdmin = async () => {
      if (!isLoggedIn) {
        setIsAdmin(false);
        return;
      }

      try {
        setAdminCheckLoading(true);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          setIsAdmin(false);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Erro ao buscar is_admin no profiles:", profileError);
          setIsAdmin(false);
          return;
        }

        setIsAdmin(!!(profile as any)?.is_admin);
      } finally {
        setAdminCheckLoading(false);
      }
    };

    checkAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }

    if (profileDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [profileDropdownOpen]);

  const publicLinks = [{ label: "Como funciona", href: "#como-funciona" }];

  const loggedInLinks: never[] = [];

  const links = isLoggedIn ? loggedInLinks : publicLinks;

  const handleHowItWorks = () => {
    setMobileMenuOpen(false);

    // Preferência: abrir o modal da Landing (quando o Header está sendo usado lá)
    if (onHowItWorksClick) {
      onHowItWorksClick();
      return;
    }

    // Fallback universal: volta para a Landing com um parâmetro de URL que faz a Landing abrir o modal
    navigate("/?howItWorks=1");
  };

  const handleLogout = async () => {
    // Fecha dropdown e menu mobile (se existirem)
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false); // se esse state existir no componente

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Erro ao sair:", error);
    } finally {
      navigate("/", { replace: true });
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-night-sky/60 border-b border-obsidian-border">
        <div
          className="w-full flex flex-col items-center justify-center md:px-16"
          style={{ paddingLeft: "32px", paddingRight: "32px" }}
        >
          <div className="w-full max-w-[1400px] flex flex-col items-center">
            <div className="flex items-center justify-between h-16 md:h-20 w-full">
              {/* Logo */}
              <Link to={isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-mystic-indigo to-oracle-ember flex items-center justify-center">
                  <img
                    src="https://jhlosmgvlvjaemtgrhka.supabase.co/storage/v1/object/public/images/mdo_logo.png"
                    alt="Mesa dos Oráculos"
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <span className="text-starlight-text transition-colors group-hover:text-mystic-indigo">
                  Mesa dos Oráculos
                </span>
              </Link>

              {/* Centro: Créditos - Desktop: absoluto centro | Mobile: centro entre logo e hambúrguer */}
              {isLoggedIn && (
                <button
                  onClick={onBuyCredits}
                  className="flex flex-col items-center hover:opacity-80 transition-opacity cursor-pointer md:absolute md:left-1/2 md:-translate-x-1/2"
                >
                  <span className="text-mystic-indigo text-2xl md:text-3xl leading-none">
                    {creditsLoading ? "…" : credits !== null ? credits : 0}
                  </span>
                  <span className="text-moonlight-text text-xs">créditos</span>
                </button>
              )}

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-6">
                {isLoggedIn ? (
                  <>
                    <button
                      onClick={onBuyCredits}
                      className="text-moonlight-text hover:text-starlight-text transition-colors text-sm"
                    >
                      Comprar créditos
                    </button>

                    <button
                      type="button"
                      onClick={handleHowItWorks}
                      className="text-moonlight-text hover:text-starlight-text transition-colors text-sm"
                    >
                      Como funciona
                    </button>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => navigate("/admin")}
                        className="text-moonlight-text hover:text-starlight-text transition-colors text-sm"
                      >
                        Admin
                      </button>
                    )}

                    {/* Dropdown Meu Perfil */}
                    <div className="relative" ref={dropdownRef}>
                      <button
                        onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                        className="flex items-center gap-2 text-moonlight-text hover:text-starlight-text transition-colors text-sm"
                      >
                        Meu perfil
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${profileDropdownOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      {profileDropdownOpen && (
                        <div
                          className="absolute right-0 top-full mt-2 w-56 bg-midnight-surface border border-obsidian-border rounded-xl shadow-xl"
                          style={{ padding: "12px" }}
                        >
                          {/* Links de navegação */}
                          <button
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              navigate("/profile");
                            }}
                            className="w-full text-left text-sm text-moonlight-text hover:bg-night-sky hover:text-starlight-text transition-colors rounded-lg"
                            style={{ padding: "10px 12px", marginBottom: "4px" }}
                          >
                            Configurações
                          </button>

                          <button
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              navigate("/History");
                            }}
                            className="w-full text-left text-sm text-moonlight-text hover:bg-night-sky hover:text-starlight-text transition-colors rounded-lg"
                            style={{ padding: "10px 12px", marginBottom: "4px" }}
                          >
                            Histórico de leituras
                          </button>

                          <button
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              navigate("/TransactionHistory");
                            }}
                            className="w-full text-left text-sm text-moonlight-text hover:bg-night-sky hover:text-starlight-text transition-colors rounded-lg"
                            style={{ padding: "10px 12px", marginBottom: "12px" }}
                          >
                            Histórico de transações
                          </button>

                          {/* Separador */}
                          <div className="border-t border-obsidian-border" style={{ marginBottom: "12px" }}></div>

                          {/* Botão de Sair destacado */}
                          <button
                            onClick={handleLogout}
                            className="w-full text-sm text-starlight-text bg-blood-moon-error/20 hover:bg-blood-moon-error/30 border border-blood-moon-error/40 rounded-lg transition-colors"
                            style={{ padding: "10px 12px" }}
                          >
                            Sair
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleHowItWorks}
                      className="text-moonlight-text hover:text-starlight-text transition-colors text-sm"
                    >
                      Como funciona
                    </button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onLoginClick}
                      className="text-starlight-text"
                      style={{ height: "44px", paddingLeft: "24px", paddingRight: "24px" }}
                    >
                      Login / Criar conta
                    </Button>
                  </>
                )}
              </nav>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden w-10 h-10 flex items-center justify-center text-starlight-text hover:text-mystic-indigo transition-colors"
                aria-label="Menu"
                style={{ margin: 0, padding: 0, width: "40px", height: "40px" }}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 top-16 z-40 bg-transparent"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Menu */}
          <div
            className="md:hidden fixed top-16 z-50 w-full flex justify-center pointer-events-none"
            style={{ paddingLeft: "32px", paddingRight: "32px" }}
          >
            <nav
              className="bg-night-sky/95 backdrop-blur-lg rounded-2xl border border-obsidian-border flex flex-col w-full pointer-events-auto"
              style={{ padding: "15px" }}
            >
              {!isLoggedIn && (
                <button
                  type="button"
                  onClick={handleHowItWorks}
                  className="text-starlight-text hover:text-mystic-indigo transition-colors px-4 rounded-lg hover:bg-midnight-surface text-center"
                  style={{ fontSize: "1rem", marginBottom: "16px", paddingTop: "12px", paddingBottom: "12px" }}
                >
                  Como funciona
                </button>
              )}

              <div
                style={{ paddingTop: links.length > 0 ? "16px" : "0" }}
                className={
                  links.length > 0 ? "border-t border-obsidian-border flex flex-col gap-3" : "flex flex-col gap-3"
                }
              >
                {isLoggedIn ? (
                  <>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onBuyCredits?.();
                      }}
                      style={{ height: "44px" }}
                    >
                      Comprar créditos
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate("/profile");
                      }}
                      style={{ height: "44px" }}
                    >
                      Configurações
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          navigate("/admin");
                        }}
                        style={{ height: "44px" }}
                      >
                        Admin
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate("/historico");
                      }}
                      style={{ height: "44px" }}
                    >
                      Histórico de leituras
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate("/transacoes");
                      }}
                      style={{ height: "44px" }}
                    >
                      Histórico de transações
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full !bg-blood-moon-error/20 hover:!bg-blood-moon-error/30 !border-blood-moon-error/40 !text-starlight-text"
                      onClick={handleLogout}
                      style={{ height: "44px" }}
                    >
                      Sair
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full text-starlight-text"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onLoginClick?.();
                    }}
                    style={{ height: "44px" }}
                  >
                    Login / Criar conta
                  </Button>
                )}
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  );
}
