import { useState } from "react";
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
  Eye,
  AlertCircle,
  Menu,
  X,
  Sparkles,
  DollarSign,
  UserPlus,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from "recharts";

export function Admin() {
  const [selectedSection, setSelectedSection] = useState<string>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showAdjustCredits, setShowAdjustCredits] = useState(false);
  const [creditAdjustment, setCreditAdjustment] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "users", label: "Usuários", icon: Users },
    { id: "credits", label: "Ajustes de crédito", icon: CreditCard },
    { id: "logs", label: "Logs", icon: FileText },
  ];

  const stats = [
    { label: "Créditos vendidos (30 dias)", value: "2,450", icon: CreditCard, color: "mystic-indigo" },
    { label: "Usuários ativos", value: "342", icon: Users, color: "oracle-ember" },
    { label: "Leituras do mês", value: "1,856", icon: TrendingUp, color: "verdant-success" },
  ];

  const users = [
    { id: 1, email: "joao@example.com", date: "2025-11-15", credits: 12, role: "user" },
    { id: 2, email: "maria@example.com", date: "2025-11-10", credits: 5, role: "user" },
    { id: 3, email: "admin@example.com", date: "2025-10-01", credits: 100, role: "admin" },
  ];

  const renderContent = () => {
    switch (selectedSection) {
      case "dashboard":
        return <DashboardSection stats={stats} />;
      case "users":
        return (
          <UsersSection
            users={users}
            onSelectUser={(user) => {
              setSelectedUser(user);
            }}
          />
        );
      case "credits":
        return <CreditsSection />;
      case "logs":
        return <LogsSection />;
      default:
        return <DashboardSection stats={stats} />;
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

      <Header isLoggedIn={true} credits={100} />

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

      {/* User Detail Modal */}
      {selectedUser && (
        <Modal
          isOpen={!!selectedUser && !showAdjustCredits}
          onClose={() => setSelectedUser(null)}
          title="Detalhes do Usuário"
          footer={
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button
                onClick={() => setShowAdjustCredits(true)}
                className="flex-1 bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text"
              >
                Ajustar créditos
              </Button>
              <Button variant="outline" onClick={() => setSelectedUser(null)} className="flex-1">
                Fechar
              </Button>
            </div>
          }
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-moonlight-text text-sm mb-1">E-mail</p>
                <p className="text-starlight-text">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-moonlight-text text-sm mb-1">Data de cadastro</p>
                <p className="text-starlight-text">{new Date(selectedUser.date).toLocaleDateString("pt-BR")}</p>
              </div>
              <div>
                <p className="text-moonlight-text text-sm mb-1">Créditos</p>
                <p className="text-starlight-text text-2xl">{selectedUser.credits}</p>
              </div>
              <div>
                <p className="text-moonlight-text text-sm mb-1">Role</p>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${
                    selectedUser.role === "admin"
                      ? "bg-oracle-ember/10 border border-oracle-ember text-oracle-ember"
                      : "bg-mystic-indigo/10 border border-mystic-indigo text-mystic-indigo"
                  }`}
                >
                  {selectedUser.role}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Adjust Credits Modal */}
      <Modal
        isOpen={showAdjustCredits}
        onClose={() => {
          setShowAdjustCredits(false);
          setCreditAdjustment("");
          setAdjustmentReason("");
        }}
        title="Ajustar Créditos"
        footer={
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button
              disabled={!creditAdjustment || !adjustmentReason}
              className="flex-1 bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text disabled:opacity-50"
            >
              Confirmar ajuste
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowAdjustCredits(false);
                setCreditAdjustment("");
                setAdjustmentReason("");
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="p-4 bg-night-sky rounded-xl border border-obsidian-border">
            <p className="text-moonlight-text text-sm mb-1">Usuário</p>
            <p className="text-starlight-text">{selectedUser?.email}</p>
            <p className="text-moonlight-text text-sm mt-2">Saldo atual: {selectedUser?.credits} créditos</p>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-solar-warning/10 border border-solar-warning">
            <AlertCircle className="w-5 h-5 text-solar-warning flex-shrink-0 mt-0.5" />
            <p className="text-sm text-solar-warning">
              Use valores positivos para adicionar créditos ou negativos para remover. Esta ação será registrada nos
              logs.
            </p>
          </div>

          <div>
            <Label htmlFor="credits" className="text-moonlight-text mb-2 block">
              Ajuste de créditos
            </Label>
            <Input
              id="credits"
              type="number"
              placeholder="Ex: +10 ou -5"
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

      {/* Footer */}
      <footer className="relative z-10 border-t border-obsidian-border bg-midnight-surface/50 backdrop-blur-sm mt-auto">
        <style>{`
          @media (max-width: 767px) {
            .footer-container {
              padding-left: 5% !important;
              padding-right: 5% !important;
            }
          }
          @media (min-width: 768px) and (max-width: 922px) {
            .footer-container {
              padding-left: 5% !important;
              padding-right: 5% !important;
            }
          }
          @media (min-width: 923px) {
            .footer-container {
              padding-left: 64px !important;
              padding-right: 64px !important;
            }
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
                  Consultas de Tarot, Tarot Cigano e Cartomancia Clássica disponíveis 24/7 com interpretações profundas
                  e personalizadas.
                </small>
              </div>

              {/* Links - Serviços */}
              <div>
                <h3 className="text-base text-starlight-text mb-4">Serviços</h3>
                <ul className="space-y-3">
                  <li>
                    <Link
                      to="/dashboard"
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                    >
                      Tarot
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/dashboard"
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                    >
                      Tarot Cigano
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/dashboard"
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                    >
                      Cartomancia Clássica
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/historico"
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
                      onClick={() => {
                        /* TODO: implementar página */
                      }}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                    >
                      Sobre nós
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        /* TODO: implementar página */
                      }}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                    >
                      Termos de uso
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        /* TODO: implementar página */
                      }}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                    >
                      Política de privacidade
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        /* TODO: implementar página */
                      }}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                    >
                      Contato
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            {/* Copyright */}
            <div className="pt-8">
              <small className="block text-center text-moonlight-text/70">
                © 2024 Tarot Online. Todos os direitos reservados.
              </small>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function DashboardSection({ stats }: { stats: any[] }) {
  const [startDate, setStartDate] = useState("2024-11-01");
  const [endDate, setEndDate] = useState("2024-12-12");

  // Dados dos cards atualizados
  const dashboardStats = [
    { label: "Usuários totais", value: "1,245", icon: Users, color: "mystic-indigo" },
    { label: "Usuários ativos (30 dias)", value: "342", icon: Users, color: "oracle-ember" },
    { label: "Renda bruta (30 dias)", value: "R$ 12.450,00", icon: DollarSign, color: "verdant-success" },
    { label: "Créditos vendidos (30 dias)", value: "2,450", icon: CreditCard, color: "mystic-indigo" },
  ];

  // Dados de exemplo para os gráficos
  const revenueData = [
    { date: "01/11", value: 450 },
    { date: "05/11", value: 680 },
    { date: "10/11", value: 520 },
    { date: "15/11", value: 890 },
    { date: "20/11", value: 750 },
    { date: "25/11", value: 1020 },
    { date: "30/11", value: 880 },
    { date: "05/12", value: 1150 },
    { date: "10/12", value: 950 },
    { date: "12/12", value: 1100 },
  ];

  const creditsSoldData = [
    { date: "01/11", creditos: 90, pacotes: 18 },
    { date: "05/11", creditos: 136, pacotes: 27 },
    { date: "10/11", creditos: 104, pacotes: 21 },
    { date: "15/11", creditos: 178, pacotes: 36 },
    { date: "20/11", creditos: 150, pacotes: 30 },
    { date: "25/11", creditos: 204, pacotes: 41 },
    { date: "30/11", creditos: 176, pacotes: 35 },
    { date: "05/12", creditos: 230, pacotes: 46 },
    { date: "10/12", creditos: 190, pacotes: 38 },
    { date: "12/12", creditos: 220, pacotes: 44 },
  ];

  const packagesSoldData = [
    { date: "01/11", iniciante: 8, explorador: 7, mistico: 3 },
    { date: "05/11", iniciante: 12, explorador: 10, mistico: 5 },
    { date: "10/11", iniciante: 9, explorador: 8, mistico: 4 },
    { date: "15/11", iniciante: 16, explorador: 14, mistico: 6 },
    { date: "20/11", iniciante: 13, explorador: 12, mistico: 5 },
    { date: "25/11", iniciante: 18, explorador: 16, mistico: 7 },
    { date: "30/11", iniciante: 15, explorador: 14, mistico: 6 },
    { date: "05/12", iniciante: 20, explorador: 18, mistico: 8 },
    { date: "10/12", iniciante: 17, explorador: 15, mistico: 6 },
    { date: "12/12", iniciante: 19, explorador: 17, mistico: 8 },
  ];

  const creditsUsedData = [
    { date: "01/11", value: 75 },
    { date: "05/11", value: 110 },
    { date: "10/11", value: 95 },
    { date: "15/11", value: 145 },
    { date: "20/11", value: 128 },
    { date: "25/11", value: 168 },
    { date: "30/11", value: 152 },
    { date: "05/12", value: 198 },
    { date: "10/12", value: 165 },
    { date: "12/12", value: 185 },
  ];

  const usersData = [
    { date: "01/11", novos: 12, recorrentes: 45 },
    { date: "05/11", novos: 18, recorrentes: 52 },
    { date: "10/11", novos: 15, recorrentes: 48 },
    { date: "15/11", novos: 22, recorrentes: 65 },
    { date: "20/11", novos: 19, recorrentes: 58 },
    { date: "25/11", novos: 25, recorrentes: 72 },
    { date: "30/11", novos: 21, recorrentes: 68 },
    { date: "05/12", novos: 28, recorrentes: 80 },
    { date: "10/12", novos: 24, recorrentes: 75 },
    { date: "12/12", novos: 26, recorrentes: 78 },
  ];

  // Calcular totais
  const totalRevenue = revenueData.reduce((sum, item) => sum + item.value, 0);
  const totalCredits = creditsSoldData.reduce((sum, item) => sum + item.creditos, 0);
  const totalPackages = creditsSoldData.reduce((sum, item) => sum + item.pacotes, 0);
  const totalIniciante = packagesSoldData.reduce((sum, item) => sum + item.iniciante, 0);
  const totalExplorador = packagesSoldData.reduce((sum, item) => sum + item.explorador, 0);
  const totalMistico = packagesSoldData.reduce((sum, item) => sum + item.mistico, 0);
  const totalCreditsUsed = creditsUsedData.reduce((sum, item) => sum + item.value, 0);
  const totalNovos = usersData.reduce((sum, item) => sum + item.novos, 0);
  const totalRecorrentes = usersData.reduce((sum, item) => sum + item.recorrentes, 0);

  return (
    <div className="space-y-8">
      {/* Cards de estatísticas */}
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
            <p className="text-3xl text-starlight-text mb-2">{stat.value}</p>
            <p className="text-moonlight-text text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filtro de datas */}
      <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-6">
        <h3 className="text-starlight-text mb-4">Filtro de período</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        {/* Gráfico 1: Renda bruta */}
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

        {/* Gráfico 2: Créditos vendidos */}
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

        {/* Gráfico de barras: Pacotes vendidos por tipo */}
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

        {/* Gráfico 3: Créditos usados/Leituras */}
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

        {/* Gráfico 4: Novos usuários vs Recorrentes */}
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
      </div>
    </div>
  );
}

