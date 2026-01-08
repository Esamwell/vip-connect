import { motion } from 'framer-motion';
import { 
  Droplets, 
  Wrench, 
  Sparkles, 
  Gift, 
  Shield, 
  HeadphonesIcon,
  Car,
  Percent,
  Star,
  Tag
} from 'lucide-react';
import { Button } from './ui/button';

const shoppingBenefits = [
  {
    icon: Droplets,
    title: 'Lavagem Completa',
    description: 'Lavagens gratuitas no centro de estética automotiva do shopping.',
  },
  {
    icon: Sparkles,
    title: 'Estética Veicular',
    description: 'Descontos exclusivos em polimento, cristalização e tratamentos.',
  },
  {
    icon: Wrench,
    title: 'Revisões e Check-ups',
    description: 'Verificações gratuitas e condições especiais em manutenções.',
  },
  {
    icon: Shield,
    title: 'Garantia Estendida',
    description: 'Condições especiais para proteger seu veículo por mais tempo.',
  },
  {
    icon: HeadphonesIcon,
    title: 'Atendimento Prioritário',
    description: 'Canal exclusivo de pós-venda com suporte dedicado.',
  },
  {
    icon: Percent,
    title: 'Descontos em Acessórios',
    description: 'Preços especiais em acessórios e personalizações.',
  },
];

const storeBenefits = [
  {
    icon: Car,
    title: 'Revisões de Cortesia',
    description: 'Revisões gratuitas oferecidas pela loja onde você comprou.',
  },
  {
    icon: Gift,
    title: 'Brindes Exclusivos',
    description: 'Kits de boas-vindas e presentes especiais da sua loja.',
  },
  {
    icon: Tag,
    title: 'Ofertas Especiais',
    description: 'Condições diferenciadas para troca e recompra de veículos.',
  },
  {
    icon: Star,
    title: 'Programa de Pontos',
    description: 'Acumule vantagens a cada serviço realizado na loja.',
  },
];

function BenefitItem({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex gap-4 p-4 rounded-xl bg-card border border-border hover:border-accent/30 hover:shadow-md transition-all">
      <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-6 h-6 text-accent" />
      </div>
      <div>
        <h4 className="font-semibold text-foreground mb-1">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

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
          <span className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
            Vantagens Exclusivas
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            O que você ganha como <span className="text-gradient-vip">Cliente VIP</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Comprou um veículo no Auto Shopping Itapoan? Você automaticamente se torna um Cliente VIP 
            com acesso a benefícios incríveis do shopping e da loja onde realizou sua compra.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Shopping Benefits */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl gradient-vip flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Benefícios do Shopping</h3>
                <p className="text-sm text-muted-foreground">Válidos em parceiros do Auto Shopping</p>
              </div>
            </div>
            <div className="space-y-3">
              {shoppingBenefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <BenefitItem {...benefit} />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Store Benefits */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Gift className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Benefícios da Sua Loja</h3>
                <p className="text-sm text-muted-foreground">Exclusivos da loja onde você comprou</p>
              </div>
            </div>
            <div className="space-y-3">
              {storeBenefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <BenefitItem {...benefit} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center bg-gradient-to-r from-accent/5 via-accent/10 to-accent/5 rounded-2xl p-8 border border-accent/20"
        >
          <h3 className="text-2xl font-display font-bold text-foreground mb-3">
            Quer saber todos os seus benefícios?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Acesse seu cartão VIP digital e descubra todas as vantagens disponíveis para você. 
            Novos benefícios são adicionados frequentemente!
          </p>
          <Button 
            variant="vip" 
            size="lg"
            onClick={() => window.location.href = '/meu-cartao'}
          >
            <Star className="w-5 h-5" />
            Acessar Meu Cartão VIP
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
