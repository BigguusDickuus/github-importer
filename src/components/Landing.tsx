import { useState, useEffect, useRef } from "react";
import { Header } from "./Header";
import { Button } from "./ui/button";
import { Sparkles, User, DollarSign, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { CardsIcon } from "./icons/CardsIcon";
import { Modal } from "./Modal";
import { Link, useNavigate } from "react-router-dom";

export function HomeDeslogada() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [shakeModal, setShakeModal] = useState(false);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const plansRef = useRef<HTMLDivElement>(null);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const [activePlanIndex, setActivePlanIndex] = useState(1);

  // Signup form states
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState("");
  const [signupBirthDate, setSignupBirthDate] = useState("");
  const [signupCPF, setSignupCPF] = useState("");
  const [signupPhone, setSignupPhone] = useState("");

  // Validation errors
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordConfirmError, setPasswordConfirmError] = useState("");
  const [birthDateError, setBirthDateError] = useState("");
  const [cpfError, setCpfError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Scroll to initial positions in carousels
  useEffect(() => {
    // Como Funciona: scroll to first card (index 0)
    if (howItWorksRef.current && window.innerWidth <= 922) {
      const cards = howItWorksRef.current.children;
      if (cards[0]) {
        (cards[0] as HTMLElement).scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
      }
    }

    // Planos: scroll to second card (index 1 - Explorador) com delay maior
    if (plansRef.current && window.innerWidth <= 922) {
      // Primeiro timeout para garantir que o DOM está pronto
      setTimeout(() => {
        if (plansRef.current) {
          const carousel = plansRef.current;
          const cards = carousel.children;
          if (cards[1]) {
            // Calcular posição de scroll sem usar scrollIntoView para evitar scroll da página
            const cardWidth = (cards[1] as HTMLElement).offsetWidth;
            const gap = 20;
            const scrollPosition = (cardWidth + gap) * 1 - (carousel.offsetWidth - cardWidth) / 2;
            carousel.scrollLeft = scrollPosition;
          }
        }
      }, 500);
      
      // Segundo timeout para forçar novamente caso o primeiro falhe
      setTimeout(() => {
        if (plansRef.current) {
          const carousel = plansRef.current;
          const cards = carousel.children;
          if (cards[1]) {
            const cardWidth = (cards[1] as HTMLElement).offsetWidth;
            const gap = 20;
            const scrollPosition = (cardWidth + gap) * 1 - (carousel.offsetWidth - cardWidth) / 2;
            carousel.scrollLeft = scrollPosition;
          }
        }
      }, 1000);
    }
  }, []);

  // Detect scroll position for features carousel
  useEffect(() => {
    const carousel = howItWorksRef.current;
    if (!carousel) return;

    const handleScroll = () => {
      if (window.innerWidth > 922) return;
      
      const scrollLeft = carousel.scrollLeft;
      const cardWidth = carousel.children[0]?.clientWidth || 0;
      const gap = 20;
      const index = Math.round(scrollLeft / (cardWidth + gap));
      setActiveFeatureIndex(index);
    };

    carousel.addEventListener('scroll', handleScroll);
    return () => carousel.removeEventListener('scroll', handleScroll);
  }, []);

  // Detect scroll position for plans carousel
  useEffect(() => {
    const carousel = plansRef.current;
    if (!carousel) return;

    const handleScroll = () => {
      if (window.innerWidth > 922) return;
      
      const scrollLeft = carousel.scrollLeft;
      const cardWidth = carousel.children[0]?.clientWidth || 0;
      const gap = 20;
      const index = Math.round(scrollLeft / (cardWidth + gap));
      setActivePlanIndex(index);
    };

    carousel.addEventListener('scroll', handleScroll);
    return () => carousel.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToFeature = (index: number) => {
    if (howItWorksRef.current) {
      const cards = howItWorksRef.current.children;
      if (cards[index]) {
        (cards[index] as HTMLElement).scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
      }
    }
  };

  const scrollToPlan = (index: number) => {
    if (plansRef.current) {
      const cards = plansRef.current.children;
      if (cards[index]) {
        (cards[index] as HTMLElement).scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
      }
    }
  };

  const handleLogin = () => {
    // TODO: implementar lógica real de login
    // Por enquanto, simula erro
    setLoginError(true);
    setShakeModal(true);
    setTimeout(() => {
      setShakeModal(false);
    }, 600);
  };

  const simulateLoginError = () => {
    setLoginError(true);
    setShakeModal(true);
    setTimeout(() => {
      setShakeModal(false);
    }, 600);
  };

  // Máscara de CPF
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  // Máscara de Telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      if (numbers.length <= 10) {
        return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
      }
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  // Validação de CPF com dígitos verificadores
  const validateCPF = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, '');
    
    if (numbers.length !== 11) {
      return false;
    }

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(numbers)) {
      return false;
    }

    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers[i]) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(numbers[9])) {
      return false;
    }

    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numbers[i]) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(numbers[10])) {
      return false;
    }

    return true;
  };

  // Validação de telefone
  const validatePhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    
    // Verifica se tem 10 ou 11 dígitos
    if (numbers.length !== 10 && numbers.length !== 11) {
      return false;
    }

    // Verifica se todos os dígitos são iguais (números falsos)
    if (/^(\d)\1+$/.test(numbers)) {
      return false;
    }

    // Verifica se contém letras
    if (/[a-zA-Z]/.test(phone)) {
      return false;
    }

    return true;
  };

  // Validação de email
  const validateEmail = (email: string) => {
    return email.includes('@') && email.includes('.') && email.length > 5;
  };

  // Validação de senha com requisitos
  const validatePassword = (password: string) => {
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      isValid: hasMinLength && hasUpperCase && hasLowerCase && hasSpecialChar,
      hasMinLength,
      hasUpperCase,
      hasLowerCase,
      hasSpecialChar
    };
  };

  // Handler de mudança de CPF com máscara
  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value);
    setSignupCPF(formatted);
    
    if (value.length > 0) {
      if (!validateCPF(formatted)) {
        setCpfError('CPF inválido');
      } else {
        setCpfError('');
      }
    } else {
      setCpfError('');
    }
  };

  // Handler de mudança de Telefone com máscara
  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    setSignupPhone(formatted);
    
    if (value.length > 0) {
      if (!validatePhone(formatted)) {
        setPhoneError('Telefone inválido');
      } else {
        setPhoneError('');
      }
    } else {
      setPhoneError('');
    }
  };

  // Validar todos os campos antes de permitir cadastro
  const validateSignupForm = () => {
    let isValid = true;

    // Validar email
    if (!signupEmail) {
      setEmailError('Email é obrigatório');
      isValid = false;
    } else if (!validateEmail(signupEmail)) {
      setEmailError('Email inválido');
      isValid = false;
    } else {
      setEmailError('');
    }

    // Validar senha
    if (!signupPassword) {
      setPasswordError('Senha é obrigatória');
      isValid = false;
    } else {
      const validation = validatePassword(signupPassword);
      if (!validation.isValid) {
        setPasswordError('Senha não atende aos requisitos');
        isValid = false;
      } else {
        setPasswordError('');
      }
    }

    // Validar confirmação de senha
    if (!signupPasswordConfirm) {
      setPasswordConfirmError('Confirmação de senha é obrigatória');
      isValid = false;
    } else if (signupPassword !== signupPasswordConfirm) {
      setPasswordConfirmError('As senhas não coincidem');
      isValid = false;
    } else {
      setPasswordConfirmError('');
    }

    // Validar data de nascimento
    if (!signupBirthDate) {
      setBirthDateError('Data de nascimento é obrigatória');
      isValid = false;
    } else {
      const birthDate = new Date(signupBirthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18) {
        setBirthDateError('Você deve ter pelo menos 18 anos');
        isValid = false;
      } else {
        setBirthDateError('');
      }
    }

    // Validar CPF
    if (!signupCPF) {
      setCpfError('CPF é obrigatório');
      isValid = false;
    } else if (!validateCPF(signupCPF)) {
      setCpfError('CPF inválido');
      isValid = false;
    } else {
      setCpfError('');
    }

    // Validar telefone
    if (!signupPhone) {
      setPhoneError('Telefone é obrigatório');
      isValid = false;
    } else if (!validatePhone(signupPhone)) {
      setPhoneError('Telefone inválido');
      isValid = false;
    } else {
      setPhoneError('');
    }

    return isValid;
  };

  // Handler de cadastro
  const handleSignup = () => {
    if (validateSignupForm()) {
      // TODO: implementar lógica real de cadastro
      // Por enquanto, redireciona para a home logada
      navigate('/dashboard');
    } else {
      setShakeModal(true);
      setTimeout(() => {
        setShakeModal(false);
      }, 600);
    }
  };

  // Verificar se todos os campos estão preenchidos e válidos
  const isSignupFormValid = () => {
    return (
      signupEmail &&
      validateEmail(signupEmail) &&
      signupPassword &&
      validatePassword(signupPassword).isValid &&
      signupPasswordConfirm &&
      signupPassword === signupPasswordConfirm &&
      signupBirthDate &&
      signupCPF &&
      validateCPF(signupCPF) &&
      signupPhone &&
      validatePhone(signupPhone)
    );
  };

  const features = [
    {
      icon: User,
      title: "1. Crie sua conta",
      description: (
        <>
          Registre-se rapidamente e <span className="text-oracle-ember">ganhe 3 créditos</span> iniciais para começar suas consultas.
        </>
      ),
    },
    {
      icon: DollarSign,
      title: "2. Adquira créditos",
      description: "Compre créditos que nunca expiram. Cada consulta consome 1 crédito por oráculo selecionado.",
    },
    {
      icon: CardsIcon,
      title: "3. Consulte o oráculo",
      description: "Faça sua pergunta, escolha o tipo de oráculo e receba interpretações profundas e personalizadas.",
    },
  ];

  const plans = [
    {
      name: "Iniciante",
      credits: 10,
      price: "R$ 25",
      pricePerCredit: "R$ 2,50 por consulta",
      description: "Perfeito para experimentar",
    },
    {
      name: "Explorador",
      credits: 25,
      price: "R$ 50",
      pricePerCredit: "R$ 2,00 por consulta",
      description: "Melhor custo-benefício",
      highlight: true,
      badge: "Mais Popular",
      savings: "Economize até 20%",
    },
    {
      name: "Místico",
      credits: 60,
      price: "R$ 100",
      pricePerCredit: "R$ 1,66 por consulta",
      description: "Para uso frequente",
      savings: "Economize até 33%",
    },
  ];

  return (
    <div className="min-h-screen bg-night-sky text-moonlight-text relative">
      {/* Background Gradients - Fixed */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-mystic-indigo/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-oracle-ember/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-mystic-indigo/10 rounded-full blur-[100px]" />
      </div>

      <Header isLoggedIn={false} onLoginClick={() => setShowLoginModal(true)} />

      {/* Hero Section */}
      <section className="hero-section relative z-10 pt-24 pb-40 md:pt-40 md:pb-56 flex flex-col items-center justify-center" style={{ marginTop: 'calc(64px + 24px + 40px)' }}>
        <style>{`
          @media (min-width: 768px) {
            .hero-section {
              margin-top: calc(80px + 24px + 40px) !important;
            }
          }
          @media (max-width: 767px) {
            .hero-section-container {
              padding-left: 5% !important;
              padding-right: 5% !important;
            }
          }
          @media (min-width: 768px) and (max-width: 922px) {
            .hero-section-container {
              padding-left: 5% !important;
              padding-right: 5% !important;
            }
          }
          @media (min-width: 923px) {
            .hero-section-container {
              padding-left: 64px !important;
              padding-right: 64px !important;
            }
          }
        `}</style>
        <div className="hero-section-container w-full flex flex-col items-center justify-center">
          <div className="w-full max-w-[1200px] flex flex-col items-center">
            
            <div style={{ marginBottom: '40px' }}>
              <h1 
                className="text-starlight-text tracking-tight text-center w-full"
                style={{ 
                  fontSize: '2.5rem',
                  lineHeight: '1.1',
                  marginBottom: '40px'
                }}
              >
                <style>{`
                  @media (min-width: 768px) {
                    .hero-title {
                      font-size: 3.0rem !important;
                    }
                  }
                `}</style>
                <span className="hero-title" style={{ fontSize: '2.5rem' }}>Tarot Online</span>
              </h1>

              <p className="text-xl md:text-2xl text-moonlight-text text-center w-full max-w-[800px]" style={{ marginBottom: '32px' }}>
                Consultas de Tarot, Tarot Cigano e Cartomancia Clássica disponíveis 24/7
              </p>

              <p className="text-lg md:text-xl text-oracle-ember text-center w-full max-w-[700px]" style={{ marginBottom: '96px' }}>
                Interpretações profundas e personalizadas para suas perguntas
              </p>
            </div>

            {/* Prompt Card - ATUALIZADO COM ESPAÇAMENTOS */}
            <div className="w-full max-w-[900px]" style={{ marginBottom: '24px' }}>
              <div 
                className="bg-midnight-surface/80 backdrop-blur-sm border border-obsidian-border rounded-3xl shadow-2xl w-full flex flex-col"
                style={{ padding: '24px', gap: '24px' }}
              >
                <textarea
                  placeholder="Faça sua pergunta..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled
                  rows={6}
                  className="w-full bg-night-sky/50 border border-obsidian-border rounded-2xl text-lg md:text-xl text-starlight-text placeholder:text-moonlight-text/60 focus:outline-none focus:border-mystic-indigo transition-colors resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ padding: '24px' }}
                />
                
                <div className="w-full flex justify-center">
                  <Button
                    size="lg"
                    disabled
                    className="w-full sm:w-auto sm:min-w-[50%] bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text h-14 md:h-16 text-lg md:text-xl disabled:opacity-60 px-8 whitespace-nowrap"
                  >
                    ✨ Consultar o Oráculo
                  </Button>
                </div>
              </div>
            </div>

            {/* Warning Message */}
            <div className="w-full max-w-[900px]" style={{ marginBottom: '24px' }}>
              <div 
                className="flex items-center justify-center gap-4 bg-solar-warning/10 border border-solar-warning/30 rounded-2xl w-full"
                style={{ padding: '12px 32px' }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-solar-warning animate-pulse flex-shrink-0" />
                <p className="text-base md:text-lg text-solar-warning text-center">
                  Você precisa estar <span className="underline">logado</span> e ter <span className="underline">créditos</span> para fazer uma consulta
                </p>
              </div>
            </div>

            <p className="text-base md:text-lg text-moonlight-text/80 text-center w-full" style={{ marginBottom: '24px' }}>
              1 crédito por oráculo selecionado • Sem limites de temas
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center items-center w-full max-w-[600px]" style={{ marginBottom: '40px' }}>
              <Button 
                size="lg" 
                className="w-full sm:flex-1 bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text h-14 md:h-16 text-base md:text-lg px-8"
                onClick={() => setShowLoginModal(true)}
              >
                Entrar | Criar conta
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowHowItWorksModal(true)}
                className="w-full sm:flex-1 border-obsidian-border text-moonlight-text hover:bg-midnight-surface hover:text-starlight-text h-14 md:h-16 text-base md:text-lg px-8"
              >
                Como funciona
              </Button>
            </div>

            {/* DEV ONLY - Remover em produção */}
            <Button 
              size="sm"
              variant="outline"
              className="border-oracle-ember text-oracle-ember hover:bg-oracle-ember/10"
              asChild
            >
              <Link to="/dashboard">🔧 Ver Home Logada (DEV)</Link>
            </Button>

            {/* DEV ONLY - Testar erro de login */}
            <Button 
              size="sm"
              variant="outline"
              className="border-solar-warning text-solar-warning hover:bg-solar-warning/10"
              onClick={() => {
                setShowLoginModal(true);
                setTimeout(() => simulateLoginError(), 100);
              }}
            >
              🧪 Testar Erro de Login (DEV)
            </Button>

          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section className="relative z-10 py-40 md:py-48 flex flex-col items-center justify-center">
        <style>{`
          @media (max-width: 767px) {
            .como-funciona-container {
              padding-left: 5% !important;
              padding-right: 5% !important;
            }
          }
          @media (min-width: 768px) and (max-width: 922px) {
            .como-funciona-container {
              padding-left: 5% !important;
              padding-right: 5% !important;
            }
          }
          @media (min-width: 923px) {
            .como-funciona-container {
              padding-left: 64px !important;
              padding-right: 64px !important;
            }
          }
        `}</style>
        <div className="como-funciona-container w-full flex flex-col items-center justify-center">
          <div className="w-full max-w-[1400px] flex flex-col items-center">
            
            <div className="w-full flex flex-col items-center" style={{ marginBottom: '40px' }}>
              <h2 className="text-4xl md:text-6xl text-starlight-text text-center w-full" style={{ marginBottom: '32px' }}>
                Como funciona
              </h2>
              <p className="text-lg md:text-2xl text-moonlight-text text-center w-full max-w-[800px]">
                Três passos simples para acessar a <span className="text-mystic-indigo">sabedoria ancestral</span>
              </p>
            </div>

            {/* Desktop: Grid | Mobile/Intermediate: Carousel */}
            <style>{`
              @media (max-width: 922px) {
                .features-carousel {
                  display: flex !important;
                  overflow-x: auto !important;
                  scroll-snap-type: x mandatory !important;
                  gap: 20px !important;
                  padding: 0 20px !important;
                  scrollbar-width: none !important;
                  -ms-overflow-style: none !important;
                }
                .features-carousel::-webkit-scrollbar {
                  display: none !important;
                }
                .features-carousel > div {
                  flex: 0 0 85% !important;
                  scroll-snap-align: center !important;
                  scroll-snap-stop: always !important;
                }
                .carousel-container-spacing {
                  margin-bottom: 16px !important;
                }
              }
              @media (min-width: 923px) {
                .features-carousel {
                  display: grid !important;
                  grid-template-columns: repeat(3, 1fr) !important;
                  gap: 48px !important;
                }
                .carousel-container-spacing {
                  margin-bottom: 40px !important;
                }
              }
              @media (min-width: 923px) {
                .carousel-arrows {
                  display: none !important;
                }
              }
            `}</style>
            
            {/* Container com position relative para as setas absolutas */}
            <div className="carousel-container-spacing" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '100%', maxWidth: '1200px', position: 'relative' }}>
                <div className="features-carousel w-full" ref={howItWorksRef}>
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className="bg-midnight-surface/80 backdrop-blur-sm border border-obsidian-border rounded-3xl hover:border-mystic-indigo/50 transition-all duration-300 hover:shadow-lg hover:shadow-mystic-indigo/10 flex flex-col items-center"
                      style={{ padding: '32px' }}
                    >
                      <div 
                        className="rounded-full bg-mystic-indigo/10 border border-mystic-indigo/30 flex items-center justify-center"
                        style={{ width: '72px', height: '72px', marginBottom: '24px' }}
                      >
                        <feature.icon className="w-8 h-8 text-mystic-indigo" />
                      </div>
                      <h3 className="text-2xl text-starlight-text text-center w-full" style={{ marginBottom: '16px' }}>
                        {feature.title}
                      </h3>
                      <p className="text-base text-moonlight-text leading-relaxed text-center w-full">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Left Arrow - calc para posicionar a 2% da viewport */}
                <button
                  onClick={() => scrollToFeature(activeFeatureIndex - 1)}
                  disabled={activeFeatureIndex === 0}
                  className="carousel-arrows"
                  aria-label="Anterior"
                  style={{ 
                    position: 'absolute',
                    left: 'calc((100vw - 100%) / -2 + 2vw)',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '48px',
                    height: '96px',
                    padding: 0,
                    margin: 0,
                    border: 'none',
                    background: 'transparent',
                    zIndex: 50,
                    cursor: activeFeatureIndex === 0 ? 'not-allowed' : 'pointer',
                    opacity: activeFeatureIndex === 0 ? 0 : 1,
                    color: '#E2E8F0',
                    transition: 'all 0.3s',
                    pointerEvents: activeFeatureIndex === 0 ? 'none' : 'auto'
                  }}
                  onMouseEnter={(e) => {
                    if (activeFeatureIndex !== 0) {
                      e.currentTarget.style.color = '#6366F1';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#E2E8F0';
                  }}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="48" 
                    height="96" 
                    viewBox="0 0 24 48" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{ width: '48px', height: '96px', filter: 'drop-shadow(0 10px 15px rgba(0, 0, 0, 0.3))', pointerEvents: 'none' }}
                  >
                    <polyline points="15 6 9 24 15 42" />
                  </svg>
                </button>

                {/* Right Arrow - calc para posicionar a 2% da viewport */}
                <button
                  onClick={() => scrollToFeature(activeFeatureIndex + 1)}
                  disabled={activeFeatureIndex === features.length - 1}
                  className="carousel-arrows"
                  aria-label="Próximo"
                  style={{ 
                    position: 'absolute',
                    right: 'calc((100vw - 100%) / -2 + 2vw)',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '48px',
                    height: '96px',
                    padding: 0,
                    margin: 0,
                    border: 'none',
                    background: 'transparent',
                    zIndex: 50,
                    cursor: activeFeatureIndex === features.length - 1 ? 'not-allowed' : 'pointer',
                    opacity: activeFeatureIndex === features.length - 1 ? 0 : 1,
                    color: '#E2E8F0',
                    transition: 'all 0.3s',
                    pointerEvents: activeFeatureIndex === features.length - 1 ? 'none' : 'auto'
                  }}
                  onMouseEnter={(e) => {
                    if (activeFeatureIndex !== features.length - 1) {
                      e.currentTarget.style.color = '#6366F1';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#E2E8F0';
                  }}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="48" 
                    height="96" 
                    viewBox="0 0 24 48" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{ width: '48px', height: '96px', filter: 'drop-shadow(0 10px 15px rgba(0, 0, 0, 0.3))', pointerEvents: 'none' }}
                  >
                    <polyline points="9 6 15 24 9 42" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Navigation Arrows & Indicators - Only visible on mobile/intermediate */}
            <style>{`
              @media (min-width: 923px) {
                .carousel-nav {
                  display: none !important;
                }
              }
            `}</style>
            <div className="carousel-nav flex flex-col items-center gap-6 w-full" style={{ marginTop: '16px', marginBottom: '40px' }}>
              {/* Indicators (dots) */}
              <div className="flex justify-center gap-2">
                {features.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToFeature(index)}
                    className={`rounded-full transition-all duration-300 ${
                      activeFeatureIndex === index 
                        ? 'bg-mystic-indigo w-8 h-2' 
                        : 'bg-moonlight-text/30 w-2 h-2 hover:bg-moonlight-text/50'
                    }`}
                    aria-label={`Ir para slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Planos */}
      <section className="relative z-10 py-40 md:py-48 flex flex-col items-center justify-center">
        <style>{`
          @media (max-width: 767px) {
            .planos-container {
              padding-left: 5% !important;
              padding-right: 5% !important;
            }
          }
          @media (min-width: 768px) and (max-width: 922px) {
            .planos-container {
              padding-left: 5% !important;
              padding-right: 5% !important;
            }
          }
          @media (min-width: 923px) {
            .planos-container {
              padding-left: 64px !important;
              padding-right: 64px !important;
            }
          }
        `}</style>
        <div className="planos-container w-full flex flex-col items-center justify-center">
          <div className="w-full max-w-[1400px] flex flex-col items-center">
            
            <div className="w-full flex flex-col items-center" style={{ marginBottom: '40px' }}>
              <h2 className="text-4xl md:text-6xl text-starlight-text text-center w-full" style={{ marginBottom: '32px' }}>
                Planos de créditos
              </h2>
              <p className="text-lg md:text-2xl text-moonlight-text text-center w-full max-w-[800px]">
                Escolha o plano ideal para suas consultas
              </p>
            </div>

            {/* Desktop: Grid | Mobile/Intermediate: Carousel */}
            <style>{`
              @media (max-width: 922px) {
                .plans-carousel {
                  display: flex !important;
                  overflow-x: auto !important;
                  overflow-y: visible !important;
                  scroll-snap-type: x mandatory !important;
                  gap: 20px !important;
                  padding: 20px !important;
                  scrollbar-width: none !important;
                  -ms-overflow-style: none !important;
                }
                .plans-carousel::-webkit-scrollbar {
                  display: none !important;
                }
                .plans-carousel > div {
                  flex: 0 0 85% !important;
                  scroll-snap-align: center !important;
                  scroll-snap-stop: always !important;
                }
                .plans-container-spacing {
                  margin-bottom: 16px !important;
                }
              }
              @media (min-width: 923px) {
                .plans-carousel {
                  display: grid !important;
                  grid-template-columns: repeat(3, 1fr) !important;
                  gap: 40px !important;
                }
                .plans-container-spacing {
                  margin-bottom: 40px !important;
                }
              }
              @media (min-width: 923px) {
                .carousel-arrows-plans {
                  display: none !important;
                }
              }
            `}</style>
            
            {/* Container centralizado com position relative */}
            <div className="plans-container-spacing" style={{ width: '100%', display: 'flex', justifyContent: 'center', position: 'relative' }}>
              <div style={{ width: '100%', maxWidth: '1100px', position: 'relative' }}>
                <div className="plans-carousel w-full" ref={plansRef}>
                  {plans.map((plan, index) => (
                    <div
                      key={index}
                      className={`bg-midnight-surface/80 backdrop-blur-sm border rounded-3xl transition-all duration-300 relative flex flex-col ${
                        plan.highlight
                          ? "border-mystic-indigo shadow-xl shadow-mystic-indigo/20 md:scale-105"
                          : "border-obsidian-border hover:border-mystic-indigo/30 hover:shadow-lg"
                      }`}
                      style={{ padding: '48px' }}
                    >
                      {plan.badge && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                          <div 
                            className="bg-oracle-ember rounded-full text-sm md:text-base text-starlight-text shadow-lg whitespace-nowrap"
                            style={{ padding: '8px 20px' }}
                          >
                            {plan.badge}
                          </div>
                        </div>
                      )}
                      
                      <div className="text-center w-full" style={{ marginBottom: '32px', marginTop: '8px' }}>
                        <h3 className="text-3xl text-starlight-text" style={{ marginBottom: '16px' }}>
                          {plan.name}
                        </h3>
                        <p className="text-lg text-moonlight-text">
                          {plan.description}
                        </p>
                      </div>

                      <div className="text-center w-full" style={{ marginBottom: '32px' }}>
                        <div className="flex justify-center" style={{ marginBottom: '16px' }}>
                          <span className={`text-6xl text-mystic-indigo ${plan.highlight ? 'font-bold' : ''}`}>
                            {plan.price}
                          </span>
                        </div>
                        <p className="text-lg text-moonlight-text" style={{ marginBottom: '16px' }}>
                          <span className="text-4xl text-starlight-text">{plan.credits}</span> consultas
                        </p>
                        <p className="text-base text-moonlight-text/70">
                          {plan.pricePerCredit}
                        </p>
                      </div>

                      <div className="text-center w-full flex justify-center" style={{ marginBottom: '32px', minHeight: '56px', alignItems: 'center' }}>
                        {plan.savings && (
                          <span 
                            className="inline-block rounded-full bg-verdant-success/10 border border-verdant-success/30 text-base text-verdant-success"
                            style={{ padding: '8px 16px' }}
                          >
                            {plan.savings}
                          </span>
                        )}
                      </div>

                      <div style={{ marginTop: 'auto' }}>
                        <Button
                          className={`w-full h-16 text-lg ${
                            plan.highlight
                              ? "bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text"
                              : "bg-midnight-surface border border-obsidian-border text-moonlight-text hover:bg-mystic-indigo/10 hover:border-mystic-indigo/50"
                          }`}
                          onClick={() => setShowLoginModal(true)}
                        >
                          Selecionar plano
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Left Arrow - calc para posicionar a 2% da viewport */}
                <button
                  onClick={() => scrollToPlan(activePlanIndex - 1)}
                  disabled={activePlanIndex === 0}
                  className="carousel-arrows-plans"
                  aria-label="Anterior"
                  style={{ 
                    position: 'absolute',
                    left: 'calc((100vw - 100%) / -2 + 2vw)',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '48px',
                    height: '96px',
                    padding: 0,
                    margin: 0,
                    border: 'none',
                    background: 'transparent',
                    zIndex: 50,
                    cursor: activePlanIndex === 0 ? 'not-allowed' : 'pointer',
                    opacity: activePlanIndex === 0 ? 0 : 1,
                    color: '#E2E8F0',
                    transition: 'all 0.3s',
                    pointerEvents: activePlanIndex === 0 ? 'none' : 'auto'
                  }}
                  onMouseEnter={(e) => {
                    if (activePlanIndex !== 0) {
                      e.currentTarget.style.color = '#6366F1';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#E2E8F0';
                  }}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="48" 
                    height="96" 
                    viewBox="0 0 24 48" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{ width: '48px', height: '96px', filter: 'drop-shadow(0 10px 15px rgba(0, 0, 0, 0.3))', pointerEvents: 'none' }}
                  >
                    <polyline points="15 6 9 24 15 42" />
                  </svg>
                </button>

                {/* Right Arrow - calc para posicionar a 2% da viewport */}
                <button
                  onClick={() => scrollToPlan(activePlanIndex + 1)}
                  disabled={activePlanIndex === plans.length - 1}
                  className="carousel-arrows-plans"
                  aria-label="Próximo"
                  style={{ 
                    position: 'absolute',
                    right: 'calc((100vw - 100%) / -2 + 2vw)',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '48px',
                    height: '96px',
                    padding: 0,
                    margin: 0,
                    border: 'none',
                    background: 'transparent',
                    zIndex: 50,
                    cursor: activePlanIndex === plans.length - 1 ? 'not-allowed' : 'pointer',
                    opacity: activePlanIndex === plans.length - 1 ? 0 : 1,
                    color: '#E2E8F0',
                    transition: 'all 0.3s',
                    pointerEvents: activePlanIndex === plans.length - 1 ? 'none' : 'auto'
                  }}
                  onMouseEnter={(e) => {
                    if (activePlanIndex !== plans.length - 1) {
                      e.currentTarget.style.color = '#6366F1';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#E2E8F0';
                  }}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="48" 
                    height="96" 
                    viewBox="0 0 24 48" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    style={{ width: '48px', height: '96px', filter: 'drop-shadow(0 10px 15px rgba(0, 0, 0, 0.3))', pointerEvents: 'none' }}
                  >
                    <polyline points="9 6 15 24 9 42" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Navigation Indicators - Only visible on mobile/intermediate */}
            <style>{`
              @media (min-width: 923px) {
                .carousel-nav-plans {
                  display: none !important;
                }
              }
            `}</style>
            <div className="carousel-nav-plans flex flex-col items-center gap-6 w-full" style={{ marginTop: '16px', marginBottom: '40px' }}>
              {/* Indicators (dots) */}
              <div className="flex justify-center gap-2">
                {plans.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToPlan(index)}
                    className={`rounded-full transition-all duration-300 ${
                      activePlanIndex === index 
                        ? 'bg-mystic-indigo w-8 h-2' 
                        : 'bg-moonlight-text/30 w-2 h-2 hover:bg-moonlight-text/50'
                    }`}
                    aria-label={`Ir para plano ${index + 1}`}
                  />
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* How It Works Modal */}
      <Modal isOpen={showHowItWorksModal} onClose={() => setShowHowItWorksModal(false)} title="Como funciona">
        <div className="flex flex-col gap-8">
          {features.map((feature, index) => (
            <div key={index} className="flex gap-6">
              <div className="flex-shrink-0">
                <div 
                  className="rounded-full bg-mystic-indigo/10 border border-mystic-indigo/30 flex items-center justify-center"
                  style={{ width: '56px', height: '56px' }}
                >
                  <feature.icon className="w-6 h-6 text-mystic-indigo" />
                </div>
              </div>
              <div>
                <h3 className="text-xl text-starlight-text mb-3">{feature.title}</h3>
                <p className="text-base text-moonlight-text leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Login Modal - Backdrop com Blur */}
      {showLoginModal && (
        <>
          {/* Backdrop com blur */}
          <div 
            className="fixed inset-0 z-50 bg-night-sky/80 backdrop-blur-md"
            onClick={() => {
              setShowLoginModal(false);
              setLoginError(false);
            }}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none" style={{ padding: '5%' }}>
            <style>{`
              @media (min-width: 768px) {
                .login-modal-container {
                  padding: 16px !important;
                }
              }
              @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
                20%, 40%, 60%, 80% { transform: translateX(8px); }
              }
              .shake-animation {
                animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both;
              }
            `}</style>
            <div className={`relative pointer-events-auto ${loginError && shakeModal ? 'shake-animation' : ''}`}>
              {/* Botão X - Fora do modal, canto superior direito */}
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  setLoginError(false);
                }}
                className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-midnight-surface border border-obsidian-border text-moonlight-text hover:text-starlight-text hover:border-mystic-indigo transition-colors flex items-center justify-center z-10"
                aria-label="Fechar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              {/* Conteúdo do Modal */}
              <div 
                className="bg-midnight-surface border border-obsidian-border rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
                style={{ padding: '32px' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div>
                  <h2 className="text-2xl md:text-3xl text-starlight-text">Entrar / Criar conta</h2>
                </div>

                {/* Espaçador explícito */}
                <div style={{ height: '30px' }} />

                {/* Formulário */}
                <div className="flex flex-col gap-6">
                  {/* Campo Email */}
                  <div className="flex flex-col gap-2">
                    <input
                      type="email"
                      placeholder="Insira seu email"
                      className="w-full bg-night-sky/50 border border-obsidian-border rounded-xl text-base text-starlight-text placeholder:text-moonlight-text/60 focus:outline-none focus:border-mystic-indigo transition-colors"
                      style={{ padding: '16px 20px' }}
                    />
                  </div>

                  {/* Campo Senha */}
                  <div className="flex flex-col gap-2">
                    <input
                      type="password"
                      placeholder="Insira sua senha"
                      className="w-full bg-night-sky/50 border border-obsidian-border rounded-xl text-base text-starlight-text placeholder:text-moonlight-text/60 focus:outline-none focus:border-mystic-indigo transition-colors"
                      style={{ padding: '16px 20px' }}
                    />
                    
                    {/* Link Esqueci minha senha */}
                    <button
                      onClick={() => {/* TODO: implementar recuperação de senha */}}
                      className="text-sm text-moonlight-text hover:text-mystic-indigo transition-colors self-start"
                    >
                      Esqueci minha senha
                    </button>
                  </div>

                  {/* Botão Entrar */}
                  <div className="flex flex-col items-center gap-4 mt-4">
                    {/* Mensagem de erro */}
                    {loginError && (
                      <div className="w-full flex justify-center">
                        <p className="text-sm text-oracle-ember text-center">
                          Login inválido
                        </p>
                      </div>
                    )}

                    <Button
                      size="lg"
                      className="w-full bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text h-14 text-lg"
                      onClick={handleLogin}
                    >
                      Entrar
                    </Button>

                    {/* Link Cadastre-se */}
                    <button
                      onClick={() => setShowSignupModal(true)}
                      className="text-sm text-moonlight-text hover:text-starlight-text transition-colors"
                    >
                      Não possui conta? <span className="text-mystic-indigo underline">Cadastre-se e ganhe 3 créditos!</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Signup Modal - Backdrop com Blur */}
      {showSignupModal && (
        <>
          {/* Backdrop com blur */}
          <div 
            className="fixed inset-0 z-50 bg-night-sky/80 backdrop-blur-md"
            onClick={() => {
              setShowSignupModal(false);
              setLoginError(false);
            }}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none" style={{ padding: '5%' }}>
            <style>{`
              @media (min-width: 768px) {
                .signup-modal-container {
                  padding: 16px !important;
                }
              }
              @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
                20%, 40%, 60%, 80% { transform: translateX(8px); }
              }
              .shake-animation {
                animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both;
              }
            `}</style>
            <div className={`relative pointer-events-auto ${shakeModal ? 'shake-animation' : ''}`}>
              {/* Botão X - Fora do modal, canto superior direito */}
              <button
                onClick={() => {
                  setShowSignupModal(false);
                  setLoginError(false);
                  // Limpar todos os campos
                  setSignupEmail('');
                  setSignupPassword('');
                  setSignupPasswordConfirm('');
                  setSignupBirthDate('');
                  setSignupCPF('');
                  setSignupPhone('');
                  // Limpar todos os erros
                  setEmailError('');
                  setPasswordError('');
                  setPasswordConfirmError('');
                  setBirthDateError('');
                  setCpfError('');
                  setPhoneError('');
                }}
                className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-midnight-surface border border-obsidian-border text-moonlight-text hover:text-starlight-text hover:border-mystic-indigo transition-colors flex items-center justify-center z-10"
                aria-label="Fechar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              {/* Conteúdo do Modal */}
              <div 
                className="bg-midnight-surface border border-obsidian-border rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto"
                style={{ padding: '32px' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div>
                  <h2 className="text-2xl md:text-3xl text-starlight-text">Criar conta</h2>
                </div>

                {/* Espaçador explícito */}
                <div style={{ height: '30px' }} />

                {/* Formulário */}
                <div className="flex flex-col gap-6">
                  {/* Campo Email */}
                  <div className="flex flex-col gap-2">
                    <input
                      type="email"
                      placeholder="Insira seu email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      onBlur={() => {
                        if (signupEmail && !validateEmail(signupEmail)) {
                          setEmailError('Email inválido');
                        } else if (signupEmail) {
                          setEmailError('');
                        }
                      }}
                      className="w-full bg-night-sky/50 border border-obsidian-border rounded-xl text-base text-starlight-text placeholder:text-moonlight-text/60 focus:outline-none focus:border-mystic-indigo transition-colors"
                      style={{ padding: '16px 20px' }}
                    />
                    {emailError && <p className="text-sm text-oracle-ember">{emailError}</p>}
                  </div>

                  {/* Campo Senha */}
                  <div className="flex flex-col gap-2">
                    <input
                      type="password"
                      placeholder="Insira sua senha"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="w-full bg-night-sky/50 border border-obsidian-border rounded-xl text-base text-starlight-text placeholder:text-moonlight-text/60 focus:outline-none focus:border-mystic-indigo transition-colors"
                      style={{ padding: '16px 20px' }}
                    />
                    {/* Lista de requisitos sempre visível */}
                    {signupPassword && (
                      <div className="flex flex-col gap-1">
                        {(() => {
                          const validation = validatePassword(signupPassword);
                          return (
                            <>
                              <div className="flex items-center gap-2">
                                {validation.hasMinLength ? (
                                  <>
                                    <Check className="w-4 h-4 text-verdant-success" />
                                    <span className="text-sm text-verdant-success">Pelo menos 8 caracteres</span>
                                  </>
                                ) : (
                                  <>
                                    <div className="w-4 h-4 rounded-full border-2 border-oracle-ember" />
                                    <span className="text-sm text-oracle-ember">Pelo menos 8 caracteres</span>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {validation.hasUpperCase ? (
                                  <>
                                    <Check className="w-4 h-4 text-verdant-success" />
                                    <span className="text-sm text-verdant-success">Letras maiúsculas</span>
                                  </>
                                ) : (
                                  <>
                                    <div className="w-4 h-4 rounded-full border-2 border-oracle-ember" />
                                    <span className="text-sm text-oracle-ember">Letras maiúsculas</span>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {validation.hasLowerCase ? (
                                  <>
                                    <Check className="w-4 h-4 text-verdant-success" />
                                    <span className="text-sm text-verdant-success">Letras minúsculas</span>
                                  </>
                                ) : (
                                  <>
                                    <div className="w-4 h-4 rounded-full border-2 border-oracle-ember" />
                                    <span className="text-sm text-oracle-ember">Letras minúsculas</span>
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {validation.hasSpecialChar ? (
                                  <>
                                    <Check className="w-4 h-4 text-verdant-success" />
                                    <span className="text-sm text-verdant-success">Um caractere especial</span>
                                  </>
                                ) : (
                                  <>
                                    <div className="w-4 h-4 rounded-full border-2 border-oracle-ember" />
                                    <span className="text-sm text-oracle-ember">Um caractere especial</span>
                                  </>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Campo Confirmar Senha */}
                  <div className="flex flex-col gap-2">
                    <input
                      type="password"
                      placeholder="Confirme sua senha"
                      value={signupPasswordConfirm}
                      onChange={(e) => setSignupPasswordConfirm(e.target.value)}
                      onBlur={() => {
                        if (signupPasswordConfirm && signupPassword !== signupPasswordConfirm) {
                          setPasswordConfirmError('As senhas não coincidem');
                        } else if (signupPasswordConfirm) {
                          setPasswordConfirmError('');
                        }
                      }}
                      className="w-full bg-night-sky/50 border border-obsidian-border rounded-xl text-base text-starlight-text placeholder:text-moonlight-text/60 focus:outline-none focus:border-mystic-indigo transition-colors"
                      style={{ padding: '16px 20px' }}
                    />
                    {passwordConfirmError && <p className="text-sm text-oracle-ember">{passwordConfirmError}</p>}
                  </div>

                  {/* Campo Data de Nascimento */}
                  <div className="flex flex-col gap-2">
                    <input
                      type="date"
                      placeholder="Insira sua data de nascimento"
                      value={signupBirthDate}
                      onChange={(e) => setSignupBirthDate(e.target.value)}
                      onBlur={() => {
                        if (signupBirthDate) {
                          const birthDate = new Date(signupBirthDate);
                          const today = new Date();
                          const age = today.getFullYear() - birthDate.getFullYear();
                          if (age < 18) {
                            setBirthDateError('Você deve ter pelo menos 18 anos');
                          } else {
                            setBirthDateError('');
                          }
                        }
                      }}
                      className="w-full bg-night-sky/50 border border-obsidian-border rounded-xl text-base text-starlight-text placeholder:text-moonlight-text/60 focus:outline-none focus:border-mystic-indigo transition-colors"
                      style={{ padding: '16px 20px' }}
                    />
                    <p className="text-xs text-moonlight-text/70">Utilizamos sua data de nascimento para personalizar suas leituras</p>
                    {birthDateError && <p className="text-sm text-oracle-ember">{birthDateError}</p>}
                  </div>

                  {/* Campo CPF */}
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={signupCPF}
                      onChange={(e) => handleCPFChange(e.target.value)}
                      maxLength={14}
                      className="w-full bg-night-sky/50 border border-obsidian-border rounded-xl text-base text-starlight-text placeholder:text-moonlight-text/60 focus:outline-none focus:border-mystic-indigo transition-colors"
                      style={{ padding: '16px 20px' }}
                    />
                    <p className="text-xs text-moonlight-text/70">Para segurança da sua conta e das transações</p>
                    {cpfError && <p className="text-sm text-oracle-ember">{cpfError}</p>}
                  </div>

                  {/* Campo Telefone */}
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="(00) 00000-0000"
                      value={signupPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      maxLength={15}
                      className="w-full bg-night-sky/50 border border-obsidian-border rounded-xl text-base text-starlight-text placeholder:text-moonlight-text/60 focus:outline-none focus:border-mystic-indigo transition-colors"
                      style={{ padding: '16px 20px' }}
                    />
                    {phoneError && <p className="text-sm text-oracle-ember">{phoneError}</p>}
                  </div>

                  {/* Botão Cadastrar */}
                  <div className="flex flex-col items-center gap-4 mt-4">
                    <Button
                      size="lg"
                      className="w-full bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text h-14 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleSignup}
                      disabled={!isSignupFormValid()}
                    >
                      Criar conta e ganhar 3 créditos
                    </Button>

                    {/* Link Entrar */}
                    <button
                      onClick={() => {
                        setShowSignupModal(false);
                        setShowLoginModal(true);
                      }}
                      className="text-sm text-moonlight-text hover:text-starlight-text transition-colors"
                    >
                      Já possui conta? <span className="text-mystic-indigo underline">Entrar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-obsidian-border bg-midnight-surface/50 backdrop-blur-sm">
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
        <div className="footer-container w-full" style={{ paddingTop: '48px', paddingBottom: '48px' }}>
          <div className="max-w-[1400px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12" style={{ marginBottom: '80px' }}>
              {/* Logo e descrição */}
              <div>
                <div className="flex items-center gap-3" style={{ marginBottom: '16px' }}>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-mystic-indigo to-oracle-ember flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-starlight-text" />
                  </div>
                  <span className="text-xl text-starlight-text">Tarot Online</span>
                </div>
                <small className="block text-moonlight-text/70 leading-relaxed">
                  Consultas de Tarot, Tarot Cigano e Cartomancia Clássica disponíveis 24/7 com interpretações profundas e personalizadas.
                </small>
              </div>

              {/* Links - Serviços */}
              <div>
                <h3 className="text-base text-starlight-text" style={{ marginBottom: '16px' }}>Serviços</h3>
                <ul className="space-y-3">
                  <li>
                    <button 
                      onClick={() => setShowLoginModal(true)}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                    >
                      Tarot
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => setShowLoginModal(true)}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                    >
                      Tarot Cigano
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => setShowLoginModal(true)}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                    >
                      Cartomancia Clássica
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => setShowHowItWorksModal(true)}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                    >
                      Como funciona
                    </button>
                  </li>
                </ul>
              </div>

              {/* Links - Informações */}
              <div>
                <h3 className="text-base text-starlight-text" style={{ marginBottom: '16px' }}>Informações</h3>
                <ul className="space-y-3">
                  <li>
                    <button 
                      onClick={() => {/* TODO: implementar página */}}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                    >
                      Sobre nós
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => {/* TODO: implementar página */}}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                    >
                      Termos de uso
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => {/* TODO: implementar página */}}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                    >
                      Política de privacidade
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => {/* TODO: implementar página */}}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                    >
                      Contato
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            {/* Copyright */}
            <div>
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