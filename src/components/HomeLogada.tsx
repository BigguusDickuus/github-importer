import { useState, useRef, useEffect } from "react";
import { Header } from "./Header";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { OracleSelectionModal } from "./OracleSelectionModal";
import { CardSelectionModal } from "./CardSelectionModal";

export function HomeLogada() {
  const [question, setQuestion] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showNoCreditsModal, setShowNoCreditsModal] = useState(false);
  const [showOracleSelectionModal, setShowOracleSelectionModal] = useState(false);
  const [showCardSelectionModal, setShowCardSelectionModal] = useState(false);
  
  // Simular créditos - TODO: pegar do backend/context
  const [credits, setCredits] = useState(0);

  // Plans carousel ref and state
  const plansRef = useRef<HTMLDivElement>(null);
  const [activePlanIndex, setActivePlanIndex] = useState(1);

  // Oracle selection state
  const [selectedOracles, setSelectedOracles] = useState<{
    tarot: boolean;
    lenormand: boolean;
    cartomancia: boolean;
  }>({
    tarot: false,
    lenormand: false,
    cartomancia: false,
  });

  const [selectedMethods, setSelectedMethods] = useState<{
    tarot: string;
    lenormand: string;
    cartomancia: string;
  }>({
    tarot: "",
    lenormand: "",
    cartomancia: "",
  });

  // Card selection flow state
  const [currentOracleQueue, setCurrentOracleQueue] = useState<Array<{
    type: 'tarot' | 'lenormand' | 'cartomancia';
    method: string;
  }>>([]);
  const [currentOracleIndex, setCurrentOracleIndex] = useState(0);
  const [allSelectedCards, setAllSelectedCards] = useState<Record<string, number[]>>({});

  const handleFieldClick = () => {
    if (credits === 0) {
      setShowNoCreditsModal(true);
    }
  };

  const handleConsultOracle = () => {
    if (credits === 0) {
      setShowNoCreditsModal(true);
    } else {
      setShowOracleSelectionModal(true);
    }
  };

  const handleBuyFromNoCredits = () => {
    setShowNoCreditsModal(false);
    setShowPaymentModal(true);
  };

  const handleOracleToggle = (oracle: 'tarot' | 'lenormand' | 'cartomancia') => {
    setSelectedOracles(prev => ({
      ...prev,
      [oracle]: !prev[oracle]
    }));
    // Reset method selection when unchecking
    if (selectedOracles[oracle]) {
      setSelectedMethods(prev => ({
        ...prev,
        [oracle]: ""
      }));
    }
  };

  const handleMethodChange = (oracle: 'tarot' | 'lenormand' | 'cartomancia', method: string) => {
    setSelectedMethods(prev => ({
      ...prev,
      [oracle]: method
    }));
  };

  const handleOracleSelectionProceed = () => {
    // Criar fila de oráculos selecionados
    const queue: Array<{
      type: 'tarot' | 'lenormand' | 'cartomancia';
      method: string;
    }> = [];

    if (selectedOracles.tarot) {
      queue.push({ type: 'tarot', method: selectedMethods.tarot });
    }
    if (selectedOracles.lenormand) {
      queue.push({ type: 'lenormand', method: selectedMethods.lenormand });
    }
    if (selectedOracles.cartomancia) {
      queue.push({ type: 'cartomancia', method: selectedMethods.cartomancia });
    }

    setCurrentOracleQueue(queue);
    setCurrentOracleIndex(0);
    setAllSelectedCards({});
    setShowOracleSelectionModal(false);
    setShowCardSelectionModal(true);
  };

  const handleCardSelectionComplete = (selectedCards: number[]) => {
    const currentOracle = currentOracleQueue[currentOracleIndex];
    const key = `${currentOracle.type}_${currentOracle.method}`;
    
    setAllSelectedCards(prev => ({
      ...prev,
      [key]: selectedCards
    }));

    // Se houver mais oráculos na fila, vai para o próximo
    if (currentOracleIndex < currentOracleQueue.length - 1) {
      setCurrentOracleIndex(prev => prev + 1);
    } else {
      // Finalizou todas as seleções
      setShowCardSelectionModal(false);
      // TODO: Aqui vai para a tela de resultados/interpretação
      console.log('Consulta completa:', {
        question,
        oracles: currentOracleQueue,
        selectedCards: allSelectedCards
      });
    }
  };

  const getSelectedCreditsCount = () => {
    let count = 0;
    if (selectedOracles.tarot) count++;
    if (selectedOracles.lenormand) count++;
    if (selectedOracles.cartomancia) count++;
    return count;
  };

  const canProceed = () => {
    if (selectedOracles.tarot && !selectedMethods.tarot) return false;
    if (selectedOracles.lenormand && !selectedMethods.lenormand) return false;
    if (selectedOracles.cartomancia && !selectedMethods.cartomancia) return false;
    return getSelectedCreditsCount() > 0;
  };

  const isConsultButtonDisabled = credits === 0 || question.trim() === '';

  // Scroll to initial position in plans carousel (index 1 - Explorador)
  useEffect(() => {
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

  const scrollToPlan = (index: number) => {
    if (plansRef.current) {
      const cards = plansRef.current.children;
      if (cards[index]) {
        (cards[index] as HTMLElement).scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
      }
    }
  };

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

      <Header isLoggedIn={true} onBuyCredits={() => setShowPaymentModal(true)} credits={credits} />

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
        <div className="hero-section-container w-full flex flex-col items-center">
          <div className="w-full max-w-[1200px] flex flex-col items-center">
            
            <div style={{ marginBottom: '40px' }}>
              <h1 
                className="text-starlight-text tracking-tight text-center w-full"
                style={{ 
                  fontSize: '2.5rem',
                  lineHeight: '1.1'
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

              <p className="text-moonlight-text text-center w-full max-w-[800px]">
                Consultas de Tarot, Tarot Cigano e Cartomancia Clássica disponíveis 24/7
              </p>

              <p className="text-oracle-ember text-center w-full max-w-[700px]">
                Interpretações profundas e personalizadas para suas perguntas
              </p>
            </div>

            {/* Prompt Card - HABILITADO */}
            <div className="w-full max-w-[900px]" style={{ marginBottom: '24px' }}>
              <div 
                className="bg-midnight-surface/80 backdrop-blur-sm border border-obsidian-border rounded-3xl shadow-2xl w-full flex flex-col"
                style={{ padding: '24px', gap: '24px' }}
              >
                <div 
                  onClick={credits === 0 ? handleFieldClick : undefined}
                  className={credits === 0 ? 'cursor-not-allowed' : ''}
                >
                  <textarea
                    placeholder="Faça sua pergunta..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    rows={6}
                    className="w-full bg-night-sky/50 border border-obsidian-border rounded-2xl text-lg md:text-xl text-starlight-text placeholder:text-moonlight-text/60 focus:outline-none focus:border-mystic-indigo transition-colors resize-none disabled:opacity-50"
                    style={{ 
                      padding: '24px',
                      pointerEvents: credits === 0 ? 'none' : 'auto'
                    }}
                    disabled={credits === 0}
                  />
                </div>
                
                <div className="w-full flex justify-center">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto sm:min-w-[50%] bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text h-14 md:h-16 text-lg md:text-xl px-8 whitespace-nowrap disabled:opacity-50"
                    onClick={handleConsultOracle}
                    disabled={isConsultButtonDisabled}
                    type="button"
                  >
                    <Sparkles className="mr-2" /> Consultar o Oráculo
                  </Button>
                </div>
              </div>
            </div>

            <p className="text-base md:text-lg text-moonlight-text/80 text-center w-full" style={{ marginBottom: '24px' }}>
              1 crédito por oráculo selecionado • Sem limites de temas
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center items-center w-full max-w-[600px]" style={{ marginBottom: '40px' }}>
              <Button 
                size="lg" 
                variant="outline"
                className="w-full sm:flex-1 border-obsidian-border text-moonlight-text hover:bg-midnight-surface hover:text-starlight-text h-14 md:h-16 text-base md:text-lg px-8"
                asChild
              >
                <Link to="/historico">📖 Histórico de leituras</Link>
              </Button>
            </div>

            {/* DEBUG BUTTON - Remover em produção */}
            <div className="flex justify-center w-full" style={{ marginBottom: '40px' }}>
              <Button 
                size="sm" 
                variant="outline"
                className="border-oracle-ember text-oracle-ember hover:bg-oracle-ember/10"
                onClick={() => setCredits(credits === 0 ? 5 : 0)}
              >
                🔧 DEBUG: Alternar Créditos ({credits === 0 ? '0 → 5' : '5 → 0'})
              </Button>
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
        <div className="planos-container w-full flex flex-col items-center">
          <div className="w-full max-w-[1400px] flex flex-col items-center">
            
            <div className="w-full flex flex-col items-center" style={{ marginBottom: '40px' }}>
              <h2 className="mb-8 text-4xl md:text-6xl text-starlight-text text-center w-full">
                Planos de créditos
              </h2>
              
              <p className="text-lg md:text-2xl text-moonlight-text text-center w-full max-w-[800px]">
                Escolha o plano ideal para suas consultas
              </p>
            </div>

            {/* Desktop: Grid | Mobile/Intermediate: Carousel */}
            <style>{`
              @media (max-width: 922px) {
                .plans-carousel-logada {
                  display: flex !important;
                  overflow-x: auto !important;
                  overflow-y: visible !important;
                  scroll-snap-type: x mandatory !important;
                  gap: 20px !important;
                  padding: 20px !important;
                  scrollbar-width: none !important;
                  -ms-overflow-style: none !important;
                }
                .plans-carousel-logada::-webkit-scrollbar {
                  display: none !important;
                }
                .plans-carousel-logada > div {
                  flex: 0 0 85% !important;
                  scroll-snap-align: center !important;
                  scroll-snap-stop: always !important;
                }
                .plans-container-spacing-logada {
                  margin-bottom: 16px !important;
                }
              }
              @media (min-width: 923px) {
                .plans-carousel-logada {
                  display: grid !important;
                  grid-template-columns: repeat(3, 1fr) !important;
                  gap: 40px !important;
                }
                .plans-container-spacing-logada {
                  margin-bottom: 40px !important;
                }
              }
            `}</style>
            
            {/* Container centralizado com position relative */}
            <div className="plans-container-spacing-logada" style={{ width: '100%', display: 'flex', justifyContent: 'center', position: 'relative' }}>
              <div style={{ width: '100%', maxWidth: '1100px', position: 'relative' }}>
                <div className="plans-carousel-logada w-full" ref={plansRef}>
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
                        <div className="absolute -top-4" style={{ left: '50%', transform: 'translateX(-50%)' }}>
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
                          onClick={() => setShowPaymentModal(true)}
                        >
                          Comprar créditos
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
              @media (min-width: 923px) {
                .carousel-arrows-plans {
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

      {/* Payment Modal - Backdrop com Blur */}
      {showPaymentModal && (
        <>
          {/* Backdrop com blur */}
          <div 
            className="fixed inset-0 z-50 bg-night-sky/80 backdrop-blur-md"
            onClick={() => setShowPaymentModal(false)}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none" style={{ padding: '16px' }}>
            <div className="relative pointer-events-auto">
              {/* Botão X - Fora do modal, canto superior direito */}
              <button
                onClick={() => setShowPaymentModal(false)}
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

              <div 
                className="bg-midnight-surface border border-obsidian-border rounded-3xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-y-auto"
                style={{ padding: '32px' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-6">
                  <h2 className="text-2xl md:text-3xl text-starlight-text text-center">Comprar Créditos</h2>
                </div>

                <p className="text-lg text-moonlight-text text-center" style={{ marginBottom: '32px' }}>
                  Escolha o plano ideal para você:
                </p>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Plano Iniciante */}
                  <div className="plan-card-mobile bg-night-sky/50 border border-obsidian-border rounded-2xl flex flex-col items-center text-center" style={{ padding: '24px' }}>
                    <style>{`
                      @media (max-width: 767px) {
                        .plan-card-mobile {
                          padding: 16px !important;
                        }
                        .plan-card-mobile .plan-title {
                          font-size: 1.125rem !important;
                          margin-bottom: 6px !important;
                        }
                        .plan-card-mobile .plan-credits-number {
                          font-size: 2rem !important;
                        }
                        .plan-card-mobile .plan-credits-text {
                          font-size: 0.875rem !important;
                        }
                        .plan-card-mobile .plan-credits-wrapper {
                          margin-bottom: 6px !important;
                        }
                        .plan-card-mobile .plan-price {
                          font-size: 1.5rem !important;
                        }
                        .plan-card-mobile .plan-price-per {
                          font-size: 0.75rem !important;
                          margin-top: 2px !important;
                        }
                        .plan-card-mobile .plan-price-wrapper {
                          margin-bottom: 10px !important;
                        }
                        .plan-card-mobile .plan-button {
                          height: 40px !important;
                          font-size: 0.875rem !important;
                        }
                        .plan-card-mobile .plan-badge {
                          font-size: 0.625rem !important;
                          padding: 2px 10px !important;
                        }
                      }
                    `}</style>
                    <h3 className="plan-title text-xl text-starlight-text" style={{ marginBottom: '8px' }}>Iniciante</h3>
                    <div className="plan-credits-wrapper" style={{ marginBottom: '8px' }}>
                      <div className="plan-credits-number text-3xl text-starlight-text">10</div>
                      <div className="plan-credits-text text-moonlight-text/70">créditos</div>
                    </div>
                    <div className="plan-price-wrapper" style={{ marginBottom: '12px' }}>
                      <div className="plan-price text-2xl text-mystic-indigo">R$ 25,00</div>
                      <div className="plan-price-per text-sm text-moonlight-text/70" style={{ marginTop: '2px' }}>R$ 2,50/cada</div>
                    </div>
                    <Button
                      className="plan-button w-full bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text mt-auto"
                      onClick={() => {/* TODO: Abrir gateway de pagamento */}}
                    >
                      Escolher
                    </Button>
                  </div>

                  {/* Plano Explorador */}
                  <div className="plan-card-mobile bg-night-sky/50 border-2 border-mystic-indigo rounded-2xl flex flex-col items-center text-center relative" style={{ padding: '24px' }}>
                    <div className="plan-badge absolute -top-3 left-1/2 -translate-x-1/2 bg-mystic-indigo text-starlight-text text-xs rounded-full" style={{ paddingLeft: '12px', paddingRight: '12px', paddingTop: '4px', paddingBottom: '4px' }}>
                      POPULAR
                    </div>
                    <h3 className="plan-title text-xl text-starlight-text" style={{ marginBottom: '8px' }}>Explorador</h3>
                    <div className="plan-credits-wrapper" style={{ marginBottom: '8px' }}>
                      <div className="plan-credits-number text-3xl text-starlight-text">25</div>
                      <div className="plan-credits-text text-moonlight-text/70">créditos</div>
                    </div>
                    <div className="plan-price-wrapper" style={{ marginBottom: '12px' }}>
                      <div className="plan-price text-2xl text-mystic-indigo">R$ 50,00</div>
                      <div className="plan-price-per text-sm text-moonlight-text/70" style={{ marginTop: '2px' }}>R$ 2,00/cada</div>
                    </div>
                    <Button
                      className="plan-button w-full bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text mt-auto"
                      onClick={() => {/* TODO: Abrir gateway de pagamento */}}
                    >
                      Escolher
                    </Button>
                  </div>

                  {/* Plano Místico */}
                  <div className="plan-card-mobile bg-night-sky/50 border border-obsidian-border rounded-2xl flex flex-col items-center text-center" style={{ padding: '24px' }}>
                    <h3 className="plan-title text-xl text-starlight-text" style={{ marginBottom: '8px' }}>Místico</h3>
                    <div className="plan-credits-wrapper" style={{ marginBottom: '8px' }}>
                      <div className="plan-credits-number text-3xl text-starlight-text">60</div>
                      <div className="plan-credits-text text-moonlight-text/70">créditos</div>
                    </div>
                    <div className="plan-price-wrapper" style={{ marginBottom: '12px' }}>
                      <div className="plan-price text-2xl text-mystic-indigo">R$ 100,00</div>
                      <div className="plan-price-per text-sm text-moonlight-text/70" style={{ marginTop: '2px' }}>R$ 1,67/cada</div>
                    </div>
                    <Button
                      className="plan-button w-full bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text mt-auto"
                      onClick={() => {/* TODO: Abrir gateway de pagamento */}}
                    >
                      Escolher
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* No Credits Modal - Backdrop com Blur */}
      {showNoCreditsModal && (
        <>
          {/* Backdrop com blur */}
          <div 
            className="fixed inset-0 z-50 bg-night-sky/80 backdrop-blur-md"
            onClick={() => setShowNoCreditsModal(false)}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none" style={{ padding: '16px' }}>
            <div className="relative pointer-events-auto">
              {/* Botão X - Fora do modal, canto superior direito */}
              <button
                onClick={() => setShowNoCreditsModal(false)}
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

              <div 
                className="bg-midnight-surface border border-obsidian-border rounded-3xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-y-auto"
                style={{ padding: '32px' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-6">
                  <h2 className="text-2xl md:text-3xl text-starlight-text text-center">Sem Créditos</h2>
                </div>

                <p className="text-lg text-moonlight-text text-center" style={{ marginBottom: '32px' }}>
                  Você não tem créditos suficientes para realizar uma consulta.
                </p>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Plano Iniciante */}
                  <div className="plan-card-mobile bg-night-sky/50 border border-obsidian-border rounded-2xl flex flex-col items-center text-center" style={{ padding: '24px' }}>
                    <style>{`
                      @media (max-width: 767px) {
                        .plan-card-mobile {
                          padding: 16px !important;
                        }
                        .plan-card-mobile .plan-title {
                          font-size: 1.125rem !important;
                          margin-bottom: 6px !important;
                        }
                        .plan-card-mobile .plan-credits-number {
                          font-size: 2rem !important;
                        }
                        .plan-card-mobile .plan-credits-text {
                          font-size: 0.875rem !important;
                        }
                        .plan-card-mobile .plan-credits-wrapper {
                          margin-bottom: 6px !important;
                        }
                        .plan-card-mobile .plan-price {
                          font-size: 1.5rem !important;
                        }
                        .plan-card-mobile .plan-price-per {
                          font-size: 0.75rem !important;
                          margin-top: 2px !important;
                        }
                        .plan-card-mobile .plan-price-wrapper {
                          margin-bottom: 10px !important;
                        }
                        .plan-card-mobile .plan-button {
                          height: 40px !important;
                          font-size: 0.875rem !important;
                        }
                        .plan-card-mobile .plan-badge {
                          font-size: 0.625rem !important;
                          padding: 2px 10px !important;
                        }
                      }
                    `}</style>
                    <h3 className="plan-title text-xl text-starlight-text" style={{ marginBottom: '8px' }}>Iniciante</h3>
                    <div className="plan-credits-wrapper" style={{ marginBottom: '8px' }}>
                      <div className="plan-credits-number text-3xl text-starlight-text">10</div>
                      <div className="plan-credits-text text-moonlight-text/70">créditos</div>
                    </div>
                    <div className="plan-price-wrapper" style={{ marginBottom: '12px' }}>
                      <div className="plan-price text-2xl text-mystic-indigo">R$ 25,00</div>
                      <div className="plan-price-per text-sm text-moonlight-text/70" style={{ marginTop: '2px' }}>R$ 2,50/cada</div>
                    </div>
                    <Button
                      className="plan-button w-full bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text mt-auto"
                      onClick={handleBuyFromNoCredits}
                    >
                      Escolher
                    </Button>
                  </div>

                  {/* Plano Explorador */}
                  <div className="plan-card-mobile bg-night-sky/50 border-2 border-mystic-indigo rounded-2xl flex flex-col items-center text-center relative" style={{ padding: '24px' }}>
                    <div className="plan-badge absolute -top-3 left-1/2 -translate-x-1/2 bg-mystic-indigo text-starlight-text text-xs rounded-full" style={{ paddingLeft: '12px', paddingRight: '12px', paddingTop: '4px', paddingBottom: '4px' }}>
                      POPULAR
                    </div>
                    <h3 className="plan-title text-xl text-starlight-text" style={{ marginBottom: '8px' }}>Explorador</h3>
                    <div className="plan-credits-wrapper" style={{ marginBottom: '8px' }}>
                      <div className="plan-credits-number text-3xl text-starlight-text">25</div>
                      <div className="plan-credits-text text-moonlight-text/70">créditos</div>
                    </div>
                    <div className="plan-price-wrapper" style={{ marginBottom: '12px' }}>
                      <div className="plan-price text-2xl text-mystic-indigo">R$ 50,00</div>
                      <div className="plan-price-per text-sm text-moonlight-text/70" style={{ marginTop: '2px' }}>R$ 2,00/cada</div>
                    </div>
                    <Button
                      className="plan-button w-full bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text mt-auto"
                      onClick={handleBuyFromNoCredits}
                    >
                      Escolher
                    </Button>
                  </div>

                  {/* Plano Místico */}
                  <div className="plan-card-mobile bg-night-sky/50 border border-obsidian-border rounded-2xl flex flex-col items-center text-center" style={{ padding: '24px' }}>
                    <h3 className="plan-title text-xl text-starlight-text" style={{ marginBottom: '8px' }}>Místico</h3>
                    <div className="plan-credits-wrapper" style={{ marginBottom: '8px' }}>
                      <div className="plan-credits-number text-3xl text-starlight-text">60</div>
                      <div className="plan-credits-text text-moonlight-text/70">créditos</div>
                    </div>
                    <div className="plan-price-wrapper" style={{ marginBottom: '12px' }}>
                      <div className="plan-price text-2xl text-mystic-indigo">R$ 100,00</div>
                      <div className="plan-price-per text-sm text-moonlight-text/70" style={{ marginTop: '2px' }}>R$ 1,67/cada</div>
                    </div>
                    <Button
                      className="plan-button w-full bg-mystic-indigo hover:bg-mystic-indigo-dark text-starlight-text mt-auto"
                      onClick={handleBuyFromNoCredits}
                    >
                      Escolher
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Oracle Selection Modal */}
      <OracleSelectionModal
        isOpen={showOracleSelectionModal}
        onClose={() => setShowOracleSelectionModal(false)}
        selectedOracles={selectedOracles}
        selectedMethods={selectedMethods}
        onOracleToggle={handleOracleToggle}
        onMethodChange={handleMethodChange}
        onProceed={handleOracleSelectionProceed}
      />

      {/* Card Selection Modal */}
      <CardSelectionModal
        isOpen={showCardSelectionModal}
        onClose={() => setShowCardSelectionModal(false)}
        currentOracleQueue={currentOracleQueue}
        currentOracleIndex={currentOracleIndex}
        allSelectedCards={allSelectedCards}
        onComplete={handleCardSelectionComplete}
      />

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
                <div className="flex items-center gap-3 mb-4">
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
                <h3 className="text-base text-starlight-text mb-4">Serviços</h3>
                <ul className="space-y-3">
                  <li>
                    <button 
                      onClick={() => {/* Scroll to top or navigate to consultation */}}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                    >
                      Tarot
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => {/* Scroll to top or navigate to consultation */}}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                    >
                      Tarot Cigano
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => {/* Scroll to top or navigate to consultation */}}
                      className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors"
                    >
                      Cartomancia Clássica
                    </button>
                  </li>
                  <li>
                    <Link to="/historico" className="text-sm text-moonlight-text/70 hover:text-mystic-indigo transition-colors">
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