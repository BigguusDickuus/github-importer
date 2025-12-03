import { useState } from "react";
import { Header } from "./Header";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { User, Shield, Bell, CreditCard, Check } from "lucide-react";

export function Profile() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [readingReminders, setReadingReminders] = useState(false);

  return (
    <div className="min-h-screen bg-night-sky">
      <Header isLoggedIn={true} />

      <main className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-starlight-text mb-2">Meu Perfil</h1>
          <p className="text-moonlight-text">Gerencie suas informações e preferências</p>
        </div>

        {/* Mobile: Tabs as dropdown style */}
        <div className="md:hidden mb-6">
          <Tabs defaultValue="account" className="w-full">
            <TabsList className="w-full grid grid-cols-2 gap-2 bg-transparent">
              <TabsTrigger
                value="account"
                className="data-[state=active]:bg-mystic-indigo data-[state=active]:text-starlight-text"
              >
                <User className="w-4 h-4 mr-2" />
                Conta
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="data-[state=active]:bg-mystic-indigo data-[state=active]:text-starlight-text"
              >
                <Shield className="w-4 h-4 mr-2" />
                Segurança
              </TabsTrigger>
            </TabsList>
            <TabsList className="w-full grid grid-cols-2 gap-2 bg-transparent">
              <TabsTrigger
                value="notifications"
                className="data-[state=active]:bg-mystic-indigo data-[state=active]:text-starlight-text"
              >
                <Bell className="w-4 h-4 mr-2" />
                Notificações
              </TabsTrigger>
              <TabsTrigger
                value="billing"
                className="data-[state=active]:bg-mystic-indigo data-[state=active]:text-starlight-text"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Pagamentos
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="account">
                <AccountSection />
              </TabsContent>
              <TabsContent value="security">
                <SecuritySection twoFactorEnabled={twoFactorEnabled} setTwoFactorEnabled={setTwoFactorEnabled} />
              </TabsContent>
              <TabsContent value="notifications">
                <NotificationsSection
                  emailNotifications={emailNotifications}
                  setEmailNotifications={setEmailNotifications}
                  readingReminders={readingReminders}
                  setReadingReminders={setReadingReminders}
                />
              </TabsContent>
              <TabsContent value="billing">
                <BillingSection />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Desktop: Sidebar Layout */}
        <div className="hidden md:grid md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="col-span-1">
            <nav className="bg-midnight-surface border border-obsidian-border rounded-2xl p-4 sticky top-24">
              <button className="w-full text-left px-4 py-3 rounded-lg bg-mystic-indigo/10 text-mystic-indigo flex items-center gap-3 mb-2">
                <User className="w-5 h-5" />
                Conta
              </button>
              <button className="w-full text-left px-4 py-3 rounded-lg text-moonlight-text hover:bg-night-sky flex items-center gap-3 mb-2">
                <Shield className="w-5 h-5" />
                Segurança
              </button>
              <button className="w-full text-left px-4 py-3 rounded-lg text-moonlight-text hover:bg-night-sky flex items-center gap-3 mb-2">
                <Bell className="w-5 h-5" />
                Notificações
              </button>
              <button className="w-full text-left px-4 py-3 rounded-lg text-moonlight-text hover:bg-night-sky flex items-center gap-3">
                <CreditCard className="w-5 h-5" />
                Pagamentos
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="col-span-3 space-y-8">
            <AccountSection />
            <SecuritySection twoFactorEnabled={twoFactorEnabled} setTwoFactorEnabled={setTwoFactorEnabled} />
            <NotificationsSection
              emailNotifications={emailNotifications}
              setEmailNotifications={setEmailNotifications}
              readingReminders={readingReminders}
              setReadingReminders={setReadingReminders}
            />
            <BillingSection />
          </div>
        </div>
      </main>
    </div>
  );
}

function AccountSection() {
  return (
    <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-6 md:p-8">
      <h3 className="text-starlight-text mb-6">Dados da Conta</h3>

      <div className="space-y-6">
        <div>
          <Label htmlFor="name" className="text-moonlight-text mb-2 block">
            Nome completo
          </Label>
          <Input
            id="name"
            defaultValue="João Silva"
            className="bg-night-sky border-obsidian-border text-starlight-text"
          />
        </div>

        <div>
          <Label htmlFor="email" className="text-moonlight-text mb-2 block">
            E-mail
          </Label>
          <Input
            id="email"
            type="email"
            defaultValue="joao@example.com"
            className="bg-night-sky border-obsidian-border text-starlight-text"
          />
        </div>

        <div>
          <Label htmlFor="phone" className="text-moonlight-text mb-2 block">
            Telefone
          </Label>
          <Input
            id="phone"
            defaultValue="+55 11 99999-9999"
            className="bg-night-sky border-obsidian-border text-starlight-text"
          />
        </div>

        <div className="pt-4">
          <Button className="w-full md:w-auto bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text">
            Salvar alterações
          </Button>
        </div>
      </div>
    </div>
  );
}

