import { useState } from "react";
import { Header } from "./Header";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Modal } from "./Modal";
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
} from "lucide-react";

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
    <div className="min-h-screen bg-night-sky">
      <Header isLoggedIn={true} credits={100} />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-starlight-text mb-2">Área Administrativa</h1>
            <p className="text-moonlight-text">Gerencie usuários, créditos e visualize estatísticas</p>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-10 h-10 flex items-center justify-center text-starlight-text hover:text-mystic-indigo transition-colors"
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
      </div>

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
                <p className="text-starlight-text">
                  {new Date(selectedUser.date).toLocaleDateString("pt-BR")}
                </p>
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
              Use valores positivos para adicionar créditos ou negativos para remover. Esta ação será registrada nos logs.
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
    </div>
  );
}

function DashboardSection({ stats }: { stats: any[] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
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
    </div>
  );
}

function UsersSection({ users, onSelectUser }: { users: any[]; onSelectUser: (user: any) => void }) {
  return (
    <div>
      <h3 className="text-starlight-text mb-6">Gerenciar Usuários</h3>

      {/* Desktop Table */}
      <div className="hidden md:block bg-midnight-surface border border-obsidian-border rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-obsidian-border">
              <th className="text-left px-6 py-4 text-moonlight-text">E-mail</th>
              <th className="text-left px-6 py-4 text-moonlight-text">Data de cadastro</th>
              <th className="text-left px-6 py-4 text-moonlight-text">Créditos</th>
              <th className="text-left px-6 py-4 text-moonlight-text">Role</th>
              <th className="text-right px-6 py-4 text-moonlight-text">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-obsidian-border last:border-0 hover:bg-night-sky/50 transition-colors">
                <td className="px-6 py-4 text-starlight-text">{user.email}</td>
                <td className="px-6 py-4 text-starlight-text">{new Date(user.date).toLocaleDateString("pt-BR")}</td>
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
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="sm" onClick={() => onSelectUser(user)} className="text-mystic-indigo">
                    <Eye className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {users.map((user) => (
          <div key={user.id} className="bg-midnight-surface border border-obsidian-border rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-starlight-text mb-1">{user.email}</p>
                <p className="text-moonlight-text text-sm">{new Date(user.date).toLocaleDateString("pt-BR")}</p>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${
                  user.role === "admin"
                    ? "bg-oracle-ember/10 border border-oracle-ember text-oracle-ember"
                    : "bg-mystic-indigo/10 border border-mystic-indigo text-mystic-indigo"
                }`}
              >
                {user.role}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-moonlight-text text-sm">Créditos</p>
                <p className="text-starlight-text text-xl">{user.credits}</p>
              </div>
              <Button
                size="sm"
                onClick={() => onSelectUser(user)}
                className="bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text"
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver
              </Button>
            </div>
          </div>
        ))}
      </div>
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
