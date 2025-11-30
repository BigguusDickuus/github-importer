import { useState, useEffect, useRef } from "react";
import { Header } from "./Header";
import { Button } from "./ui/button";
import { Sparkles, User, DollarSign, Check, ChevronLeft, ChevronRight, AlertCircle, X } from "lucide-react";
import { CardsIcon } from "./icons/CardsIcon";

export function HomeDeslogada() {
  const [question, setQuestion] = useState("");
  const [showHowItWorksModal, setShowHowItWorksModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const plansRef = useRef<HTMLDivElement>(null);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const [activePlanIndex, setActivePlanIndex] = useState(1);

  // Signup form states
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupCPF, setSignupCPF] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [emailError, setEmailError] = useState("");
  const [cpfError, setCpfError] = useState("");

  const features = [
    {
      icon: Sparkles,
      title: "Faça sua pergunta",
      description: "Digite sua dúvida ou inquietação no campo de texto"
    },
    {
      icon: CardsIcon,
      title: "Escolha seu oráculo",
      description: "Selecione entre Tarot, Lenormand ou Cartomancia"
    },
    {
      icon: User,
      title: "Receba sua leitura",
      description: "Obtenha interpretações profundas e personalizadas"
    }
  ];

  const plans = [
    {
      name: "Iniciante",
      description: "Perfeito para primeiras consultas",
      price: "R$ 9,90",
      credits: "5",
      pricePerCredit: "R$ 1,98 por crédito",
      savings: "",
      badge: "",
      highlight: false
    },
    {
      name: "Explorador",
      description: "O mais popular entre iniciantes",
      price: "R$ 24,90",
      credits: "15",
      pricePerCredit: "R$ 1,66 por crédito",
      savings: "Economize 16%",
      badge: "Mais popular",
      highlight: true
    },
    {
      name: "Místico",
      description: "Para consultas frequentes",
      price: "R$ 44,90",
      credits: "30",
      pricePerCredit: "R$ 1,50 por crédito",
      savings: "Economize 24%",
      badge: "",
      highlight: false
    }
  ];

  useEffect(() => {
    if (howItWorksRef.current && window.innerWidth <= 922) {
      const cards = howItWorksRef.current.children;
      if (cards[0]) {
        (cards[0] as HTMLElement).scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
      }
    }

    if (plansRef.current && window.innerWidth <= 922) {
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
      }, 500);
    }
  }, []);

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

  return (
    <div className="min-h-screen bg-night-sky text-moonlight-text relative">
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-mystic-indigo/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-oracle-ember/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-mystic-indigo/10 rounded-full blur-[100px]" />
      </div>

      <Header isLoggedIn={false} onLoginClick={() => setShowLoginModal(true)} />

      {/* Hero Section */}
      <section 
        className="hero-section relative z-10 pt-24 pb-40 md:pt-40 md:pb-56 flex flex-col items-center justify-center" 
        style={{ marginTop: 'calc(64px + 24px + 40px)' }}
      >
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
              <h1 className="mb-10 text-starlight-text tracking-tight text-center w-full">
                <style>{`
                  @media (min-width: 768px) {
                    .hero-title {
                      font-size: 3.0rem !important;
                    }
                  }
                `}</style>
                <span className="hero-title" style={{ fontSize: '2.5rem' }}>Tarot Online</span>
              </h1>

              <p className="mb-8 text-xl md:text-2xl text-moonlight-text text-center w-full max-w-[800px]">
                Consultas de Tarot, Tarot Cigano e Cartomancia Clássica disponíveis 24/7
              </p>

              <p className="mb-24 text-lg md:text-xl text-oracle-ember text-center w-full max-w-[700px]">
                Interpretações profundas e personalizadas para suas perguntas
              </p>
            </div>

            {/* Card de Prompt */}
            <div className="w-full max-w-[900px]" style={{ marginBottom: '24px' }}>
              <div 
                className="bg-midnight-surface/80 backdrop-blur-sm border border-obsidian-border rounded-3xl shadow-2xl w-full flex flex-col"
                style={{ padding: '24px', gap: '24px' }}
              >
                <textarea
                  placeholder="Faça sua pergunta..."
                  rows={6}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled
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
                onClick={() => setShowLoginModal(true)}
                className="w-full sm:flex-1 bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text h-14 md:h-16 text-base md:text-lg px-8"
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
          </div>
        </div>
      </section>

      {/* Como Funciona Section */}
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
            .carousel-arrows {
              display: none !important;
            }
          }
        `}</style>

        <div className="como-funciona-container w-full flex flex-col items-center justify-center">
          <div className="w-full max-w-[1400px] flex flex-col items-center">
            <div className="w-full flex flex-col items-center" style={{ marginBottom: '40px' }}>
              <h2 className="mb-8 text-4xl md:text-6xl text-starlight-text text-center w-full">
                Como funciona
              </h2>
              
              <p className="text-lg md:text-2xl text-moonlight-text text-center w-full max-w-[800px]">
                Três passos simples para acessar a <span className="text-mystic-indigo">sabedoria ancestral</span>
              </p>
            </div>

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
                      <h3 className="text-starlight-text text-center w-full" style={{ marginBottom: '16px' }}>
                        {feature.title}
                      </h3>
                      <p className="text-base text-moonlight-text leading-relaxed text-center w-full">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => scrollToFeature(activeFeatureIndex - 1)}
                  disabled={activeFeatureIndex === 0}
                  className="carousel-arrows"
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
                >
                  <ChevronLeft className="w-full h-full" />
                </button>

                <button
                  onClick={() => scrollToFeature(activeFeatureIndex + 1)}
                  disabled={activeFeatureIndex === features.length - 1}
                  className="carousel-arrows"
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
                >
                  <ChevronRight className="w-full h-full" />
                </button>
              </div>
            </div>

            <div className="flex gap-2 justify-center w-full">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToFeature(index)}
                  className={`rounded-full transition-all ${
                    index === activeFeatureIndex 
                      ? 'bg-mystic-indigo' 
                      : 'bg-obsidian-border hover:bg-moonlight-text/30'
                  }`}
                  style={{ 
                    width: index === activeFeatureIndex ? '32px' : '8px',
                    height: '8px'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Planos Section */}
      <section className="relative z-10 py-40 md:py-48 flex flex-col items-center justify-center">
        <style>{`
          @media (max-width: 767px) {
            .plans-container {
              padding-left: 5% !important;
              padding-right: 5% !important;
            }
          }
          @media (min-width: 768px) and (max-width: 922px) {
            .plans-container {
              padding-left: 5% !important;
              padding-right: 5% !important;
            }
          }
          @media (min-width: 923px) {
            .plans-container {
              padding-left: 64px !important;
              padding-right: 64px !important;
            }
          }
          @media (max-width: 922px) {
            .plans-carousel {
              display: flex !important;
              overflow-x: auto !important;
              scroll-snap-type: x mandatory !important;
              gap: 20px !important;
              padding: 0 20px !important;
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
            .plans-carousel-container-spacing {
              margin-bottom: 16px !important;
            }
          }
          @media (min-width: 923px) {
            .plans-carousel {
              display: grid !important;
              grid-template-columns: repeat(3, 1fr) !important;
              gap: 48px !important;
            }
            .plans-carousel-container-spacing {
              margin-bottom: 40px !important;
            }
            .plans-carousel-arrows {
              display: none !important;
            }
          }
        `}</style>

        <div className="plans-container w-full flex flex-col items-center justify-center">
          <div className="w-full max-w-[1400px] flex flex-col items-center">
            <div className="w-full flex flex-col items-center" style={{ marginBottom: '40px' }}>
              <h2 className="mb-8 text-4xl md:text-6xl text-starlight-text text-center w-full">
                Planos
              </h2>
              
              <p className="text-lg md:text-2xl text-moonlight-text text-center w-full max-w-[800px]">
                Escolha o plano ideal para sua jornada espiritual
              </p>
            </div>

            <div className="plans-carousel-container-spacing" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '100%', maxWidth: '1200px', position: 'relative' }}>
                <div className="plans-carousel w-full" ref={plansRef}>
                  {plans.map((plan, index) => (
                    <div
                      key={index}
                      className={`relative bg-midnight-surface/80 backdrop-blur-sm border ${
                        plan.highlight 
                          ? 'border-mystic-indigo shadow-lg shadow-mystic-indigo/20' 
                          : 'border-obsidian-border'
                      } rounded-3xl hover:border-mystic-indigo/50 transition-all duration-300 flex flex-col`}
                      style={{ padding: '32px' }}
                    >
                      {plan.badge && (
                        <div 
                          className="absolute -top-3 left-1/2 -translate-x-1/2 bg-mystic-indigo text-starlight-text text-sm rounded-full whitespace-nowrap"
                          style={{ padding: '6px 16px' }}
                        >
                          {plan.badge}
                        </div>
                      )}
                      
                      <div style={{ marginBottom: '24px' }}>
                        <h3 className="text-starlight-text text-center w-full" style={{ marginBottom: '8px' }}>
                          {plan.name}
                        </h3>
                        <p className="text-base text-moonlight-text text-center">{plan.description}</p>
                      </div>
                      
                      <div 
                        className="flex items-baseline justify-center w-full"
                        style={{ marginBottom: '8px' }}
                      >
                        <span className="text-5xl text-mystic-indigo">{plan.price}</span>
                      </div>
                      
                      <p className="text-sm text-moonlight-text text-center w-full" style={{ marginBottom: '16px' }}>
                        {plan.pricePerCredit}
                      </p>
                      
                      {plan.savings && (
                        <p className="text-sm text-oracle-ember text-center w-full" style={{ marginBottom: '24px' }}>
                          {plan.savings}
                        </p>
                      )}
                      
                      <div style={{ marginBottom: '24px' }}>
                        <p className="text-base text-moonlight-text text-center w-full" style={{ marginBottom: '16px' }}>
                          <span className="text-3xl text-starlight-text">{plan.credits}</span> créditos
                        </p>
                      </div>
                      
                      <Button
                        size="lg"
                        onClick={() => setShowLoginModal(true)}
                        className={`w-full ${
                          plan.highlight
                            ? 'bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text'
                            : 'border-obsidian-border text-moonlight-text hover:bg-midnight-surface hover:text-starlight-text'
                        } h-14 text-base`}
                        variant={plan.highlight ? "default" : "outline"}
                      >
                        Comprar
                      </Button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => scrollToPlan(activePlanIndex - 1)}
                  disabled={activePlanIndex === 0}
                  className="plans-carousel-arrows"
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
                >
                  <ChevronLeft className="w-full h-full" />
                </button>

                <button
                  onClick={() => scrollToPlan(activePlanIndex + 1)}
                  disabled={activePlanIndex === plans.length - 1}
                  className="plans-carousel-arrows"
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
                >
                  <ChevronRight className="w-full h-full" />
                </button>
              </div>
            </div>

            <div className="flex gap-2 justify-center w-full">
              {plans.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollToPlan(index)}
                  className={`rounded-full transition-all ${
                    index === activePlanIndex 
                      ? 'bg-mystic-indigo' 
                      : 'bg-obsidian-border hover:bg-moonlight-text/30'
                  }`}
                  style={{ 
                    width: index === activePlanIndex ? '32px' : '8px',
                    height: '8px'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-obsidian-border bg-midnight-surface/50 backdrop-blur-sm">
        <div 
          className="w-full flex flex-col items-center justify-center" 
          style={{ padding: '48px 32px' }}
        >
          <div className="w-full max-w-[1400px] flex flex-col items-center">
            <p className="text-sm text-moonlight-text text-center">
              © 2024 Tarot Online. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>

      {/* Modais */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-night-sky/80 backdrop-blur-sm"
            onClick={() => {
              setShowLoginModal(false);
              setLoginError(false);
            }}
          />
          
          <div 
            className="relative bg-midnight-surface border border-obsidian-border rounded-3xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            style={{ padding: '32px' }}
          >
            <div className="flex items-center justify-between w-full" style={{ marginBottom: '24px' }}>
              <h2 className="text-starlight-text">Login</h2>
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  setLoginError(false);
                }}
                className="w-10 h-10 flex items-center justify-center text-moonlight-text hover:text-starlight-text hover:bg-night-sky rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex flex-col gap-6 w-full">
              <div className="flex flex-col w-full" style={{ gap: '8px' }}>
                <label className="text-sm text-moonlight-text">Email</label>
                <input
                  type="email"
                  className="w-full bg-night-sky/50 border border-obsidian-border rounded-xl text-base text-starlight-text placeholder:text-moonlight-text/60 focus:outline-none focus:border-mystic-indigo transition-colors"
                  style={{ padding: '12px 16px' }}
                  placeholder="seu@email.com"
                />
              </div>
              
              <div className="flex flex-col w-full" style={{ gap: '8px' }}>
                <label className="text-sm text-moonlight-text">Senha</label>
                <input
                  type="password"
                  className="w-full bg-night-sky/50 border border-obsidian-border rounded-xl text-base text-starlight-text placeholder:text-moonlight-text/60 focus:outline-none focus:border-mystic-indigo transition-colors"
                  style={{ padding: '12px 16px' }}
                  placeholder="••••••••"
                />
              </div>
              
              {loginError && (
                <div 
                  className="flex items-center gap-3 bg-blood-moon-error/10 border border-blood-moon-error/30 rounded-xl w-full"
                  style={{ padding: '12px 16px' }}
                >
                  <AlertCircle className="w-5 h-5 text-blood-moon-error flex-shrink-0" />
                  <p className="text-sm text-blood-moon-error">Email ou senha incorretos</p>
                </div>
              )}
              
              <Button
                size="lg"
                className="w-full bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text h-14 text-base"
              >
                Entrar
              </Button>

              <div className="flex items-center justify-center w-full">
                <button
                  onClick={() => {
                    setShowLoginModal(false);
                    setShowSignupModal(true);
                    setLoginError(false);
                  }}
                  className="text-sm text-mystic-indigo hover:text-mystic-indigo-dark transition-colors"
                >
                  Não tem uma conta? Criar conta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
