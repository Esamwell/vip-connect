import { motion } from 'framer-motion';
import { Crown, Sparkles, Car, Gift, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VipCard } from './VipCard';

export function HeroSection() {
  return (
    <section className="relative min-h-screen gradient-hero overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-vip-gold/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-vip-gold/10 rounded-full blur-3xl" />
      </div>
      
      {/* Floating Icons */}
      <motion.div 
        className="absolute top-32 left-[10%] text-vip-gold/20"
        animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
      >
        <Crown className="w-16 h-16" />
      </motion.div>
      <motion.div 
        className="absolute top-48 right-[15%] text-vip-gold/15"
        animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 5, repeat: Infinity, delay: 1 }}
      >
        <Car className="w-20 h-20" />
      </motion.div>
      <motion.div 
        className="absolute bottom-32 left-[20%] text-vip-gold/10"
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
      >
        <Sparkles className="w-12 h-12" />
      </motion.div>

      <div className="container mx-auto px-4 pt-32 pb-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-12rem)]">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-vip-gold/10 border border-vip-gold/20 mb-6">
              <Sparkles className="w-4 h-4 text-vip-gold" />
              <span className="text-sm text-vip-gold font-medium">Programa de Fidelidade Exclusivo</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-primary-foreground leading-tight mb-6">
              Seja um{' '}
              <span className="text-gradient-vip">Cliente VIP</span>
              <br />
              do Auto Shopping
            </h1>

            <p className="text-lg text-primary-foreground/70 mb-8 max-w-xl">
              Benefícios exclusivos, atendimento prioritário e vantagens especiais para quem compra conosco. Seu carro novo vem com tratamento premium.
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <Button 
                variant="hero" 
                size="xl"
                onClick={() => window.location.href = '/meu-cartao'}
              >
                <Crown className="w-5 h-5" />
                Acessar Meu Cartão
              </Button>
              <Button 
                variant="hero-outline" 
                size="xl"
                onClick={() => {
                  const element = document.getElementById('beneficios');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Conhecer Benefícios
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8">
              <div>
                <p className="text-3xl font-bold text-vip-gold">2.500+</p>
                <p className="text-sm text-primary-foreground/60">Clientes VIP</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-vip-gold">50+</p>
                <p className="text-sm text-primary-foreground/60">Lojas Parceiras</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-vip-gold">15+</p>
                <p className="text-sm text-primary-foreground/60">Benefícios Exclusivos</p>
              </div>
            </div>
          </motion.div>

          {/* Right Content - VIP Card Preview */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex justify-center lg:justify-end"
          >
            <div className="animate-float">
              <VipCard
                clientName="João Silva"
                clientId="VIP-2024-00847"
                storeName="Premium Motors"
                validUntil="15/01/2026"
                status="active"
                memberSince="15/01/2025"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path 
            d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
            fill="hsl(210, 25%, 97%)"
          />
        </svg>
      </div>
    </section>
  );
}