function SecuritySection({
  twoFactorEnabled,
  setTwoFactorEnabled,
}: {
  twoFactorEnabled: boolean;
  setTwoFactorEnabled: (value: boolean) => void;
}) {
  return (
    <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-6 md:p-8">
      <h3 className="text-starlight-text mb-6">Segurança</h3>

      <div className="space-y-6">
        <div>
          <Label htmlFor="current-password" className="text-moonlight-text mb-2 block">
            Senha atual
          </Label>
          <Input
            id="current-password"
            type="password"
            placeholder="••••••••"
            className="bg-night-sky border-obsidian-border text-starlight-text"
          />
        </div>

        <div>
          <Label htmlFor="new-password" className="text-moonlight-text mb-2 block">
            Nova senha
          </Label>
          <Input
            id="new-password"
            type="password"
            placeholder="••••••••"
            className="bg-night-sky border-obsidian-border text-starlight-text"
          />
        </div>

        <div>
          <Label htmlFor="confirm-password" className="text-moonlight-text mb-2 block">
            Confirmar nova senha
          </Label>
          <Input
            id="confirm-password"
            type="password"
            placeholder="••••••••"
            className="bg-night-sky border-obsidian-border text-starlight-text"
          />
        </div>

        <div className="pt-4 pb-6 border-b border-obsidian-border">
          <Button className="w-full md:w-auto bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text">
            Alterar senha
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="text-starlight-text mb-1">Autenticação de dois fatores</h4>
            <p className="text-moonlight-text text-sm">Adicione uma camada extra de segurança à sua conta</p>
          </div>
          <Switch
            checked={twoFactorEnabled}
            onCheckedChange={setTwoFactorEnabled}
            className="data-[state=checked]:bg-mystic-indigo"
          />
        </div>
      </div>
    </div>
  );
}

function NotificationsSection({
  emailNotifications,
  setEmailNotifications,
  readingReminders,
  setReadingReminders,
}: {
  emailNotifications: boolean;
  setEmailNotifications: (value: boolean) => void;
  readingReminders: boolean;
  setReadingReminders: (value: boolean) => void;
}) {
  return (
    <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-6 md:p-8">
      <h3 className="text-starlight-text mb-6">Notificações</h3>

      <div className="space-y-6">
        <div className="flex items-center justify-between py-4 border-b border-obsidian-border">
          <div className="flex-1">
            <h4 className="text-starlight-text mb-1">E-mail de notificações</h4>
            <p className="text-moonlight-text text-sm">Receba atualizações sobre suas leituras e novidades</p>
          </div>
          <Switch
            checked={emailNotifications}
            onCheckedChange={setEmailNotifications}
            className="data-[state=checked]:bg-mystic-indigo ml-4"
          />
        </div>

        <div className="flex items-center justify-between py-4 border-b border-obsidian-border">
          <div className="flex-1">
            <h4 className="text-starlight-text mb-1">Lembretes de leitura</h4>
            <p className="text-moonlight-text text-sm">Receba lembretes para fazer suas consultas regulares</p>
          </div>
          <Switch
            checked={readingReminders}
            onCheckedChange={setReadingReminders}
            className="data-[state=checked]:bg-mystic-indigo ml-4"
          />
        </div>

        <div className="flex items-center justify-between py-4">
          <div className="flex-1">
            <h4 className="text-starlight-text mb-1">Ofertas e promoções</h4>
            <p className="text-moonlight-text text-sm">Fique por dentro de ofertas especiais de créditos</p>
          </div>
          <Switch className="data-[state=checked]:bg-mystic-indigo ml-4" />
        </div>
      </div>
    </div>
  );
}

function BillingSection() {
  return (
    <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-6 md:p-8">
      <h3 className="text-starlight-text mb-6">Pagamentos e Créditos</h3>

      <div className="space-y-6">
        <div className="bg-gradient-to-br from-mystic-indigo to-mystic-indigo-dark rounded-xl p-6">
          <p className="text-starlight-text/80 mb-2">Saldo Atual</p>
          <p className="text-starlight-text mb-1">12</p>
          <p className="text-starlight-text/80 mb-4">créditos disponíveis</p>
          <Button size="sm" className="bg-starlight-text text-mystic-indigo hover:bg-starlight-text/90">
            Comprar mais créditos
          </Button>
        </div>

        <div>
          <h4 className="text-starlight-text mb-4">Compras recentes</h4>
          <div className="space-y-3">
            {[
              { date: "15/11/2025", credits: 10, amount: "R$ 25,00" },
              { date: "01/11/2025", credits: 10, amount: "R$ 25,00" },
            ].map((purchase, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-night-sky rounded-lg border border-obsidian-border"
              >
                <div>
                  <p className="text-starlight-text">{purchase.credits} créditos</p>
                  <p className="text-moonlight-text text-sm">{purchase.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-starlight-text">{purchase.amount}</p>
                  <div className="flex items-center gap-1 justify-end">
                    <Check className="w-3 h-3 text-verdant-success" />
                    <span className="text-xs text-verdant-success">Concluído</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
