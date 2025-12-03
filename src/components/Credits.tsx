import { Header } from "./Header";
import { Button } from "./ui/button";
import { Check, CreditCard, Sparkles } from "lucide-react";

export function Credits() {
  const plans = [
    {
      name: "Inicial",
      credits: 1,
      price: 3.0,
      description: "Perfeito para experimentar",
      features: ["1 consulta completa", "Acesso a todos os oráculos", "Histórico salvo"],
    },
    {
      name: "Popular",
      credits: 10,
      price: 25.0,
      originalPrice: 30.0,
      description: "Melhor custo-benefício",
      highlight: true,
      savings: "Economize 16%",
      features: ["10 consultas completas", "Acesso a todos os oráculos", "Histórico salvo", "Suporte prioritário"],
    },
    {
      name: "Ilimitado",
      credits: 50,
      price: 100.0,
      originalPrice: 150.0,
      description: "Para uso frequente",
      savings: "Economize 33%",
      features: [
        "50 consultas completas",
        "Acesso a todos os oráculos",
        "Histórico salvo",
        "Suporte prioritário",
        "Relatórios mensais",
      ],
    },
  ];

  const recentPurchases = [
    { date: "2025-11-15", credits: 10, amount: 25.0, status: "Concluído" },
    { date: "2025-11-01", credits: 10, amount: 25.0, status: "Concluído" },
  ];

  return (
    <div className="min-h-screen bg-night-sky">
      <Header isLoggedIn={true} />

      <main className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-starlight-text mb-2">Comprar Créditos</h1>
          <p className="text-moonlight-text max-w-2xl mx-auto">
            Escolha o plano ideal para você. Créditos não expiram e você pode usá-los quando quiser.
          </p>
        </div>

        {/* Current Balance */}
        <div className="mb-12 max-w-md mx-auto">
          <div
            className="bg-gradient-to-br from-mystic-indigo to-mystic-indigo-dark rounded-2xl text-center"
            style={{ padding: "32px" }}
          >
            <p className="text-starlight-text/80 mb-2">Saldo Atual</p>
            <p className="text-5xl text-starlight-text mb-1">12</p>
            <p className="text-starlight-text/80">créditos disponíveis</p>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-midnight-surface border rounded-2xl transition-all duration-300 flex flex-col ${
                plan.highlight
                  ? "border-mystic-indigo shadow-xl shadow-mystic-indigo/20 md:scale-105"
                  : "border-obsidian-border hover:border-mystic-indigo/50"
              }`}
              style={{ padding: "32px" }}
            >
              {plan.savings && (
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-oracle-ember/10 border border-oracle-ember mb-4 w-fit">
                  <span className="text-xs text-oracle-ember">{plan.savings}</span>
                </div>
              )}

              <h3 className="text-starlight-text mb-2">{plan.name}</h3>
              <p className="text-moonlight-text text-sm mb-6">{plan.description}</p>

              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl text-starlight-text">R$ {plan.price.toFixed(2)}</span>
                  {plan.originalPrice && (
                    <span className="text-moonlight-text line-through">R$ {plan.originalPrice.toFixed(2)}</span>
                  )}
                </div>
                <p className="text-mystic-indigo">
                  {plan.credits} {plan.credits === 1 ? "crédito" : "créditos"}
                </p>
                <p className="text-moonlight-text text-sm mt-1">
                  R$ {(plan.price / plan.credits).toFixed(2)} por consulta
                </p>
              </div>

              <div className="space-y-3 flex-1">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-verdant-success flex-shrink-0 mt-0.5" />
                    <span className="text-moonlight-text text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <Button
                className={`w-full ${
                  plan.highlight
                    ? "bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text"
                    : "bg-midnight-surface border border-obsidian-border text-starlight-text hover:bg-night-sky"
                }`}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Selecionar plano
              </Button>
            </div>
          ))}
        </div>

        {/* Payment Info */}
        <div className="mb-12 max-w-4xl mx-auto">
          <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-6 md:p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-mystic-indigo/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-mystic-indigo" />
              </div>
              <div>
                <h3 className="text-starlight-text mb-2">Pagamento Seguro</h3>
                <p className="text-moonlight-text">
                  Todos os pagamentos são processados de forma segura. Aceitamos cartão de crédito, débito e PIX. Seus
                  créditos são liberados instantaneamente após a confirmação.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-obsidian-border">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-verdant-success/10 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-verdant-success" />
                </div>
                <h4 className="text-starlight-text text-sm mb-1">Créditos Vitalícios</h4>
                <p className="text-moonlight-text text-xs">Nunca expiram</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-mystic-indigo/10 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-mystic-indigo" />
                </div>
                <h4 className="text-starlight-text text-sm mb-1">Liberação Instantânea</h4>
                <p className="text-moonlight-text text-xs">Use imediatamente</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-oracle-ember/10 flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="w-6 h-6 text-oracle-ember" />
                </div>
                <h4 className="text-starlight-text text-sm mb-1">Pagamento Seguro</h4>
                <p className="text-moonlight-text text-xs">Criptografia SSL</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-starlight-text mb-6">Histórico de Compras</h3>

          {/* Desktop Table */}
          <div className="hidden md:block bg-midnight-surface border border-obsidian-border rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-obsidian-border">
                  <th className="text-left px-6 py-4 text-moonlight-text">Data</th>
                  <th className="text-left px-6 py-4 text-moonlight-text">Créditos</th>
                  <th className="text-left px-6 py-4 text-moonlight-text">Valor</th>
                  <th className="text-left px-6 py-4 text-moonlight-text">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPurchases.map((purchase, index) => (
                  <tr key={index} className="border-b border-obsidian-border last:border-0">
                    <td className="px-6 py-4 text-starlight-text">
                      {new Date(purchase.date).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-6 py-4 text-starlight-text">{purchase.credits} créditos</td>
                    <td className="px-6 py-4 text-starlight-text">R$ {purchase.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-verdant-success/10 border border-verdant-success/30">
                        <span className="text-xs text-verdant-success">{purchase.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {recentPurchases.map((purchase, index) => (
              <div key={index} className="bg-midnight-surface border border-obsidian-border rounded-xl p-6">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-starlight-text">{purchase.credits} créditos</span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-verdant-success/10 border border-verdant-success/30">
                    <span className="text-xs text-verdant-success">{purchase.status}</span>
                  </span>
                </div>
                <p className="text-moonlight-text text-sm mb-1">R$ {purchase.amount.toFixed(2)}</p>
                <p className="text-moonlight-text text-xs">{new Date(purchase.date).toLocaleDateString("pt-BR")}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
