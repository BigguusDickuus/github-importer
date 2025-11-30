import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "./ui/use-toast";

export function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    birthday: "",
    cpf: "",
    phone: ""
  });
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar campos obrigatórios
      if (!formData.email || !formData.password || !formData.birthday || !formData.cpf || !formData.phone) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha todos os campos",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Converter birthday de DD/MM/AAAA para YYYY-MM-DD
      const [day, month, year] = formData.birthday.split("/");
      const birthdayFormatted = `${year}-${month}-${day}`;

      // Remover caracteres não numéricos de CPF e telefone
      const cpfClean = formData.cpf.replace(/\D/g, "");
      const phoneClean = formData.phone.replace(/\D/g, "");

      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Erro ao criar usuário");
      }

      // Inserir dados no profiles
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: authData.user.id,
          email: formData.email,
          birthday: birthdayFormatted,
          cpf: cpfClean,
          phone: phoneClean
        });

      if (profileError) throw profileError;

      toast({
        title: "Conta criada com sucesso!",
        description: "Você já pode fazer login"
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Ocorreu um erro ao criar sua conta",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: "Login realizado com sucesso!"
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login",
        description: error.message || "Email ou senha incorretos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (isLogin) {
      handleSignIn(e);
    } else {
      handleSignUp(e);
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
          <span className="text-2xl text-starlight-text">Oráculo IA</span>
        </Link>

        {/* Form Card */}
        <div className="bg-midnight-surface border border-obsidian-border rounded-2xl p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-starlight-text mb-2">
              {isLogin ? "Entrar" : "Criar conta"}
            </h2>
            <p className="text-moonlight-text">
              {isLogin
                ? "Acesse sua conta e consulte o oráculo"
                : "Comece sua jornada com o Oráculo IA"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <Label htmlFor="name" className="text-moonlight-text mb-2 block">
                    Nome completo
                  </Label>
                  <Input
                    id="name"
                    placeholder="Seu nome"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-night-sky border-obsidian-border text-starlight-text"
                  />
                </div>

                <div>
                  <Label htmlFor="birthday" className="text-moonlight-text mb-2 block">
                    Data de nascimento
                  </Label>
                  <Input
                    id="birthday"
                    placeholder="DD/MM/AAAA"
                    value={formData.birthday}
                    onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                    required
                    className="bg-night-sky border-obsidian-border text-starlight-text"
                  />
                </div>

                <div>
                  <Label htmlFor="cpf" className="text-moonlight-text mb-2 block">
                    CPF
                  </Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    required
                    className="bg-night-sky border-obsidian-border text-starlight-text"
                  />
                </div>

                <div>
                  <Label htmlFor="phone" className="text-moonlight-text mb-2 block">
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    placeholder="(00) 00000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="bg-night-sky border-obsidian-border text-starlight-text"
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="email" className="text-moonlight-text mb-2 block">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text"
            >
              {loading ? "Processando..." : isLogin ? "Entrar" : "Criar conta"}
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
          <Link
            to="/"
            className="text-moonlight-text hover:text-starlight-text transition-colors text-sm"
          >
            ← Voltar para o início
          </Link>
        </div>
      </div>
    </div>
  );
}
