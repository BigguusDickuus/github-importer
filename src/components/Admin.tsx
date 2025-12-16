import { useEffect, useMemo, useState } from "react";
import { Header } from "./Header";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Modal } from "./Modal";
import { Link } from "react-router-dom";
import {
  Users,
  LayoutDashboard,
  CreditCard,
  FileText,
  TrendingUp,
  AlertCircle,
  Menu,
  X,
  Sparkles,
  DollarSign,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { supabase } from "@/integrations/supabase/client";

type DashboardMetrics = {
  total_users: number;
  new_users: number;
  active_users: number;
  readings_total: number;
  readings_completed: number;
  tokens_in: number;
  tokens_out: number;
  gross_revenue_cents: number;
  credits_sold: number;
  packages_sold: number;
  credits_used: number;
};

type TimeseriesRow = {
  day: string; // date
  revenue_cents: number;
  credits_sold: number;
  packages_sold: number;
  packages_10: number;
  packages_25: number;
  packages_60: number;
  credits_used: number;
  readings_completed: number;
  new_users: number;
  active_users: number;
  tokens_in: number;
  tokens_out: number;
};

function formatDDMM(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

function formatBRLFromCents(cents: number) {
  const v = (cents ?? 0) / 100;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function packageLabelByCredits(creditsChange: number) {
  if (creditsChange === 10) return "Pacote Iniciante (10)";
  if (creditsChange === 25) return "Pacote Explorador (25)";
  if (creditsChange === 60) return "Pacote Místico (60)";
  return `Pacote (${creditsChange})`;
}

export function Admin() {
  const [selectedSection, setSelectedSection] = useState<string>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "users", label: "Usuários", icon: Users },
    { id: "credits", label: "Ajustes de crédito", icon: CreditCard },
    { id: "logs", label: "Logs", icon: FileText },
  ];

  const renderContent = () => {
    switch (selectedSection) {
      case "dashboard":
        return <DashboardSection />;
      case "users":
        return <UsersSection />;
      case "credits":
        return <CreditsSection />;
      case "logs":
        return <LogsSection />;
      default:
        return <DashboardSection />;
    }
  };

  return (
    <div className="min-h-screen bg-night-sky text-moonlight-text relative flex flex-col">
      {/* Background Gradients - Fixed */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-mystic-indigo/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-oracle-ember/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-mystic-indigo/10 rounded-full blur-[100px]" />
      </div>

      <Header isLoggedIn={true} />

      <main
        className="relative z-10 flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        style={{ marginTop: "calc(64px + 24px + 40px)", paddingBottom: "48px" }}
      >
        <style>{`
          @media (min-width: 768px) {
            main {
              margin-top: calc(80px + 24px + 40px) !important;
              padding-left: 32px !important;
              padding-right: 32px !important;
            }
          }
          @media (min-width: 1024px) {
            main {
              padding-left: 64px !important;
              padding-right: 64px !important;
            }
          }
        `}</style>

        <div className="flex items-center justify-between mb-8">
          <div className="flex-1 text-center">
            <h1 className="text-starlight-text mb-2">Área Administrativa</h1>
            <p className="text-moonlight-text">Gerencie usuários, créditos e visualize estatísticas</p>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-10 h-10 flex items-center justify-center text-starlight-text hover:text-mystic-indigo transition-colors absolute right-4"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <div className="lg:grid lg:grid-cols-5 gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block col-span-1">
            <nav className="bg-midnight-surface border border-obsidian-border rounded-2xl p-4 sticky top-24">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedSection(item.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 mb-2 transition-colors ${
                    selectedSection === item.id
                      ? "bg-mystic-indigo/10 text-mystic-indigo"
                      : "text-moonlight-text hover:bg-night-sky"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Mobile Menu Overlay */}
          {mobileMenuOpen && (
            <div className="lg:hidden fixed inset-0 top-16 z-40 bg-night-sky/95 backdrop-blur-lg">
              <nav className="flex flex-col p-6 gap-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedSection(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`text-left px-4 py-4 rounded-lg flex items-center gap-3 transition-colors ${
                      selectedSection === item.id
                        ? "bg-mystic-indigo text-starlight-text"
                        : "text-moonlight-text hover:bg-midnight-surface"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          )}

          {/* Content */}
          <div className="col-span-4 mt-6 lg:mt-0">{renderContent()}</div>
        </div>
      </main>

      {/* Footer */}
      <TarotOnlineFooter />
    </div>
  );
}

function DashboardSection() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");

  const [startDate, setStartDate] = useState(`${yyyy}-${mm}-01`);
  const [endDate, setEndDate] = useState(`${yyyy}-${mm}-${dd}`);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [rows, setRows] = useState<TimeseriesRow[]>([]);

  const fetchAll = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const { data: m, error: mErr } = await supabase.rpc("admin_get_dashboard_metrics" as any, {
        _start: startDate,
        _end: endDate,
      });

      if (mErr) throw mErr;
      setMetrics(m as any);

      const { data: ts, error: tsErr } = await supabase.rpc("admin_get_dashboard_timeseries" as any, {
        _start: startDate,
        _end: endDate,
      });

      if (tsErr) throw tsErr;
      setRows((ts as any[]) ?? []);
    } catch (e: any) {
      console.error("Erro ao carregar dashboard admin:", e);
      setErrorMsg(e?.message ?? "Erro ao carregar métricas");
      setMetrics(null);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dashboardStats = useMemo(() => {
    const totalUsers = metrics?.total_users ?? 0;
    const activeUsers = metrics?.active_users ?? 0;
    const revenue = metrics?.gross_revenue_cents ?? 0;
    const creditsSold = metrics?.credits_sold ?? 0;

    return [
      { label: "Usuários totais", value: totalUsers.toLocaleString("pt-BR"), icon: Users, color: "mystic-indigo" },
      {
        label: "Usuários ativos (período)",
        value: activeUsers.toLocaleString("pt-BR"),
        icon: Users,
        color: "oracle-ember",
      },
      {
        label: "Renda bruta (período)",
        value: formatBRLFromCents(revenue),
        icon: DollarSign,
        color: "verdant-success",
      },
      {
        label: "Créditos vendidos (período)",
        value: creditsSold.toLocaleString("pt-BR"),
        icon: CreditCard,
        color: "mystic-indigo",
      },
    ];
  }, [metrics]);

  const revenueData = useMemo(
    () => rows.map((r) => ({ date: formatDDMM(r.day), value: Math.round((r.revenue_cents ?? 0) / 100) })),
    [rows],
  );

  const creditsSoldData = useMemo(
    () =>
      rows.map((r) => ({
        date: formatDDMM(r.day),
        creditos: r.credits_sold ?? 0,
        pacotes: r.packages_sold ?? 0,
      })),
    [rows],
  );

  const packagesSoldData = useMemo(
    () =>
      rows.map((r) => ({
        date: formatDDMM(r.day),
        iniciante: r.packages_10 ?? 0,
        explorador: r.packages_25 ?? 0,
        mistico: r.packages_60 ?? 0,
      })),
    [rows],
  );

  const creditsUsedData = useMemo(
    () => rows.map((r) => ({ date: formatDDMM(r.day), value: r.readings_completed ?? 0 })),
    [rows],
  );

  const usersData = useMemo(() => {
    return rows.map((r) => {
      const novos = r.new_users ?? 0;
      const ativos = r.active_users ?? 0;
      const recorrentes = Math.max(0, ativos - novos);
      return { date: formatDDMM(r.day), novos, recorrentes };
    });
  }, [rows]);

  const tokensData = useMemo(
    () =>
      rows.map((r) => ({
        date: formatDDMM(r.day),
        entrada: r.tokens_in ?? 0,
        saida: r.tokens_out ?? 0,
      })),
    [rows],
  );

  const totalRevenue = useMemo(() => revenueData.reduce((sum, item) => sum + (item.value ?? 0), 0), [revenueData]);
  const totalCredits = useMemo(
    () => creditsSoldData.reduce((sum, item) => sum + (item.creditos ?? 0), 0),
    [creditsSoldData],
  );
  const totalPackages = useMemo(
    () => creditsSoldData.reduce((sum, item) => sum + (item.pacotes ?? 0), 0),
    [creditsSoldData],
  );

  const totalIniciante = useMemo(
    () => packagesSoldData.reduce((sum, i) => sum + (i.iniciante ?? 0), 0),
    [packagesSoldData],
  );
  const totalExplorador = useMemo(
    () => packagesSoldData.reduce((sum, i) => sum + (i.explorador ?? 0), 0),
    [packagesSoldData],
  );
  const totalMistico = useMemo(
    () => packagesSoldData.reduce((sum, i) => sum + (i.mistico ?? 0), 0),
    [packagesSoldData],
  );

  const totalCreditsUsed = useMemo(
    () => creditsUsedData.reduce((sum, item) => sum + (item.value ?? 0), 0),
    [creditsUsedData],
  );
  const totalNovos = useMemo(() => usersData.reduce((sum, item) => sum + (item.novos ?? 0), 0), [usersData]);
  const totalRecorrentes = useMemo(
    () => usersData.reduce((sum, item) => sum + (item.recorrentes ?? 0), 0),
    [usersData],
  );
  const totalTokensEntrada = useMemo(
    () => tokensData.reduce((sum, item) => sum + (item.entrada ?? 0), 0),
    [tokensData],
  );
  const totalTokensSaida = useMemo(() => tokensData.reduce((sum, item) => sum + (item.saida ?? 0), 0), [tokensData]);
  const totalTokensGeral = totalTokensEntrada + totalTokensSaida;

  return (
    <div className="space-y-8">
      {errorMsg && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blood-moon-error/10 border border-blood-moon-error/40">
          <AlertCircle className="w-5 h-5 text-blood-moon-error flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blood-moon-error">
            {errorMsg}
            <div className="mt-2">
              <Button variant="outline" onClick={fetchAll}>
                Tentar novamente
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat, index) => (
          <div
            key={index}
            className="bg-midnight-surface border border-obsidian-border rounded-2xl p-6 hover:border-mystic-indigo transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-${stat.color}/10 flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}`} />
              </div>
            </div>
            <p className="text-3xl text-starlight-text mb-2">{loading ? "…" : stat.value}</p>
            <p className="text-moonlight-text text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filtro */}
      <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-starlight-text">Filtro de período</h3>
          <Button
            onClick={fetchAll}
            disabled={loading}
            className="h-11 px-6 bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text"
          >
            {loading ? "Atualizando..." : "Aplicar"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <Label htmlFor="startDate" className="text-moonlight-text mb-2 block text-sm">
              Data inicial
            </Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-night-sky border-obsidian-border text-starlight-text"
            />
          </div>
          <div>
            <Label htmlFor="endDate" className="text-moonlight-text mb-2 block text-sm">
              Data final
            </Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-night-sky border-obsidian-border text-starlight-text"
            />
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="space-y-6">
        <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-6">
          <h3 className="text-starlight-text mb-6">Renda bruta</h3>
          <div className="mb-4 flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-night-sky rounded-lg border border-obsidian-border">
              <div className="w-3 h-3 rounded-full bg-verdant-success"></div>
              <span className="text-sm text-moonlight-text">
                Total: <span className="text-starlight-text">R$ {totalRevenue.toLocaleString("pt-BR")}</span>
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1f35" />
              <XAxis dataKey="date" stroke="#8b92b0" style={{ fontSize: "12px" }} />
              <YAxis stroke="#8b92b0" style={{ fontSize: "12px" }} tickFormatter={(value) => `R$ ${value}`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#101322",
                  border: "1px solid #1a1f35",
                  borderRadius: "12px",
                  color: "#e5e7f0",
                }}
                formatter={(value: any) => [`R$ ${value}`, "Renda"]}
              />
              <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-6">
          <h3 className="text-starlight-text mb-6">Créditos vendidos × Pacotes vendidos</h3>
          <div className="mb-4 flex justify-center flex-wrap gap-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-night-sky rounded-lg border border-obsidian-border">
              <div className="w-3 h-3 rounded-full bg-mystic-indigo"></div>
              <span className="text-sm text-moonlight-text">
                Créditos: <span className="text-starlight-text">{totalCredits.toLocaleString("pt-BR")}</span>
              </span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-night-sky rounded-lg border border-obsidian-border">
              <div className="w-3 h-3 rounded-full bg-verdant-success"></div>
              <span className="text-sm text-moonlight-text">
                Pacotes: <span className="text-starlight-text">{totalPackages.toLocaleString("pt-BR")}</span>
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={creditsSoldData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1f35" />
              <XAxis dataKey="date" stroke="#8b92b0" style={{ fontSize: "12px" }} />
              <YAxis stroke="#8b92b0" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#101322",
                  border: "1px solid #1a1f35",
                  borderRadius: "12px",
                  color: "#e5e7f0",
                }}
              />
              <Line
                type="monotone"
                dataKey="creditos"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: "#6366f1", r: 4 }}
                name="creditos"
              />
              <Line
                type="monotone"
                dataKey="pacotes"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: "#10b981", r: 4 }}
                name="pacotes"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-6">
          <h3 className="text-starlight-text mb-6">Pacotes vendidos por tipo</h3>
          <div className="mb-4 flex justify-center flex-wrap gap-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-night-sky rounded-lg border border-obsidian-border">
              <div className="w-3 h-3 rounded-full bg-mystic-indigo"></div>
              <span className="text-sm text-moonlight-text">
                Iniciante: <span className="text-starlight-text">{totalIniciante.toLocaleString("pt-BR")}</span>
              </span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-night-sky rounded-lg border border-obsidian-border">
              <div className="w-3 h-3 rounded-full bg-verdant-success"></div>
              <span className="text-sm text-moonlight-text">
                Explorador: <span className="text-starlight-text">{totalExplorador.toLocaleString("pt-BR")}</span>
              </span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-night-sky rounded-lg border border-obsidian-border">
              <div className="w-3 h-3 rounded-full bg-oracle-ember"></div>
              <span className="text-sm text-moonlight-text">
                Místico: <span className="text-starlight-text">{totalMistico.toLocaleString("pt-BR")}</span>
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={packagesSoldData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1f35" />
              <XAxis dataKey="date" stroke="#8b92b0" style={{ fontSize: "12px" }} />
              <YAxis stroke="#8b92b0" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#101322",
                  border: "1px solid #1a1f35",
                  borderRadius: "12px",
                  color: "#e5e7f0",
                }}
              />
              <Bar dataKey="iniciante" fill="#6366f1" name="iniciante" radius={[4, 4, 0, 0]} />
              <Bar dataKey="explorador" fill="#10b981" name="explorador" radius={[4, 4, 0, 0]} />
              <Bar dataKey="mistico" fill="#f97316" name="mistico" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-6">
          <h3 className="text-starlight-text mb-6">Créditos usados / Leituras feitas</h3>
          <div className="mb-4 flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-night-sky rounded-lg border border-obsidian-border">
              <div className="w-3 h-3 rounded-full bg-oracle-ember"></div>
              <span className="text-sm text-moonlight-text">
                Total: <span className="text-starlight-text">{totalCreditsUsed.toLocaleString("pt-BR")} leituras</span>
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={creditsUsedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1f35" />
              <XAxis dataKey="date" stroke="#8b92b0" style={{ fontSize: "12px" }} />
              <YAxis stroke="#8b92b0" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#101322",
                  border: "1px solid #1a1f35",
                  borderRadius: "12px",
                  color: "#e5e7f0",
                }}
                formatter={(value: any) => [`${value} leituras`, "Realizadas"]}
              />
              <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} dot={{ fill: "#f97316", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-6">
          <h3 className="text-starlight-text mb-6">Novos usuários × Usuários recorrentes</h3>
          <div className="mb-4 flex justify-center flex-wrap gap-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-night-sky rounded-lg border border-obsidian-border">
              <div className="w-3 h-3 rounded-full bg-mystic-indigo"></div>
              <span className="text-sm text-moonlight-text">
                Novos: <span className="text-starlight-text">{totalNovos.toLocaleString("pt-BR")}</span>
              </span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-night-sky rounded-lg border border-obsidian-border">
              <div className="w-3 h-3 rounded-full bg-verdant-success"></div>
              <span className="text-sm text-moonlight-text">
                Recorrentes: <span className="text-starlight-text">{totalRecorrentes.toLocaleString("pt-BR")}</span>
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={usersData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1f35" />
              <XAxis dataKey="date" stroke="#8b92b0" style={{ fontSize: "12px" }} />
              <YAxis stroke="#8b92b0" style={{ fontSize: "12px" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#101322",
                  border: "1px solid #1a1f35",
                  borderRadius: "12px",
                  color: "#e5e7f0",
                }}
              />
              <Line
                type="monotone"
                dataKey="novos"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: "#6366f1", r: 4 }}
                name="novos"
              />
              <Line
                type="monotone"
                dataKey="recorrentes"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: "#10b981", r: 4 }}
                name="recorrentes"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-6">
          <h3 className="text-starlight-text mb-6">Tokens GPT - Entrada × Saída</h3>
          <div className="mb-4 flex justify-center flex-wrap gap-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-night-sky rounded-lg border border-obsidian-border">
              <div className="w-3 h-3 rounded-full bg-mystic-indigo"></div>
              <span className="text-sm text-moonlight-text">
                Entrada: <span className="text-starlight-text">{totalTokensEntrada.toLocaleString("pt-BR")}</span>
              </span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-night-sky rounded-lg border border-obsidian-border">
              <div className="w-3 h-3 rounded-full bg-oracle-ember"></div>
              <span className="text-sm text-moonlight-text">
                Saída: <span className="text-starlight-text">{totalTokensSaida.toLocaleString("pt-BR")}</span>
              </span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-night-sky rounded-lg border border-obsidian-border">
              <div className="w-3 h-3 rounded-full bg-verdant-success"></div>
              <span className="text-sm text-moonlight-text">
                Total: <span className="text-starlight-text">{totalTokensGeral.toLocaleString("pt-BR")}</span>
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={tokensData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1f35" />
              <XAxis dataKey="date" stroke="#8b92b0" style={{ fontSize: "12px" }} />
              <YAxis
                stroke="#8b92b0"
                style={{ fontSize: "12px" }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#101322",
                  border: "1px solid #1a1f35",
                  borderRadius: "12px",
                  color: "#e5e7f0",
                }}
                formatter={(value: any) => [Number(value).toLocaleString("pt-BR"), ""]}
              />
              <Line
                type="monotone"
                dataKey="entrada"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: "#6366f1", r: 4 }}
                name="Entrada"
              />
              <Line
                type="monotone"
                dataKey="saida"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ fill: "#f97316", r: 4 }}
                name="Saída"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function UsersSection() {
  const [searchKey, setSearchKey] = useState<"email" | "nome" | "cpf" | "telefone">("email");
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(false);

  const [results, setResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);
  const [showReadingHistory, setShowReadingHistory] = useState(false);

  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [creditAdjustment, setCreditAdjustment] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");

  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<{ profile: any; purchases: any[]; readings: any[] } | null>(null);

  const handleSearch = async () => {
    const v = searchValue.trim();
    if (!v) {
      setResults([]);
      setSelectedUser(null);
      setDetail(null);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("admin_search_users" as any, {
        _search_key: searchKey,
        _search_value: v,
        _limit: 50,
      });

      if (error) throw error;
      setResults((data as any[]) ?? []);
      setSelectedUser(null);
      setDetail(null);
    } catch (e) {
      console.error("Erro ao buscar usuários:", e);
      setResults([]);
      setSelectedUser(null);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  };

  const openUser = async (user: any) => {
    setSelectedUser(user);
    setDetail(null);
    setDetailLoading(true);

    try {
      const { data, error } = await supabase.rpc("admin_get_user_detail" as any, {
        _user_id: user.id,
        _limit_purchases: 200,
        _limit_readings: 200,
      });

      if (error) throw error;
      const payload = data as any;
      setDetail({
        profile: payload?.profile ?? user,
        purchases: payload?.purchases ?? [],
        readings: payload?.readings ?? [],
      });
    } catch (e) {
      console.error("Erro ao carregar detalhe do usuário:", e);
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const applyAdjustment = async () => {
    if (!selectedUser) return;

    const delta = Number(creditAdjustment);
    if (!Number.isFinite(delta) || delta === 0) return;
    if (!adjustmentReason.trim()) return;

    try {
      const { data, error } = await supabase.rpc("admin_adjust_credits" as any, {
        _user_id: selectedUser.id,
        _credits_change: delta,
        _reason: adjustmentReason.trim(),
      });

      if (error) throw error;

      const newBalance = (data as any)?.new_balance ?? null;

      // atualiza em memória
      setResults((prev) => prev.map((r) => (r.id === selectedUser.id ? { ...r, balance: newBalance } : r)));
      setSelectedUser((prev: any) => (prev ? { ...prev, balance: newBalance } : prev));

      setDetail((prev) =>
        prev
          ? {
              ...prev,
              profile: { ...prev.profile, balance: newBalance },
            }
          : prev,
      );

      setShowAdjustModal(false);
      setCreditAdjustment("");
      setAdjustmentReason("");
    } catch (e) {
      console.error("Erro ao ajustar créditos:", e);
    }
  };

  // Tela de detalhe
  if (selectedUser) {
    const p = detail?.profile ?? selectedUser;
    const purchases = detail?.purchases ?? [];
    const readings = detail?.readings ?? [];

    return (
      <div className="space-y-6">
        <Button
          onClick={() => {
            setSelectedUser(null);
            setDetail(null);
          }}
          variant="outline"
          className="h-11 px-5 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para busca
        </Button>

        <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-mystic-indigo to-oracle-ember flex items-center justify-center">
                <Users className="w-8 h-8 text-starlight-text" />
              </div>
              <div>
                <h2 className="text-2xl text-starlight-text mb-1">{p.full_name || "Sem nome"}</h2>
                <p className="text-moonlight-text">{p.email}</p>
              </div>
            </div>

            <span
              className={`px-4 py-2 rounded-full text-sm ${
                p.is_admin
                  ? "bg-oracle-ember/10 border border-oracle-ember text-oracle-ember"
                  : "bg-mystic-indigo/10 border border-mystic-indigo text-mystic-indigo"
              }`}
            >
              {p.is_admin ? "admin" : "user"}
            </span>
          </div>

          {detailLoading && <p className="text-moonlight-text">Carregando detalhes...</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-moonlight-text text-sm mb-1">UUID</p>
              <p className="text-starlight-text text-sm font-mono break-all">{p.id}</p>
            </div>
            <div>
              <p className="text-moonlight-text text-sm mb-1">Telefone</p>
              <p className="text-starlight-text">{p.phone || "-"}</p>
            </div>
            <div>
              <p className="text-moonlight-text text-sm mb-1">CPF</p>
              <p className="text-starlight-text">{p.cpf || "-"}</p>
            </div>
            <div>
              <p className="text-moonlight-text text-sm mb-1">Créditos atuais</p>
              <p className="text-starlight-text text-2xl">{p.balance ?? 0}</p>
            </div>
            <div>
              <p className="text-moonlight-text text-sm mb-1">Cadastro</p>
              <p className="text-starlight-text">
                {p.created_at ? new Date(p.created_at).toLocaleDateString("pt-BR") : "-"}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-obsidian-border">
            <Button
              onClick={() => setShowAdjustModal(true)}
              className="h-11 px-6 bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Ajustar créditos
            </Button>
          </div>
        </div>

        <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-starlight-text">Histórico de compras ({purchases.length})</h3>
            {purchases.length > 0 && (
              <Button onClick={() => setShowPurchaseHistory(true)} variant="outline" size="sm" className="h-10 px-4">
                Ver todos
              </Button>
            )}
          </div>

          {purchases.length === 0 ? (
            <p className="text-moonlight-text text-center py-8">Nenhuma compra registrada</p>
          ) : (
            <div className="space-y-3">
              {purchases.slice(0, 3).map((t: any) => (
                <div key={t.id} className="p-4 bg-night-sky rounded-xl border border-obsidian-border">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-starlight-text mb-1">{packageLabelByCredits(t.credits_change)}</p>
                      <p className="text-moonlight-text text-sm">{new Date(t.created_at).toLocaleString("pt-BR")}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-moonlight-text text-xs">Créditos</p>
                        <p className="text-starlight-text">{t.credits_change}</p>
                      </div>
                      <div>
                        <p className="text-moonlight-text text-xs">Valor</p>
                        <p className="text-starlight-text">
                          {t.amount_cents ? formatBRLFromCents(t.amount_cents) : "-"}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-verdant-success/10 border border-verdant-success text-verdant-success rounded-full text-xs">
                        Aprovado
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-starlight-text">Histórico de leituras ({readings.length})</h3>
            {readings.length > 0 && (
              <Button onClick={() => setShowReadingHistory(true)} variant="outline" size="sm">
                Ver todos
              </Button>
            )}
          </div>

          {readings.length === 0 ? (
            <p className="text-moonlight-text text-center py-8">Nenhuma leitura registrada</p>
          ) : (
            <div className="space-y-3">
              {readings.slice(0, 3).map((r: any) => (
                <div key={r.id} className="p-4 bg-night-sky rounded-xl border border-obsidian-border">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-starlight-text mb-1">
                        {Array.isArray(r.oracle_types) ? r.oracle_types.join(", ") : "Leitura"}
                      </p>
                      <p className="text-moonlight-text text-sm">{new Date(r.created_at).toLocaleString("pt-BR")}</p>
                      <p className="text-moonlight-text text-xs mt-1">
                        Status: <span className="text-starlight-text">{r.status || "-"}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-moonlight-text text-xs">Créditos usados</p>
                      <p className="text-starlight-text">{r.total_credits_cost ?? 0}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ajuste de crédito */}
        <Modal
          isOpen={showAdjustModal}
          onClose={() => {
            setShowAdjustModal(false);
            setCreditAdjustment("");
            setAdjustmentReason("");
          }}
          title="Ajustar Créditos"
          footer={
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button
                onClick={applyAdjustment}
                disabled={!creditAdjustment || !adjustmentReason}
                className="flex-1 h-11 px-6 bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text disabled:opacity-50"
              >
                Confirmar ajuste
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAdjustModal(false);
                  setCreditAdjustment("");
                  setAdjustmentReason("");
                }}
                className="flex-1 h-11 px-6"
              >
                Cancelar
              </Button>
            </div>
          }
        >
          <div className="space-y-6">
            <div className="p-4 bg-night-sky rounded-xl border border-obsidian-border">
              <p className="text-moonlight-text text-sm mb-1">Usuário</p>
              <p className="text-starlight-text">{p.email}</p>
              <p className="text-moonlight-text text-sm mt-2">Saldo atual: {p.balance ?? 0} créditos</p>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-solar-warning/10 border border-solar-warning">
              <AlertCircle className="w-5 h-5 text-solar-warning flex-shrink-0 mt-0.5" />
              <p className="text-sm text-solar-warning">
                Use valores positivos para adicionar ou negativos para remover. A ação será registrada como
                tx_type=adjustment.
              </p>
            </div>

            <div>
              <Label htmlFor="credits" className="text-moonlight-text mb-2 block">
                Ajuste de créditos
              </Label>
              <Input
                id="credits"
                type="number"
                placeholder="Ex: 10 ou -5"
                value={creditAdjustment}
                onChange={(e) => setCreditAdjustment(e.target.value)}
                className="bg-night-sky border-obsidian-border text-starlight-text"
              />
            </div>

            <div>
              <Label htmlFor="reason" className="text-moonlight-text mb-2 block">
                Motivo do ajuste
              </Label>
              <textarea
                id="reason"
                rows={3}
                placeholder="Descreva o motivo deste ajuste..."
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                className="w-full bg-night-sky border border-obsidian-border rounded-xl px-4 py-3 text-starlight-text placeholder:text-moonlight-text focus:outline-none focus:border-mystic-indigo transition-colors resize-none"
              />
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={showPurchaseHistory}
          onClose={() => setShowPurchaseHistory(false)}
          title={`Histórico completo de compras - ${p.email}`}
        >
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {purchases.map((t: any) => (
              <div key={t.id} className="p-4 bg-night-sky rounded-xl border border-obsidian-border">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-starlight-text mb-1">{packageLabelByCredits(t.credits_change)}</p>
                      <p className="text-moonlight-text text-sm">{new Date(t.created_at).toLocaleString("pt-BR")}</p>
                    </div>
                    <span className="px-3 py-1 bg-verdant-success/10 border border-verdant-success text-verdant-success rounded-full text-xs whitespace-nowrap">
                      Aprovado
                    </span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-moonlight-text text-xs">Créditos</p>
                      <p className="text-starlight-text">{t.credits_change}</p>
                    </div>
                    <div>
                      <p className="text-moonlight-text text-xs">Valor</p>
                      <p className="text-starlight-text">{t.amount_cents ? formatBRLFromCents(t.amount_cents) : "-"}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Modal>

        <Modal
          isOpen={showReadingHistory}
          onClose={() => setShowReadingHistory(false)}
          title={`Histórico completo de leituras - ${p.email}`}
        >
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {readings.map((r: any) => (
              <div key={r.id} className="p-4 bg-night-sky rounded-xl border border-obsidian-border">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-starlight-text mb-1">
                      {Array.isArray(r.oracle_types) ? r.oracle_types.join(", ") : "Leitura"}
                    </p>
                    <p className="text-moonlight-text text-xs">{new Date(r.created_at).toLocaleString("pt-BR")}</p>
                    <p className="text-moonlight-text text-xs mt-1">
                      Status: <span className="text-starlight-text">{r.status || "-"}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-moonlight-text text-xs">Créditos usados</p>
                    <p className="text-starlight-text text-lg">{r.total_credits_cost ?? 0}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      </div>
    );
  }

  // Tela de busca
  return (
    <div className="space-y-6">
      <h3 className="text-starlight-text mb-6">Gerenciar Usuários</h3>

      <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-6">
        <h4 className="text-starlight-text mb-4">Buscar usuário</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <Label htmlFor="searchKey" className="text-moonlight-text mb-2 block text-sm">
              Buscar por
            </Label>
            <select
              id="searchKey"
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value as any)}
              className="h-11 w-full bg-night-sky border border-obsidian-border rounded-xl px-4 text-starlight-text focus:outline-none focus:border-mystic-indigo transition-colors"
            >
              <option value="email">E-mail</option>
              <option value="nome">Nome</option>
              <option value="cpf">CPF</option>
              <option value="telefone">Telefone</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="searchValue" className="text-moonlight-text mb-2 block text-sm">
              Valor da busca
            </Label>
            <div className="flex gap-2">
              <Input
                id="searchValue"
                type="text"
                placeholder={`Digite o ${searchKey}...`}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="h-11 bg-night-sky border-obsidian-border text-starlight-text flex-1"
              />
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="h-11 px-8 bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text disabled:opacity-60 whitespace-nowrap"
              >
                {loading ? "Buscando..." : "Pesquisar"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {results.length > 0 && (
        <div className="bg-midnight-surface border border-obsidian-border rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-obsidian-border">
            <h4 className="text-starlight-text">Resultados ({results.length})</h4>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-obsidian-border bg-night-sky/50">
                  <th className="text-left px-6 py-4 text-moonlight-text">Nome</th>
                  <th className="text-left px-6 py-4 text-moonlight-text">Email</th>
                  <th className="text-left px-6 py-4 text-moonlight-text">CPF</th>
                  <th className="text-left px-6 py-4 text-moonlight-text">Telefone</th>
                  <th className="text-left px-6 py-4 text-moonlight-text">Créditos</th>
                  <th className="text-left px-6 py-4 text-moonlight-text">Role</th>
                </tr>
              </thead>
              <tbody>
                {results.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => openUser(u)}
                    className="border-b border-obsidian-border last:border-0 hover:bg-night-sky/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 text-starlight-text">{u.full_name || "-"}</td>
                    <td className="px-6 py-4 text-starlight-text">{u.email}</td>
                    <td className="px-6 py-4 text-starlight-text">{u.cpf || "-"}</td>
                    <td className="px-6 py-4 text-starlight-text">{u.phone || "-"}</td>
                    <td className="px-6 py-4 text-starlight-text">{u.balance ?? 0}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${
                          u.is_admin
                            ? "bg-oracle-ember/10 border border-oracle-ember text-oracle-ember"
                            : "bg-mystic-indigo/10 border border-mystic-indigo text-mystic-indigo"
                        }`}
                      >
                        {u.is_admin ? "admin" : "user"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden p-4 space-y-3">
            {results.map((u) => (
              <div
                key={u.id}
                onClick={() => openUser(u)}
                className="bg-night-sky border border-obsidian-border rounded-xl p-4 cursor-pointer hover:border-mystic-indigo transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-starlight-text mb-1">{u.full_name || "-"}</p>
                    <p className="text-moonlight-text text-sm">{u.email}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                      u.is_admin
                        ? "bg-oracle-ember/10 border border-oracle-ember text-oracle-ember"
                        : "bg-mystic-indigo/10 border border-mystic-indigo text-mystic-indigo"
                    }`}
                  >
                    {u.is_admin ? "admin" : "user"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-moonlight-text text-xs">CPF</p>
                    <p className="text-starlight-text">{u.cpf || "-"}</p>
                  </div>
                  <div>
                    <p className="text-moonlight-text text-xs">Telefone</p>
                    <p className="text-starlight-text">{u.phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-moonlight-text text-xs">Créditos</p>
                    <p className="text-starlight-text">{u.balance ?? 0}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.length === 0 && searchValue.trim() && (
        <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-8 text-center">
          <p className="text-moonlight-text">Nenhum usuário encontrado.</p>
        </div>
      )}
    </div>
  );
}

function CreditsSection() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("admin_get_recent_logs" as any, { _limit: 200 });
      if (error) throw error;
      const all = (data as any[]) ?? [];
      setLogs(all.filter((l) => l.tx_type === "adjustment"));
    } catch (e) {
      console.error("Erro ao carregar ajustes:", e);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h3 className="text-starlight-text">Ajustes de Crédito Recentes</h3>
        <Button variant="outline" onClick={load} disabled={loading} className="h-11 px-6">
          {loading ? "Atualizando..." : "Atualizar"}
        </Button>
      </div>

      <div className="bg-midnight-surface border border-obsidian-border rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-obsidian-border">
          <p className="text-moonlight-text text-sm">
            Mostrando tx_type=adjustment (registros em <code className="text-starlight-text">credit_transactions</code>)
          </p>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-moonlight-text">Nenhum ajuste encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-obsidian-border bg-night-sky/50">
                  <th className="text-left px-6 py-4 text-moonlight-text">Data</th>
                  <th className="text-left px-6 py-4 text-moonlight-text">Usuário</th>
                  <th className="text-left px-6 py-4 text-moonlight-text">Δ Créditos</th>
                  <th className="text-left px-6 py-4 text-moonlight-text">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b border-obsidian-border last:border-0">
                    <td className="px-6 py-4 text-starlight-text">{new Date(l.created_at).toLocaleString("pt-BR")}</td>
                    <td className="px-6 py-4 text-starlight-text">{l.user_email || l.user_id}</td>
                    <td className="px-6 py-4 text-starlight-text">{l.credits_change}</td>
                    <td className="px-6 py-4 text-starlight-text">{l.description || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function LogsSection() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("admin_get_recent_logs" as any, { _limit: 200 });
      if (error) throw error;
      setLogs((data as any[]) ?? []);
    } catch (e) {
      console.error("Erro ao carregar logs:", e);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h3 className="text-starlight-text">Logs do Sistema</h3>
        <Button variant="outline" onClick={load} disabled={loading} className="h-11 px-6">
          {loading ? "Atualizando..." : "Atualizar"}
        </Button>
      </div>

      <div className="bg-midnight-surface border border-obsidian-border rounded-2xl overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-moonlight-text">Nenhum log encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-obsidian-border bg-night-sky/50">
                  <th className="text-left px-6 py-4 text-moonlight-text">Data</th>
                  <th className="text-left px-6 py-4 text-moonlight-text">Tipo</th>
                  <th className="text-left px-6 py-4 text-moonlight-text">Usuário</th>
                  <th className="text-left px-6 py-4 text-moonlight-text">Δ Créditos</th>
                  <th className="text-left px-6 py-4 text-moonlight-text">Valor</th>
                  <th className="text-left px-6 py-4 text-moonlight-text">Descrição</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b border-obsidian-border last:border-0">
                    <td className="px-6 py-4 text-starlight-text">{new Date(l.created_at).toLocaleString("pt-BR")}</td>
                    <td className="px-6 py-4 text-starlight-text">{l.tx_type}</td>
                    <td className="px-6 py-4 text-starlight-text">{l.user_email || l.user_id}</td>
                    <td className="px-6 py-4 text-starlight-text">{l.credits_change}</td>
                    <td className="px-6 py-4 text-starlight-text">
                      {l.amount_cents ? formatBRLFromCents(l.amount_cents) : "-"}
                    </td>
                    <td className="px-6 py-4 text-starlight-text">{l.description || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function TarotOnlineFooter() {
  type FooterModalId = "tarot" | "lenormand" | "cartomancia" | "about" | "terms" | "privacy" | "contact";

  const [activeModal, setActiveModal] = useState<FooterModalId | null>(null);

  // Contato (mailto sem destinatário por enquanto)
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");

  const closeModal = () => setActiveModal(null);

  const modalTitle = (() => {
    switch (activeModal) {
      case "tarot":
        return "Tarot";
      case "lenormand":
        return "Lenormand (Baralho Cigano)";
      case "cartomancia":
        return "Cartomancia Clássica";
      case "about":
        return "Sobre nós";
      case "terms":
        return "Termos de uso";
      case "privacy":
        return "Política de Privacidade";
      case "contact":
        return "Contato";
      default:
        return "";
    }
  })();

  const openMailto = () => {
    const subject = (contactSubject || "Contato pelo Tarot Online").trim();
    const body = [
      "Mensagem enviada pelo site Tarot Online",
      "",
      `Nome: ${contactName || "-"}`,
      `Email: ${contactEmail || "-"}`,
      "",
      "Mensagem:",
      contactMessage || "-",
      "",
    ].join("\n");

    // mailto sem destinatário (em branco) por enquanto
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const renderModalBody = () => {
    if (!activeModal) return null;

    if (activeModal === "tarot") {
      return (
        <div className="space-y-4 text-sm text-moonlight-text/80 leading-relaxed">
          <p>
            O Tarot é um oráculo simbólico tradicional, composto por Arcanos Maiores e Menores. Ele é usado para mapear
            contextos, tendências, forças internas e externas, e orientar decisões com base em padrões e arquétipos.
          </p>

          <div className="space-y-2">
            <h4 className="text-starlight-text text-base">Como usamos aqui no Tarot Online</h4>
            <p>
              Você escolhe um método (tiragem), embaralha e seleciona as cartas. A leitura entrega uma interpretação
              detalhada, conectando os símbolos ao seu tema e ao momento da pergunta.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-starlight-text text-base">Métodos disponíveis</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Carta do Dia — check-in rápido, energia do dia</li>
              <li>3 Cartas: Passado/Presente/Futuro — evolução de situação</li>
              <li>3 Cartas: Situação/Conselho/Tendência — ação prática</li>
              <li>Cruz Celta — leitura profunda de situações complexas</li>
              <li>Jogo de Decisão: Dois Caminhos — escolha entre opções</li>
              <li>Jogo de Relacionamento — dinâmica entre pessoas</li>
              <li>Linha do Tempo: 6 Meses — visão de médio prazo</li>
              <li>Mandala Geral — panorama completo da vida</li>
            </ul>
          </div>

          <p className="text-xs text-moonlight-text/60">
            Dica: para perguntas amplas, prefira Cruz Celta ou Mandala. Para decisões, Dois Caminhos. Para recados
            rápidos, Carta do Dia ou 3 Cartas.
          </p>
        </div>
      );
    }

    if (activeModal === "lenormand") {
      return (
        <div className="space-y-4 text-sm text-moonlight-text/80 leading-relaxed">
          <p>
            O Lenormand (conhecido popularmente como Baralho Cigano) é um oráculo de 36 cartas com símbolos diretos e
            objetivos. Ele é ótimo para clareza, desdobramentos e leitura prática de cenários.
          </p>

          <div className="space-y-2">
            <h4 className="text-starlight-text text-base">Como usamos aqui no Tarot Online</h4>
            <p>
              Você escolhe o método, embaralha e seleciona as cartas. A leitura interpreta combinações e conexões entre
              os símbolos, trazendo um mapa claro do tema consultado.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-starlight-text text-base">Métodos disponíveis</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Carta do Dia — recado rápido e direto</li>
              <li>Linha de 3 Cartas — perguntas objetivas, eventos próximos</li>
              <li>Linha de 5 Cartas — contexto + desenvolvimento + resultado</li>
              <li>Retrato 3x3 — visão panorâmica com nuances</li>
              <li>Tiragem de Relacionamento — dinâmica de casal/parceria</li>
              <li>Mesa Real / Grand Tableau — mapa completo da vida</li>
            </ul>
          </div>

          <p className="text-xs text-moonlight-text/60">
            Dica: se você quer objetividade e desdobramento, Linha 5 e Retrato 3x3 tendem a funcionar muito bem.
          </p>
        </div>
      );
    }

    if (activeModal === "cartomancia") {
      return (
        <div className="space-y-4 text-sm text-moonlight-text/80 leading-relaxed">
          <p>
            A Cartomancia Clássica usa o baralho tradicional de 52 cartas. É uma leitura muito prática para tendências,
            comportamentos, movimento de situações e leitura cotidiana.
          </p>

          <div className="space-y-2">
            <h4 className="text-starlight-text text-base">Como usamos aqui no Tarot Online</h4>
            <p>
              Você escolhe o método, embaralha e seleciona as cartas. A leitura interpreta naipes, números e
              combinações, trazendo direção e clareza para o tema consultado.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-starlight-text text-base">Métodos disponíveis</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Carta do Dia — insight rápido, clima do dia</li>
              <li>3 Cartas: Situação/Obstáculo/Conselho — perguntas objetivas</li>
              <li>Cruz Simples — mapa rápido da situação</li>
              <li>Ferradura — situações em movimento, caminhos</li>
              <li>Relacionamento — energia entre pessoas</li>
              <li>Leitura Geral: 9 Cartas — panorama completo</li>
            </ul>
          </div>

          <p className="text-xs text-moonlight-text/60">
            Dica: para movimento e próximos passos, Ferradura. Para visão geral, 9 Cartas.
          </p>
        </div>
      );
    }

    if (activeModal === "about") {
      return (
        <div className="space-y-4 text-sm text-moonlight-text/80 leading-relaxed">
          <p>
            Somos uma equipe de tarólogos e cartomantes que se uniu para criar uma plataforma digital de consultas — com
            a mesma profundidade e cuidado de uma leitura presencial.
          </p>
          <p>
            Aqui, a consulta começa pela sua intenção: a pergunta, o momento e o foco definem o caminho do jogo. O
            método escolhido e as cartas reveladas constroem um mapa simbólico que orienta com clareza, sensibilidade e
            respeito.
          </p>
          <p>
            Nosso objetivo é tirar o ruído, reduzir ansiedade e trazer direção — com leituras consistentes, práticas e
            cheias de significado.
          </p>
        </div>
      );
    }

    if (activeModal === "terms") {
      return (
        <div className="space-y-4 text-sm text-moonlight-text/80 leading-relaxed">
          <p className="text-moonlight-text/70">
            Última atualização: 2025. Ao usar o Tarot Online, você concorda com estes Termos.
          </p>

          <div className="space-y-2">
            <h4 className="text-starlight-text text-base">1. Conta e acesso</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Você é responsável pelas informações fornecidas e pela segurança do seu acesso.</li>
              <li>Podemos suspender ou encerrar contas em caso de violação destes Termos.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-starlight-text text-base">2. Créditos e uso do serviço</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>O acesso às leituras é feito por meio de créditos.</li>
              <li>Cada oráculo utilizado em uma consulta consome 1 crédito (regra atual do produto).</li>
              <li>Créditos são vinculados à sua conta e não são transferíveis.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-starlight-text text-base">3. Conduta e abuso do sistema</h4>
            <p>
              Para manter a plataforma justa e sustentável, é proibido tentar explorar promoções, bônus, descontos ou
              falhas do sistema.
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Criação de contas duplicadas para um mesmo usuário para obter bônus, vantagens ou condições indevidas;
              </li>
              <li>
                Uso de automações, scripts, scraping, engenharia reversa ou tentativa de burlar limites e proteções;
              </li>
              <li>Qualquer ação destinada a fraudar compras, estornos, créditos ou resultados.</li>
            </ul>
            <p className="text-moonlight-text/70">
              Em caso de abuso, nos reservamos o direito de <b>cancelar ou suspender a conta</b>, remover benefícios e{" "}
              <b>bloquear o acesso</b>, podendo haver <b>perda de créditos</b> e/ou <b>pagamentos</b>, sem reembolso,
              ressalvados direitos previstos em lei.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-starlight-text text-base">4. Limitações e responsabilidade</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>As leituras têm natureza interpretativa e simbólica, voltadas a autoconhecimento e orientação.</li>
              <li>Não substituem aconselhamento médico, psicológico, jurídico ou financeiro.</li>
              <li>Você é responsável por suas decisões e ações.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-starlight-text text-base">5. Pagamentos</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Compras de créditos podem ser processadas por provedores de pagamento.</li>
              <li>Em casos de falha técnica comprovada, podemos oferecer ajuste de créditos equivalente.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-starlight-text text-base">6. Alterações</h4>
            <p>
              Podemos atualizar estes Termos para refletir melhorias do serviço ou requisitos legais. Quando houver
              mudanças relevantes, apresentaremos a versão atualizada aqui.
            </p>
          </div>
        </div>
      );
    }

    if (activeModal === "privacy") {
      return (
        <div className="space-y-4 text-sm text-moonlight-text/80 leading-relaxed">
          <p className="text-moonlight-text/70">
            Última atualização: 2025. Esta Política descreve como tratamos seus dados em conformidade com a LGPD.
          </p>

          <div className="space-y-2">
            <h4 className="text-starlight-text text-base">1. Dados que coletamos</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Cadastro e conta: nome, email, data de nascimento, CPF e telefone (quando informados).</li>
              <li>Preferências: configurações do perfil (ex.: manter contexto, limites de uso).</li>
              <li>Uso do serviço: perguntas enviadas, oráculos selecionados, logs e resultados das leituras.</li>
              <li>Créditos: saldo e histórico de transações (compras, bônus, consumo e ajustes).</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-starlight-text text-base">2. Como usamos</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Entregar suas leituras e manter seu histórico.</li>
              <li>Gerenciar créditos, compras e segurança contra fraude/abuso.</li>
              <li>Melhorar a experiência do produto e a estabilidade do sistema.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-starlight-text text-base">3. Proteção e segurança</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Dados trafegam por conexão segura (TLS/HTTPS).</li>
              <li>Armazenamento e acesso seguem controles de segurança e permissões.</li>
              <li>Não vendemos seus dados e não os cedemos para marketing de terceiros.</li>
            </ul>
            <p className="text-moonlight-text/70">
              Podemos utilizar provedores essenciais (ex.: processamento de pagamento e infraestrutura) estritamente
              para operar o serviço, sempre com medidas de segurança e mínimo necessário.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-starlight-text text-base">4. Retenção</h4>
            <p>
              Mantemos dados e registros pelo tempo necessário para fornecer o serviço, cumprir obrigações legais e
              garantir segurança/antiabuso. Você pode solicitar exclusão quando aplicável, respeitando retenções
              obrigatórias.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-starlight-text text-base">5. Seus direitos</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Confirmar tratamento e acessar seus dados.</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
              <li>Solicitar anonimização, bloqueio ou eliminação quando aplicável.</li>
            </ul>
          </div>

          <p className="text-xs text-moonlight-text/60">
            Para solicitações relacionadas à privacidade, use o canal de Contato (em breve com email oficial dentro da
            plataforma).
          </p>
        </div>
      );
    }

    // contact
    return (
      <div className="space-y-4">
        <p className="text-sm text-moonlight-text/80 leading-relaxed">
          Preencha abaixo para montar uma mensagem. Por enquanto, ao enviar, abriremos o seu app de email com a mensagem
          pronta (sem destinatário preenchido).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-moonlight-text mb-2 block">Seu nome</Label>
            <Input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Ex.: Maria Silva"
              className="bg-night-sky border-obsidian-border text-starlight-text"
            />
          </div>
          <div>
            <Label className="text-moonlight-text mb-2 block">Seu email</Label>
            <Input
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="Ex.: maria@email.com"
              className="bg-night-sky border-obsidian-border text-starlight-text"
            />
          </div>
        </div>

        <div>
          <Label className="text-moonlight-text mb-2 block">Assunto</Label>
          <Input
            value={contactSubject}
            onChange={(e) => setContactSubject(e.target.value)}
            placeholder="Ex.: Dúvida sobre créditos / leitura / conta"
            className="bg-night-sky border-obsidian-border text-starlight-text"
          />
        </div>

        <div>
          <Label className="text-moonlight-text mb-2 block">Mensagem</Label>
          <textarea
            rows={5}
            value={contactMessage}
            onChange={(e) => setContactMessage(e.target.value)}
            placeholder="Escreva sua mensagem..."
            className="w-full bg-night-sky border border-obsidian-border rounded-xl px-4 py-3 text-starlight-text placeholder:text-moonlight-text focus:outline-none focus:border-mystic-indigo transition-colors resize-none"
          />
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={closeModal} type="button">
            Cancelar
          </Button>
          <Button
            onClick={() => openMailto()}
            type="button"
            className="bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text"
          >
            Abrir no email
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Modais do Footer */}
      <Modal isOpen={activeModal !== null} onClose={closeModal} title={modalTitle}>
        <div className="max-h-[70vh] overflow-y-auto pr-1">{renderModalBody()}</div>
      </Modal>

      {/* Footer */}
      <footer className="relative z-10 border-t border-obsidian-border bg-midnight-surface/50 backdrop-blur-sm mt-auto">
        <style>{`
          @media (max-width: 767px) {
            .footer-container { padding-left: 5% !important; padding-right: 5% !important; }
          }
          @media (min-width: 768px) and (max-width: 922px) {
            .footer-container { padding-left: 5% !important; padding-right: 5% !important; }
          }
          @media (min-width: 923px) {
            .footer-container { padding-left: 64px !important; padding-right: 64px !important; }
          }
        `}</style>

        <div className="footer-container w-full" style={{ paddingTop: "48px", paddingBottom: "48px" }}>
          <div className="max-w-[1400px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12" style={{ marginBottom: "80px" }}>
              {/* Logo e descrição */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-mystic-indigo to-oracle-ember flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-starlight-text" />
                  </div>
                  <span className="text-xl text-starlight-text">Tarot Online</span>
                </div>
                <small className="block text-moonlight-text/70 leading-relaxed">
                  Consultas de Tarot, Lenormand (Baralho Cigano) e Cartomancia Clássica disponíveis 24/7 com
                  interpretações profundas e personalizadas.
                </small>
              </div>

              {/* Links - Serviços */}
              <div>
                <h3 className="text-base text-starlight-text mb-4">Serviços</h3>
                <ul className="space-y-3">
                  <li>
                    <button
                      onClick={() => setActiveModal("tarot")}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                      type="button"
                    >
                      Tarot
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveModal("lenormand")}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                      type="button"
                    >
                      Lenormand (Baralho Cigano)
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveModal("cartomancia")}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                      type="button"
                    >
                      Cartomancia Clássica
                    </button>
                  </li>
                  <li>
                    <Link
                      to="/history"
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                    >
                      Histórico de leituras
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Links - Informações */}
              <div>
                <h3 className="text-base text-starlight-text mb-4">Informações</h3>
                <ul className="space-y-3">
                  <li>
                    <button
                      onClick={() => setActiveModal("about")}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                      type="button"
                    >
                      Sobre nós
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveModal("terms")}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                      type="button"
                    >
                      Termos de uso
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveModal("privacy")}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                      type="button"
                    >
                      Política de Privacidade
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveModal("contact")}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                      type="button"
                    >
                      Contato
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="pt-8 border-t border-obsidian-border flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-moonlight-text/60">© 2025 Tarot Online. Todos os direitos reservados.</p>
              <div className="flex items-center gap-6 text-sm text-moonlight-text/60">
                <span>Feito com 🔮 para você</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
