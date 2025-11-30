import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");

  const convertBirthdayToISO = (birthday: string): string => {
    const [day, month, year] = birthday.split("/");
    return `${year}-${month}-${day}`;
  };

  const removeNonDigits = (value: string): string => {
    return value.replace(/\D/g, "");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cleanCpf = removeNonDigits(cpf);

      // Check if CPF already exists
      const { data: existingProfiles, error: checkError } = await supabase
        .from("profiles")
        .select("cpf")
        .eq("cpf", cleanCpf);

      if (checkError) {
        alert("Erro ao salvar os dados, tente novamente mais tarde");
        setLoading(false);
        return;
      }

      if (existingProfiles && existingProfiles.length > 0) {
        toast({
          title: "Conta já existe",
          description: "CPF já cadastrado",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Sign up with Supabase Auth (trigger creates profile automatically)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        alert("Erro ao criar conta: " + signUpError.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        alert("Erro ao salvar os dados, tente novamente mais tarde");
        setLoading(false);
        return;
      }

      // Update profile with additional data
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          birthday: convertBirthdayToISO(birthday),
          cpf: cleanCpf,
          phone: removeNonDigits(phone),
        })
        .eq("id", data.user.id);

      if (updateError) {
        alert("Erro ao salvar os dados, tente novamente mais tarde");
        setLoading(false);
        return;
      }

      toast({
        title: "Conta criada com sucesso!",
        description: "Você já está logado.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      alert("Erro ao salvar os dados, tente novamente mais tarde");
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login",
        description: error.message || "Email ou senha incorretos.",
        variant: "destructive",
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
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
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
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
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
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
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
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar conta"}
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
