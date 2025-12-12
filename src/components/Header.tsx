import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";

interface HeaderProps {
  isLoggedIn?: boolean;
  onBuyCredits?: () => void;
  onLoginClick?: () => void;
}

export function Header({ isLoggedIn = false, onBuyCredits, onLoginClick }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const [credits, setCredits] = useState<number | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);

  const getUserIdFromSession = async (): Promise<string | null> => {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      // Esse é o erro que costuma acontecer logo após login; não “crava” estado errado.
      const msg = (error as any)?.message ?? "";
      if (msg.includes("Auth session missing")) return null;

      console.error("Erro ao checar sessão:", error);
      return null;
    }

    return data.session?.user?.id ?? null;
  };

  const fetchCreditsForUser = async (userId: string) => {
    const { data, error } = await supabase
      .from("credit_balances")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar créditos:", error);
      setCredits(null);
      return;
    }

    setCredits(data?.balance ?? 0);
  };

  const fetchIsAdminForUser = async (userId: string) => {
    const { data, error } = await supabase.from("profiles").select("is_admin").eq("id", userId).maybeSingle();

    if (error) {
      console.error("Erro ao buscar is_admin:", error);
      setIsAdmin(false);
      return;
    }

    setIsAdmin(!!data?.is_admin);
  };

  const fetchCredits = async () => {
    try {
      setCreditsLoading(true);

      const userId = await getUserIdFromSession();
      if (!userId) return;

      await fetchCreditsForUser(userId);
    } catch (err) {
      console.error("Erro inesperado ao buscar créditos:", err);
      setCredits(null);
    } finally {
      setCreditsLoading(false);
    }
  };

  const fetchIsAdmin = async () => {
    try {
      setAdminLoading(true);

      const userId = await getUserIdFromSession();
      if (!userId) return;

      await fetchIsAdminForUser(userId);
    } catch (err) {
      console.error("Erro inesperado ao buscar is_admin:", err);
      setIsAdmin(false);
    } finally {
      setAdminLoading(false);
    }
  };

  // 1) Recarrega por mudança de rota / isLoggedIn
  useEffect(() => {
    fetchCredits();

    if (isLoggedIn) fetchIsAdmin();
    else setIsAdmin(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, isLoggedIn]);

  // 2) ✅ O que realmente destrava: quando a sessão “aparece” após login, refaz fetch
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const userId = session?.user?.id ?? null;

      if (!userId) {
        setCredits(null);
        setIsAdmin(false);
        return;
      }

      // Só faz sentido buscar admin se a UI está no modo logado
      if (isLoggedIn) {
        setCreditsLoading(true);
        setAdminLoading(true);
        try {
          await Promise.all([fetchCreditsForUser(userId), fetchIsAdminForUser(userId)]);
        } finally {
          setCreditsLoading(false);
          setAdminLoading(false);
        }
      } else {
        // Se não está logado, pelo menos mantém credits coerente
        setCreditsLoading(true);
        try {
          await fetchCreditsForUser(userId);
        } finally {
          setCreditsLoading(false);
        }
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
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
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [profileDropdownOpen]);

  const publicLinks = [{ label: "Como funciona", href: "#como-funciona" }];
  const loggedInLinks: never[] = [];
  const links = isLoggedIn ? loggedInLinks : publicLinks;

  const showAdminLink = isLoggedIn && isAdmin;

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);

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
                  <Sparkles className="w-5 h-5 text-starlight-text" />
                </div>
                <span className="text-starlight-text transition-colors group-hover:text-mystic-indigo">
                  Tarot Online
                </span>
              </Link>

              {/* Centro: Créditos */}
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

                    {showAdminLink && (
                      <button
                        onClick={() => navigate("/admin")}
                        disabled={adminLoading}
                        className="text-moonlight-text hover:text-starlight-text transition-colors text-sm disabled:opacity-60"
                        title={adminLoading ? "Carregando..." : "Admin"}
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
                              navigate("/history");
                            }}
                            className="w-full text-left text-sm text-moonlight-text hover:bg-night-sky hover:text-starlight-text transition-colors rounded-lg"
                            style={{ padding: "10px 12px", marginBottom: "4px" }}
                          >
                            Histórico de leituras
                          </button>

                          <button
                            onClick={() => {
                              setProfileDropdownOpen(false);
                              navigate("/transaction-history");
                            }}
                            className="w-full text-left text-sm text-moonlight-text hover:bg-night-sky hover:text-starlight-text transition-colors rounded-lg"
                            style={{ padding: "10px 12px", marginBottom: "12px" }}
                          >
                            Histórico de transações
                          </button>

                          <div className="border-t border-obsidian-border" style={{ marginBottom: "12px" }} />

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
                    {links.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        className="text-moonlight-text hover:text-starlight-text transition-colors text-sm"
                      >
                        {link.label}
                      </Link>
                    ))}
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

              {/* Mobile Menu Toggle */}
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
          <div
            className="md:hidden fixed inset-0 top-16 z-40 bg-transparent"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div
            className="md:hidden fixed top-16 z-50 w-full flex justify-center pointer-events-none"
            style={{ paddingLeft: "32px", paddingRight: "32px" }}
          >
            <nav
              className="bg-night-sky/95 backdrop-blur-lg rounded-2xl border border-obsidian-border flex flex-col w-full pointer-events-auto"
              style={{ padding: "15px" }}
            >
              {links.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-starlight-text hover:text-mystic-indigo transition-colors px-4 rounded-lg hover:bg-midnight-surface text-center"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ fontSize: "1rem", marginBottom: "16px", paddingTop: "12px", paddingBottom: "12px" }}
                >
                  {link.label}
                </Link>
              ))}

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

                    {showAdminLink && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          navigate("/admin");
                        }}
                        style={{ height: "44px" }}
                        disabled={adminLoading}
                      >
                        Admin
                      </Button>
                    )}

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

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate("/history");
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
                        navigate("/transaction-history");
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
