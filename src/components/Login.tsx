import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const redirectTo = useMemo(() => {
    // você já criou a redirect URL no Supabase; isso garante que vai bater no domínio publicado
    return `${window.location.origin}/reset-password`;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
          return;
        }

        navigate("/dashboard", { replace: true });
        return;
      }

      // signup
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
        return;
      }

      toast({
        title: "Conta criada!",
        description: "Se necessário, verifique seu e-mail para confirmar o cadastro.",
      });

      // após signup, pode ir pro dashboard (se confirmação não for obrigatória)
      navigate("/dashboard", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: "Informe seu e-mail",
        description: "Digite seu e-mail acima para enviarmos o link de recuperação.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        toast({ title: "Erro ao enviar link", description: error.message, variant: "destructive" });
        return;
      }

      toast({
        title: "Link enviado!",
        description: "Verifique seu e-mail para redefinir sua senha.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-night-sky flex items-center justify-center px-4 py-12">
      {/* Cosmic Background Effect */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-mystic-indigo rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-oracle-ember rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-mystic-indigo to-oracle-ember flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-starlight-text" />
          </div>
          <span className="text-2xl text-starlight-text">Tarot Online</span>
        </Link>

        {/* Form Card */}
        <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-starlight-text mb-2">{isLogin ? "Entrar" : "Criar conta"}</h2>
            <p className="text-moonlight-text">
              {isLogin ? "Acesse sua conta e consulte o oráculo" : "Comece sua jornada no Tarot Online"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="name" className="text-moonlight-text mb-2 block">
                  Nome completo
                </Label>
                <Input
                  id="name"
                  placeholder="Seu nome"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-night-sky border-obsidian-border text-starlight-text"
                />
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-moonlight-text mb-2 block">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-night-sky border-obsidian-border text-starlight-text"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-moonlight-text mb-2 block">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-night-sky border-obsidian-border text-starlight-text"
              />
            </div>

            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-mystic-indigo hover:text-mystic-indigo-dark transition-colors"
                  disabled={loading}
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text"
              disabled={loading}
            >
              {loading ? "Aguarde..." : isLogin ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-moonlight-text text-sm">
              {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}{" "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-mystic-indigo hover:text-mystic-indigo-dark transition-colors"
                disabled={loading}
              >
                {isLogin ? "Criar conta" : "Entrar"}
              </button>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link to="/" className="text-moonlight-text hover:text-starlight-text transition-colors text-sm">
            ← Voltar para o início
          </Link>
        </div>
      </div>
    </div>
  );
}
