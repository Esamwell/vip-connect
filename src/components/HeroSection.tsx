import { motion } from 'framer-motion';
import { Crown, Sparkles, Car, Gift, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VipCard } from './VipCard';

export function HeroSection() {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-background via-muted/30 to-background overflow-hidden">
      {/* Elegant Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--primary)) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>
      
      {/* Subtle Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-3xl animate-pulse" style={{ backgroundColor: 'rgba(164, 19, 22, 0.05)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full blur-3xl" style={{ backgroundColor: 'rgba(164, 19, 22, 0.03)' }} />
      </div>
      
      {/* Elegant Floating Icons */}
      <motion.div 
        className="absolute top-32 left-[10%]"
        animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{ color: 'rgba(164, 19, 22, 0.1)' }}
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-xl" style={{ backgroundColor: 'rgba(164, 19, 22, 0.05)' }} />
          <Crown className="w-16 h-16 relative z-10" />
        </div>
      </motion.div>
      <motion.div 
        className="absolute top-48 right-[15%] text-primary/8"
        animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 7, repeat: Infinity, delay: 1, ease: "easeInOut" }}
      >
        <div className="relative">
          <div className="absolute inset-0 bg-primary/5 rounded-full blur-xl" />
          <Car className="w-20 h-20 relative z-10" />
        </div>
      </motion.div>
      <motion.div 
        className="absolute bottom-32 left-[20%]"
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 6, repeat: Infinity, delay: 0.5, ease: "easeInOut" }}
        style={{ color: 'rgba(164, 19, 22, 0.08)' }}
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-xl" style={{ backgroundColor: 'rgba(164, 19, 22, 0.05)' }} />
          <Sparkles className="w-12 h-12 relative z-10" />
        </div>
      </motion.div>

      <div className="container mx-auto px-4 pt-32 pb-20 relative z-10">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-center min-h-[calc(100vh-12rem)]">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full shadow-sm mb-6 backdrop-blur-sm border" style={{ 
              background: 'linear-gradient(to right, rgba(164, 19, 22, 0.1), rgba(164, 19, 22, 0.05), transparent)',
              borderColor: 'rgba(164, 19, 22, 0.3)'
            }}>
              <Sparkles className="w-4 h-4 animate-pulse" style={{ color: '#a41316' }} />
              <span className="text-sm text-foreground font-semibold tracking-wide">Programa de Fidelidade Exclusivo</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight mb-6">
              Seja um{' '}
              <span className="bg-clip-text text-transparent font-extrabold" style={{
                backgroundImage: 'linear-gradient(to right, #a41316, #8b0f12, #a41316)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Cliente VIP
              </span>
              <br />
              do Auto Shopping
            </h1>

            <p className="text-lg text-muted-foreground mb-8 max-w-xl leading-relaxed">
              Benefícios exclusivos, atendimento prioritário e vantagens especiais para quem compra conosco. Seu carro novo vem com tratamento premium.
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <Button 
                size="xl"
                onClick={() => window.location.href = '/meu-cartao'}
                className="shadow-lg hover:shadow-xl transition-all text-white font-bold"
                style={{
                  backgroundColor: '#a41316',
                  borderColor: '#a41316'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#8b0f12';
                  e.currentTarget.style.borderColor = '#8b0f12';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#a41316';
                  e.currentTarget.style.borderColor = '#a41316';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Crown className="w-5 h-5" />
                Acessar Meu Cartão
              </Button>
              <Button 
                variant="outline" 
                size="xl"
                onClick={() => {
                  const element = document.getElementById('beneficios');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="border-2 font-bold transition-all hover:shadow-lg"
                style={{
                  borderColor: '#a41316',
                  color: '#a41316',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(164, 19, 22, 0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Gift className="w-5 h-5" />
                Conhecer Benefícios
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 pt-8 border-t border-border/50">
              <div className="group">
                <p className="text-3xl font-bold text-foreground transition-colors group-hover:transition-colors group-hover:text-[#a41316]">2.500+</p>
                <p className="text-sm text-muted-foreground mt-1">Clientes VIP</p>
              </div>
              <div className="group">
                <p className="text-3xl font-bold text-foreground transition-colors group-hover:text-[#a41316]">50+</p>
                <p className="text-sm text-muted-foreground mt-1">Lojas Parceiras</p>
              </div>
              <div className="group">
                <p className="text-3xl font-bold text-foreground transition-colors group-hover:text-[#a41316]">15+</p>
                <p className="text-sm text-muted-foreground mt-1">Benefícios Exclusivos</p>
              </div>
            </div>
          </motion.div>

          {/* Right Content - VIP Card Preview */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex justify-center lg:justify-start"
          >
            <div className="animate-float transform-gpu">
              <VipCard
                clientName="João Silva"
                clientId="VIP-2024-00847"
                storeName="Premium Motors"
                validUntil="15/01/2026"
                status="active"
                memberSince="15/01/2025"
                customBackground="#a41316"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Elegant Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path 
            d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
            fill="hsl(var(--muted))"
            className="opacity-50"
          />
        </svg>
      </div>
    </section>
  );
}