function UsersSection({ users, onSelectUser }: { users: any[]; onSelectUser: (user: any) => void }) {
  const [searchKey, setSearchKey] = useState("email");
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUserDetail, setSelectedUserDetail] = useState<any>(null);
  const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);
  const [showReadingHistory, setShowReadingHistory] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [creditAdjustment, setCreditAdjustment] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");

  // Dados mockados de usuários com informações completas
  const mockUsers = [
    {
      uuid: "550e8400-e29b-41d4-a716-446655440000",
      nome: "João Silva",
      email: "joao.silva@example.com",
      telefone: "(11) 98765-4321",
      cpf: "123.456.789-00",
      credits: 45,
      role: "user",
      isOnline: true,
      purchases: [
        {
          id: 1,
          date: "2024-12-10 14:30",
          package: "Pacote Explorador",
          credits: 50,
          value: "R$ 89,90",
          status: "Aprovado",
        },
        {
          id: 2,
          date: "2024-11-25 09:15",
          package: "Pacote Iniciante",
          credits: 20,
          value: "R$ 39,90",
          status: "Aprovado",
        },
        {
          id: 3,
          date: "2024-11-10 16:45",
          package: "Pacote Iniciante",
          credits: 20,
          value: "R$ 39,90",
          status: "Aprovado",
        },
      ],
      readings: [
        { id: 1, date: "2024-12-12 10:20", oracle: "Tarot", modality: "Cruz Celta", credits: 3 },
        { id: 2, date: "2024-12-11 15:30", oracle: "Lenormand", modality: "Linha do Tempo", credits: 2 },
        { id: 3, date: "2024-12-10 18:45", oracle: "Tarot", modality: "Mandala Astrológica", credits: 5 },
        { id: 4, date: "2024-12-09 11:00", oracle: "Cartomancia Clássica", modality: "Resposta Direta", credits: 1 },
        { id: 5, date: "2024-12-08 20:15", oracle: "Tarot", modality: "Três Cartas", credits: 2 },
      ],
    },
    {
      uuid: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      nome: "Maria Santos",
      email: "maria.santos@example.com",
      telefone: "(21) 99876-5432",
      cpf: "987.654.321-00",
      credits: 12,
      role: "user",
      isOnline: false,
      purchases: [
        {
          id: 1,
          date: "2024-12-05 11:20",
          package: "Pacote Iniciante",
          credits: 20,
          value: "R$ 39,90",
          status: "Aprovado",
        },
      ],
      readings: [
        { id: 1, date: "2024-12-11 14:30", oracle: "Tarot", modality: "Resposta Direta", credits: 1 },
        { id: 2, date: "2024-12-09 16:20", oracle: "Lenormand", modality: "Grande Tableau", credits: 7 },
      ],
    },
    {
      uuid: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      nome: "Pedro Oliveira",
      email: "pedro.oliveira@example.com",
      telefone: "(11) 97654-3210",
      cpf: "456.789.123-00",
      credits: 78,
      role: "user",
      isOnline: true,
      purchases: [
        {
          id: 1,
          date: "2024-12-08 13:45",
          package: "Pacote Místico",
          credits: 100,
          value: "R$ 149,90",
          status: "Aprovado",
        },
      ],
      readings: [
        { id: 1, date: "2024-12-12 09:10", oracle: "Tarot", modality: "Cruz Celta", credits: 3 },
        { id: 2, date: "2024-12-11 12:30", oracle: "Tarot", modality: "Mandala Astrológica", credits: 5 },
        { id: 3, date: "2024-12-10 15:45", oracle: "Lenormand", modality: "Linha do Tempo", credits: 2 },
      ],
    },
    {
      uuid: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      nome: "Ana Costa",
      email: "ana.costa@example.com",
      telefone: "(31) 98765-1234",
      cpf: "789.123.456-00",
      credits: 5,
      role: "user",
      isOnline: false,
      purchases: [
        {
          id: 1,
          date: "2024-11-20 10:30",
          package: "Pacote Iniciante",
          credits: 20,
          value: "R$ 39,90",
          status: "Aprovado",
        },
      ],
      readings: [
        { id: 1, date: "2024-12-10 17:20", oracle: "Cartomancia Clássica", modality: "Resposta Direta", credits: 1 },
      ],
    },
    {
      uuid: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      nome: "Admin Sistema",
      email: "admin@tarotonline.com",
      telefone: "(11) 99999-9999",
      cpf: "000.000.000-00",
      credits: 1000,
      role: "admin",
      isOnline: true,
      purchases: [],
      readings: [],
    },
  ];

  const handleSearch = () => {
    if (!searchValue.trim()) {
      setSearchResults([]);
      return;
    }

    const results = mockUsers.filter((user) => {
      const value = searchValue.toLowerCase();
      switch (searchKey) {
        case "email":
          return user.email.toLowerCase().includes(value);
        case "nome":
          return user.nome.toLowerCase().includes(value);
        case "cpf":
          return user.cpf.replace(/\D/g, "").includes(value.replace(/\D/g, ""));
        case "telefone":
          return user.telefone.replace(/\D/g, "").includes(value.replace(/\D/g, ""));
        default:
          return false;
      }
    });

    setSearchResults(results);
    setSelectedUserDetail(null);
  };

  const handleUserClick = (user: any) => {
    setSelectedUserDetail(user);
  };

  const handleBackToSearch = () => {
    setSelectedUserDetail(null);
  };

  const handleAdjustCredits = () => {
    // TODO: Implementar ajuste de créditos
    console.log("Ajustar créditos:", creditAdjustment, adjustmentReason);
    setShowAdjustModal(false);
    setCreditAdjustment("");
    setAdjustmentReason("");
  };

  // Se tem um usuário selecionado, mostra os detalhes
  if (selectedUserDetail) {
    return (
      <div className="space-y-6">
        {/* Botão voltar */}
        <Button onClick={handleBackToSearch} variant="outline" className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar para busca
        </Button>

        {/* Header com status online/offline */}
        <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-mystic-indigo to-oracle-ember flex items-center justify-center">
                  <Users className="w-8 h-8 text-starlight-text" />
                </div>
                {/* Status indicator */}
                <div
                  className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-midnight-surface ${
                    selectedUserDetail.isOnline ? "bg-verdant-success" : "bg-moonlight-text"
                  }`}
                >
                  <div
                    className={`absolute inset-1 rounded-full ${
                      selectedUserDetail.isOnline ? "bg-verdant-success animate-ping opacity-75" : ""
                    }`}
                  ></div>
                </div>
              </div>
              <div>
                <h2 className="text-2xl text-starlight-text mb-1">{selectedUserDetail.nome}</h2>
                <p className="text-moonlight-text flex items-center gap-2">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      selectedUserDetail.isOnline ? "bg-verdant-success" : "bg-moonlight-text"
                    }`}
                  ></span>
                  {selectedUserDetail.isOnline ? "Online agora" : "Offline"}
                </p>
              </div>
            </div>
            <span
              className={`px-4 py-2 rounded-full text-sm ${
                selectedUserDetail.role === "admin"
                  ? "bg-oracle-ember/10 border border-oracle-ember text-oracle-ember"
                  : "bg-mystic-indigo/10 border border-mystic-indigo text-mystic-indigo"
              }`}
            >
              {selectedUserDetail.role}
            </span>
          </div>

          {/* Informações básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-moonlight-text text-sm mb-1">UUID</p>
              <p className="text-starlight-text text-sm font-mono break-all">{selectedUserDetail.uuid}</p>
            </div>
            <div>
              <p className="text-moonlight-text text-sm mb-1">Email</p>
              <p className="text-starlight-text">{selectedUserDetail.email}</p>
            </div>
            <div>
              <p className="text-moonlight-text text-sm mb-1">Telefone</p>
              <p className="text-starlight-text">{selectedUserDetail.telefone}</p>
            </div>
            <div>
              <p className="text-moonlight-text text-sm mb-1">CPF</p>
              <p className="text-starlight-text">{selectedUserDetail.cpf}</p>
            </div>
            <div>
              <p className="text-moonlight-text text-sm mb-1">Créditos atuais</p>
              <p className="text-starlight-text text-2xl">{selectedUserDetail.credits}</p>
            </div>
          </div>

          {/* Botão de ajuste de créditos */}
          <div className="mt-6 pt-6 border-t border-obsidian-border">
            <Button
              onClick={() => setShowAdjustModal(true)}
              className="bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Ajustar créditos
            </Button>
          </div>
        </div>

        {/* Histórico de compras */}
        <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-starlight-text">Histórico de compras ({selectedUserDetail.purchases.length})</h3>
            {selectedUserDetail.purchases.length > 0 && (
              <Button onClick={() => setShowPurchaseHistory(true)} variant="outline" size="sm">
                Ver todos
              </Button>
            )}
          </div>

          {selectedUserDetail.purchases.length === 0 ? (
            <p className="text-moonlight-text text-center py-8">Nenhuma compra realizada</p>
          ) : (
            <div className="space-y-3">
              {selectedUserDetail.purchases.slice(0, 3).map((purchase: any) => (
                <div key={purchase.id} className="p-4 bg-night-sky rounded-xl border border-obsidian-border">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-starlight-text mb-1">{purchase.package}</p>
                      <p className="text-moonlight-text text-sm">{purchase.date}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-moonlight-text text-xs">Créditos</p>
                        <p className="text-starlight-text">{purchase.credits}</p>
                      </div>
                      <div>
                        <p className="text-moonlight-text text-xs">Valor</p>
                        <p className="text-starlight-text">{purchase.value}</p>
                      </div>
                      <span className="px-3 py-1 bg-verdant-success/10 border border-verdant-success text-verdant-success rounded-full text-xs">
                        {purchase.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Histórico de leituras */}
        <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-starlight-text">Histórico de leituras ({selectedUserDetail.readings.length})</h3>
            {selectedUserDetail.readings.length > 0 && (
              <Button onClick={() => setShowReadingHistory(true)} variant="outline" size="sm">
                Ver todos
              </Button>
            )}
          </div>

          {selectedUserDetail.readings.length === 0 ? (
            <p className="text-moonlight-text text-center py-8">Nenhuma leitura realizada</p>
          ) : (
            <div className="space-y-3">
              {selectedUserDetail.readings.slice(0, 3).map((reading: any) => (
                <div key={reading.id} className="p-4 bg-night-sky rounded-xl border border-obsidian-border">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-starlight-text mb-1">
                        {reading.oracle} - {reading.modality}
                      </p>
                      <p className="text-moonlight-text text-sm">{reading.date}</p>
                    </div>
                    <div>
                      <p className="text-moonlight-text text-xs">Créditos usados</p>
                      <p className="text-starlight-text">{reading.credits}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de ajuste de créditos */}
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
                onClick={handleAdjustCredits}
                disabled={!creditAdjustment || !adjustmentReason}
                className="flex-1 bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text disabled:opacity-50"
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
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          }
        >
          <div className="space-y-6">
            <div className="p-4 bg-night-sky rounded-xl border border-obsidian-border">
              <p className="text-moonlight-text text-sm mb-1">Usuário</p>
              <p className="text-starlight-text">{selectedUserDetail.nome}</p>
              <p className="text-moonlight-text text-sm mt-2">Saldo atual: {selectedUserDetail.credits} créditos</p>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-solar-warning/10 border border-solar-warning">
              <AlertCircle className="w-5 h-5 text-solar-warning flex-shrink-0 mt-0.5" />
              <p className="text-sm text-solar-warning">
                Use valores positivos para adicionar créditos ou negativos para remover. Esta ação será registrada nos
                logs.
              </p>
            </div>

            <div>
              <Label htmlFor="credits" className="text-moonlight-text mb-2 block">
                Ajuste de créditos
              </Label>
              <Input
                id="credits"
                type="number"
                placeholder="Ex: +10 ou -5"
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

        {/* Modal de histórico de compras completo */}
        <Modal
          isOpen={showPurchaseHistory}
          onClose={() => setShowPurchaseHistory(false)}
          title={`Histórico completo de compras - ${selectedUserDetail.nome}`}
        >
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {selectedUserDetail.purchases.map((purchase: any) => (
              <div key={purchase.id} className="p-4 bg-night-sky rounded-xl border border-obsidian-border">
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-starlight-text mb-1">{purchase.package}</p>
                      <p className="text-moonlight-text text-sm">{purchase.date}</p>
                    </div>
                    <span className="px-3 py-1 bg-verdant-success/10 border border-verdant-success text-verdant-success rounded-full text-xs whitespace-nowrap">
                      {purchase.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-moonlight-text text-xs">Créditos</p>
                      <p className="text-starlight-text">{purchase.credits}</p>
                    </div>
                    <div>
                      <p className="text-moonlight-text text-xs">Valor</p>
                      <p className="text-starlight-text">{purchase.value}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Modal>

        {/* Modal de histórico de leituras completo */}
        <Modal
          isOpen={showReadingHistory}
          onClose={() => setShowReadingHistory(false)}
          title={`Histórico completo de leituras - ${selectedUserDetail.nome}`}
        >
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {selectedUserDetail.readings.map((reading: any) => (
              <div key={reading.id} className="p-4 bg-night-sky rounded-xl border border-obsidian-border">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-starlight-text mb-1">{reading.oracle}</p>
                    <p className="text-mystic-indigo text-sm mb-1">{reading.modality}</p>
                    <p className="text-moonlight-text text-xs">{reading.date}</p>
                  </div>
                  <div>
                    <p className="text-moonlight-text text-xs">Créditos usados</p>
                    <p className="text-starlight-text text-lg">{reading.credits}</p>
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

      {/* Filtro de busca */}
      <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-6">
        <h4 className="text-starlight-text mb-4">Buscar usuário</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="searchKey" className="text-moonlight-text mb-2 block text-sm">
              Buscar por
            </Label>
            <select
              id="searchKey"
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
              className="w-full bg-night-sky border border-obsidian-border rounded-xl px-4 py-3 text-starlight-text focus:outline-none focus:border-mystic-indigo transition-colors"
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
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="bg-night-sky border-obsidian-border text-starlight-text flex-1"
              />
              <Button
                onClick={handleSearch}
                className="bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text px-8"
              >
                Pesquisar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Resultados da busca */}
      {searchResults.length > 0 && (
        <div className="bg-midnight-surface border border-obsidian-border rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-obsidian-border">
            <h4 className="text-starlight-text">Resultados da busca ({searchResults.length})</h4>
          </div>

          {/* Desktop Table */}
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
                {searchResults.map((user) => (
                  <tr
                    key={user.uuid}
                    onClick={() => handleUserClick(user)}
                    className="border-b border-obsidian-border last:border-0 hover:bg-night-sky/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 text-starlight-text">{user.nome}</td>
                    <td className="px-6 py-4 text-starlight-text">{user.email}</td>
                    <td className="px-6 py-4 text-starlight-text">{user.cpf}</td>
                    <td className="px-6 py-4 text-starlight-text">{user.telefone}</td>
                    <td className="px-6 py-4 text-starlight-text">{user.credits}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${
                          user.role === "admin"
                            ? "bg-oracle-ember/10 border border-oracle-ember text-oracle-ember"
                            : "bg-mystic-indigo/10 border border-mystic-indigo text-mystic-indigo"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden p-4 space-y-3">
            {searchResults.map((user) => (
              <div
                key={user.uuid}
                onClick={() => handleUserClick(user)}
                className="bg-night-sky border border-obsidian-border rounded-xl p-4 cursor-pointer hover:border-mystic-indigo transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-starlight-text mb-1">{user.nome}</p>
                    <p className="text-moonlight-text text-sm">{user.email}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                      user.role === "admin"
                        ? "bg-oracle-ember/10 border border-oracle-ember text-oracle-ember"
                        : "bg-mystic-indigo/10 border border-mystic-indigo text-mystic-indigo"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-moonlight-text text-xs">CPF</p>
                    <p className="text-starlight-text">{user.cpf}</p>
                  </div>
                  <div>
                    <p className="text-moonlight-text text-xs">Telefone</p>
                    <p className="text-starlight-text">{user.telefone}</p>
                  </div>
                  <div>
                    <p className="text-moonlight-text text-xs">Créditos</p>
                    <p className="text-starlight-text">{user.credits}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mensagem quando não há resultados */}
      {searchResults.length === 0 && searchValue && (
        <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-8 text-center">
          <p className="text-moonlight-text">Nenhum usuário encontrado com os critérios informados.</p>
        </div>
      )}
    </div>
  );
}

function CreditsSection() {
  return (
    <div>
      <h3 className="text-starlight-text mb-6">Ajustes de Crédito Recentes</h3>
      <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-8 text-center">
        <p className="text-moonlight-text">Nenhum ajuste manual de crédito realizado recentemente.</p>
      </div>
    </div>
  );
}

function LogsSection() {
  return (
    <div>
      <h3 className="text-starlight-text mb-6">Logs do Sistema</h3>
      <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-8 text-center">
        <p className="text-moonlight-text">Visualização de logs em desenvolvimento.</p>
      </div>
    </div>
  );
}
