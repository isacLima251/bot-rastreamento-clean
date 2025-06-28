import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible.jsx'
import { 
  ChevronDown, 
  Bell, 
  Zap, 
  MessageSquare, 
  Check, 
  Star, 
  Users, 
  Clock,
  Shield,
  TrendingUp,
  Smartphone,
  BarChart3,
  Rocket,
  Heart,
  Award,
  Target,
  ArrowRight,
  Play,
  CheckCircle2,
  Timer,
  DollarSign
} from 'lucide-react'
import './App.css'

// Importar o logotipo
import whatsshipLogo from './assets/whatsship_logo.png'

function App() {
  const [openFaq, setOpenFaq] = useState(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  const benefits = [
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Economize 8+ horas por semana",
      description: "Pare de responder manualmente sobre status de pedidos. Automatize 100% das consultas de rastreamento."
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Aumente a satisfação em 85%",
      description: "Clientes informados são clientes felizes. Notificações proativas geram mais confiança e fidelidade."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Reduza reclamações em 90%",
      description: "Elimine a ansiedade do cliente mantendo-o sempre atualizado sobre seu pedido."
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: "ROI de 300% em 30 dias",
      description: "Clientes satisfeitos compram mais. Aumente suas vendas recorrentes significativamente."
    }
  ]

  const features = [
    {
      icon: <Smartphone className="w-12 h-12 text-primary" />,
      title: "Notificações Inteligentes",
      description: "Envio automático via WhatsApp em cada etapa: pedido confirmado, produto postado, saiu para entrega, entregue.",
      highlight: "100% Automático"
    },
    {
      icon: <Zap className="w-12 h-12 text-secondary" />,
      title: "Integração Instantânea",
      description: "Conecte com Ticto, Braip, Shopify, WooCommerce ou qualquer plataforma via webhook em menos de 5 minutos.",
      highlight: "Setup em 5min"
    },
    {
      icon: <MessageSquare className="w-12 h-12 text-primary" />,
      title: "Mensagens Personalizadas",
      description: "Templates profissionais com variáveis: nome, pedido, transportadora, prazo. Deixe com a cara da sua marca.",
      highlight: "Totalmente Customizável"
    }
  ]

  const testimonials = [
    {
      quote: "Incrível! Reduzi 90% dos chamados sobre 'onde está meu pedido'. Agora meus clientes ficam tranquilos e eu foco em vender mais.",
      author: "Carla Mendes",
      store: "Moda Feminina Plus",
      revenue: "R$ 50k/mês",
      rating: 5,
      image: "👩‍💼"
    },
    {
      quote: "Meu NPS subiu de 6 para 9.2 em apenas 2 meses! Os clientes adoram receber as atualizações automáticas. Vale cada centavo!",
      author: "Roberto Silva",
      store: "Tech Store Pro",
      revenue: "R$ 120k/mês", 
      rating: 5,
      image: "👨‍💻"
    },
    {
      quote: "Economizo mais de 10 horas por semana que gastava respondendo sobre rastreamento. Agora uso esse tempo para criar novos produtos!",
      author: "Ana Costa",
      store: "Casa & Decoração",
      revenue: "R$ 80k/mês",
      rating: 5,
      image: "👩‍🎨"
    }
  ]

  const faqData = [
    {
      question: "Como funciona a integração com minha loja?",
      answer: "Super simples! Oferecemos integrações nativas com Ticto, Braip, Shopify e WooCommerce. Para outras plataformas, basta configurar um webhook (fornecemos o passo a passo). A configuração leva menos de 5 minutos e nosso suporte te ajuda se precisar."
    },
    {
      question: "Posso personalizar as mensagens do WhatsApp?",
      answer: "Claro! Você pode personalizar completamente as mensagens usando variáveis como {{nome_cliente}}, {{numero_pedido}}, {{transportadora}}, {{prazo_entrega}} e muito mais. Temos templates prontos ou você pode criar do zero com a identidade da sua marca."
    },
    {
      question: "E se eu ultrapassar o limite do meu plano?",
      answer: "Sem problemas! Se ultrapassar, as notificações são pausadas até o próximo ciclo ou você pode fazer upgrade instantâneo. Também enviamos alertas quando está chegando perto do limite para você se planejar."
    },
    {
      question: "Funciona com qualquer transportadora?",
      answer: "Sim! Integramos com Correios, Jadlog, Total Express, Loggi, Mercado Envios e mais de 50 transportadoras. Se sua transportadora não estiver na lista, podemos adicionar rapidamente."
    },
    {
      question: "Preciso de conhecimento técnico?",
      answer: "Não! Nossa interface é super intuitiva, feita para qualquer pessoa usar. Além disso, oferecemos suporte completo via WhatsApp, vídeo-chamada e até configuração assistida para você não ter dor de cabeça."
    },
    {
      question: "Posso testar antes de pagar?",
      answer: "Sim! Oferecemos 14 dias grátis, sem precisar de cartão de crédito. Você pode testar todas as funcionalidades e ver os resultados antes de decidir. Temos certeza que você vai amar!"
    }
  ]

  const stats = [
    { number: "500+", label: "Lojas Ativas" },
    { number: "50k+", label: "Notificações/Mês" },
    { number: "98%", label: "Satisfação" },
    { number: "24/7", label: "Suporte" }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 glass-effect border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={whatsshipLogo} alt="Whatsship" className="h-10 w-auto" />
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#beneficios" className="text-foreground hover:text-primary smooth-transition font-medium">
              Benefícios
            </a>
            <a href="#funcionalidades" className="text-foreground hover:text-primary smooth-transition font-medium">
              Como Funciona
            </a>
            <a href="#precos" className="text-foreground hover:text-primary smooth-transition font-medium">
              Preços
            </a>
            <a href="#depoimentos" className="text-foreground hover:text-primary smooth-transition font-medium">
              Casos de Sucesso
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="hidden md:inline-flex font-medium">
              Entrar
            </Button>
            <Button className="btn-primary px-6 py-2 rounded-full font-semibold">
              Começar Grátis
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={`pt-32 pb-20 px-4 hero-pattern transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="container mx-auto text-center">
          {/* Trust Badge */}
          <div className="inline-flex items-center space-x-2 bg-gradient-bg-soft border border-primary/20 rounded-full px-6 py-2 mb-8">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Mais de 500 lojas já automatizaram seu pós-venda</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-shadow">
            Pare de Perder Tempo com
            <br />
            <span className="gradient-primary">"Onde Está Meu Pedido?"</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed">
            Automatize 100% das notificações de rastreamento via WhatsApp. 
            <strong className="text-foreground"> Economize 8+ horas por semana</strong> e 
            <strong className="text-foreground"> aumente a satisfação dos clientes em 85%</strong>.
          </p>

          {/* CTA Principal */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
            <Button size="lg" className="btn-primary text-lg px-10 py-4 rounded-full font-bold neon-glow">
              <Rocket className="w-5 h-5 mr-2" />
              Começar Teste Grátis Agora
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4 rounded-full font-semibold border-2">
              <Play className="w-5 h-5 mr-2" />
              Ver Demonstração
            </Button>
          </div>
          
          <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Timer className="w-4 h-4 text-secondary" />
              <span>10 Pedidos  grátis</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-secondary" />
              <span>Sem cartão de crédito</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-secondary" />
              <span>Setup em 5 minutos</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 max-w-3xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold gradient-primary mb-2">{stat.number}</div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="beneficios" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="gradient-bg text-white mb-4 px-4 py-2 text-sm font-semibold">
              RESULTADOS COMPROVADOS
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-shadow">
              Transforme Seu Pós-Venda em uma
              <br />
              <span className="gradient-primary">Máquina de Fidelização</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Veja os resultados que nossos clientes alcançaram automatizando as notificações de rastreamento
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="hover-lift smooth-transition border-0 shadow-lg card-premium">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-6 gradient-bg rounded-full flex items-center justify-center text-white">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-shadow">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="funcionalidades" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="gradient-bg text-white mb-4 px-4 py-2 text-sm font-semibold">
              COMO FUNCIONA
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-shadow">
              Automatização Completa em
              <br />
              <span className="gradient-primary">3 Passos Simples</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Configure uma vez e deixe o Whatsship cuidar de tudo. Seus clientes sempre informados, você sempre tranquilo.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-12">
            {features.map((feature, index) => (
              <Card key={index} className="hover-lift smooth-transition border-0 shadow-xl relative overflow-hidden highlight-box">
                <div className="absolute top-4 right-4">
                  <Badge className="gradient-bg text-white text-xs px-3 py-1">
                    {feature.highlight}
                  </Badge>
                </div>
                <CardHeader className="text-center pb-4">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-bg-soft rounded-2xl flex items-center justify-center floating">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-2xl mb-4 text-shadow">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground text-lg leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="gradient-bg text-white mb-4 px-4 py-2 text-sm font-semibold">
              PLANOS E PREÇOS
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-shadow">
              Escolha o Plano Ideal para
              <br />
              <span className="gradient-primary">Seu Negócio</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Comece grátis e escale conforme seu crescimento. Todos os planos incluem suporte completo.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
            {/* Plano Start */}
            <Card className="hover-lift smooth-transition border-2 border-border">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl mb-2">Start</CardTitle>
                <div className="text-4xl font-bold mb-2">
                  R$ 39,99<span className="text-lg font-normal text-muted-foreground">/mês</span>
                </div>
                <CardDescription className="text-lg">Ideal para lojas iniciantes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {/* ... (itens da lista do plano) ... */}
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                    <span className="font-medium">50 notificações/mês</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                    <span>Todas as integrações</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                    <span>Templates personalizáveis</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                    <span>Suporte por email</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                    <span>Dashboard completo</span>
                  </div>
                </div>
                {/* BOTÃO DO PLANO START */}
                <Button 
                  className="w-full mt-6 btn-primary rounded-full font-semibold"
                  onClick={() => window.location.href = 'https://payment.ticto.app/O6073F635'}
                >
                  Começar Agora
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Plano Basic - Popular */}
            <Card className="hover-lift smooth-transition border-2 border-primary relative card-premium neon-glow">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="gradient-bg text-white px-6 py-2 text-sm font-bold">
                  🔥 MAIS POPULAR
                </Badge>
              </div>
              <CardHeader className="text-center pt-8">
                <CardTitle className="text-2xl mb-2">Basic</CardTitle>
                <div className="text-4xl font-bold mb-2">
                  R$ 59,99<span className="text-lg font-normal text-muted-foreground">/mês</span>
                </div>
                <CardDescription className="text-lg">Para lojas em crescimento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {/* ... (itens da lista do plano) ... */}
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                    <span className="font-medium">150 notificações/mês</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                    <span>Todas as integrações</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                    <span>Templates personalizáveis</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                    <span>Suporte prioritário</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                    <span>Relatórios avançados</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                    <span>Configuração assistida</span>
                  </div>
                </div>
                {/* BOTÃO DO PLANO BASIC */}
                <Button 
                  className="w-full mt-6 btn-primary rounded-full font-semibold text-lg py-3"
                  onClick={() => window.location.href = 'https://payment.ticto.app/O8EC5C302'}
                >
                  Começar Agora
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Plano Pro */}
            <Card className="hover-lift smooth-transition border-2 border-border">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl mb-2">Pro</CardTitle>
                <div className="text-4xl font-bold mb-2">
                  R$ 99,99<span className="text-lg font-normal text-muted-foreground">/mês</span>
                </div>
                <CardDescription className="text-lg">Para lojas estabelecidas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {/* ... (itens da lista do plano) ... */}
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                    <span className="font-medium">250 notificações/mês</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                    <span>Todas as integrações</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                    <span>Templates personalizáveis</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                    <span>Suporte VIP (WhatsApp)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                    <span>API personalizada</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                    <span>Múltiplas lojas</span>
                  </div>
                </div>
                {/* BOTÃO DO PLANO PRO */}
                <Button 
                  className="w-full mt-6 btn-primary rounded-full font-semibold"
                  onClick={() => window.location.href = 'https://payment.ticto.app/OEE2CBEAA'}
                >
                  Começar Agora
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Plano Enterprise */}
          <Card className="max-w-2xl mx-auto text-center gradient-bg-soft border-2 border-primary/20">
            <CardContent className="p-8">
              <Award className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-2xl font-bold mb-4">Plano Enterprise</h3>
              <p className="text-lg text-muted-foreground mb-6">
                Mais de 250 notificações? Precisa de funcionalidades especiais? 
                <br />
                Vamos criar um plano personalizado para você.
              </p>
              <Button variant="outline" size="lg" className="border-2 border-primary text-primary hover:bg-primary hover:text-white font-semibold">
                Falar com Especialista
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="depoimentos" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="gradient-bg text-white mb-4 px-4 py-2 text-sm font-semibold">
              CASOS DE SUCESSO
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-shadow">
              Mais de 250 pedidos
              <br />
              <span className="gradient-primary">Transformaram Seus Resultados</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Veja como o Whatsship está revolucionando o pós-venda de e-commerces em todo o Brasil
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover-lift smooth-transition border-0 shadow-xl relative overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <blockquote className="text-lg mb-6 italic leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{testimonial.image}</div>
                    <div>
                      <div className="font-bold text-lg">{testimonial.author}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.store}</div>
                      <div className="text-sm font-semibold text-secondary">{testimonial.revenue}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <Badge className="gradient-bg text-white mb-4 px-4 py-2 text-sm font-semibold">
              DÚVIDAS FREQUENTES
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-shadow">
              Tire Todas as Suas
              <br />
              <span className="gradient-primary">Dúvidas</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Respostas para as perguntas mais comuns sobre o Whatsship
            </p>
          </div>

          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <Card key={index} className="hover-lift smooth-transition border-0 shadow-lg">
                <Collapsible open={openFaq === index} onOpenChange={() => toggleFaq(index)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 smooth-transition">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-left text-lg font-semibold">{faq.question}</CardTitle>
                        <ChevronDown 
                          className={`w-6 h-6 smooth-transition text-primary ${openFaq === index ? 'rotate-180' : ''}`} 
                        />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed text-lg">{faq.answer}</p>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 gradient-bg text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Pronto para Automatizar Seu Pós-Venda?
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
            Junte-se a mais de 500 lojistas que já transformaram seus resultados com o Whatsship. 
            Comece seu teste gratuito agora mesmo!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Button size="lg" className="bg-white text-primary hover:bg-gray-100 text-lg px-10 py-4 rounded-full font-bold">
              <Rocket className="w-5 h-5 mr-2" />
              Começar Teste Grátis de 14 Dias
            </Button>
            <div className="text-sm opacity-75">
              ✓ Sem cartão de crédito ✓ Setup em 5 minutos ✓ Suporte completo
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <img src={whatsshipLogo} alt="Whatsship" className="h-8 w-auto filter invert" />
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm opacity-75">&copy; 2025 Whatsship. Todos os direitos reservados.</p>
              <p className="text-xs opacity-50 mt-1">Automatize seu pós-venda e fidelize seus clientes</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App

