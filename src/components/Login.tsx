import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client"; // caminho da sua pasta supabase
import { toast } from "@/hooks/use-toast"; // caminho do hook de toast (pode ser diferente, veja abaixo)

export function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would handle authentication
    navigate("/dashboard");
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
          <span className="text-2xl text-starlight-text">Oráculo IA</span>
        </Link>

        {/* Form Card */}
        <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-starlight-text mb-2">{isLogin ? "Entrar" : "Criar conta"}</h2>
            <p className="text-moonlight-text">
              {isLogin ? "Acesse sua conta e consulte o oráculo" : "Comece sua jornada com o Oráculo IA"}
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
                className="bg-night-sky border-obsidian-border text-starlight-text"
              />
            </div>

            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  className="text-sm text-mystic-indigo hover:text-mystic-indigo-dark transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            <Button type="submit" className="w-full bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text">
              {isLogin ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-moonlight-text text-sm">
              {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}{" "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-mystic-indigo hover:text-mystic-indigo-dark transition-colors"
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
