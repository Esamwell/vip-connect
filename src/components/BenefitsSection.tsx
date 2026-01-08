import { motion } from 'framer-motion';
import { 
  Droplets, 
  Wrench, 
  Sparkles, 
  Gift, 
  Shield, 
  HeadphonesIcon,
  Car,
  Percent
} from 'lucide-react';
import { BenefitCard } from './BenefitCard';

const benefits = [
  {
    icon: Droplets,
    title: 'Lavagem Completa',
    description: 'Uma lavagem completa por mês no nosso centro de estética automotivo.',
    source: 'shopping' as const,
  },
  {
    icon: Sparkles,
    title: 'Estética Veicular',
    description: '20% de desconto em polimento, cristalização e tratamentos especiais.',
    source: 'shopping' as const,
  },
  {
    icon: Wrench,
    title: 'Revisão Grátis',
    description: 'Check-up completo de 30 pontos no seu veículo a cada 6 meses.',
    source: 'shopping' as const,
  },
  {
    icon: Shield,
    title: 'Garantia Estendida',
    description: 'Condições especiais para extensão da garantia do seu veículo.',
    source: 'shopping' as const,
  },
  {
    icon: HeadphonesIcon,
    title: 'Atendimento Prioritário',
    description: 'Canal exclusivo de pós-venda com resposta em até 24h.',
    source: 'shopping' as const,
  },
  {
    icon: Percent,
    title: 'Descontos em Acessórios',
    description: 'Até 15% de desconto em acessórios e personalizações.',
    source: 'shopping' as const,
  },
];

const storeExampleBenefits = [
  {
    icon: Car,
    title: 'Revisão de Cortesia',
    description: 'Revisão completa após 3 meses da compra na Premium Motors.',
    source: 'store' as const,
    expiresIn: '45 dias',
  },
  {
    icon: Gift,
    title: 'Kit Boas-vindas',
    description: 'Tapetes, porta-malas e aromatizador personalizados.',
    source: 'store' as const,
    used: true,
  },
];

export function BenefitsSection() {
  return (
    <section id="beneficios" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-vip-gold/10 text-vip-gold-dark text-sm font-medium mb-4">
            Vantagens Exclusivas
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            Benefícios do <span className="text-gradient-vip">Cliente VIP</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ao se tornar cliente VIP, você tem acesso a benefícios exclusivos do Auto Shopping 
            e vantagens especiais da loja onde você realizou sua compra.
          </p>
        </motion.div>

        {/* Shopping Benefits */}
        <div className="mb-12">
          <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-vip flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            Benefícios do Shopping
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <BenefitCard {...benefit} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Store Benefits Example */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Gift className="w-4 h-4 text-primary" />
            </div>
            Benefícios da Sua Loja
            <span className="text-xs text-muted-foreground font-normal">(exemplo: Premium Motors)</span>
          </h3>
          <div className="grid md:grid-cols-2 gap-4 max-w-2xl">
            {storeExampleBenefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <BenefitCard {...benefit} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
