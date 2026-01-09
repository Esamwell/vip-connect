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
    <div className="flex gap-4 p-4 rounded-xl bg-card border border-border hover:border-[#a41316]/30 hover:shadow-md transition-all group">
      <div 
        className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm transition-all group-hover:shadow-md group-hover:scale-110"
        style={{
          backgroundColor: 'rgba(164, 19, 22, 0.12)',
        }}
      >
        <Icon 
          className="w-6 h-6 transition-colors" 
          style={{ color: '#a41316' }}
        />
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
          <span className="inline-block px-4 py-2 rounded-full text-sm font-medium mb-4 border" style={{ 
            backgroundColor: 'rgba(164, 19, 22, 0.1)',
            color: '#a41316',
            borderColor: 'rgba(164, 19, 22, 0.2)'
          }}>
            Vantagens Exclusivas
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            O que você ganha como <span className="bg-clip-text text-transparent font-extrabold" style={{
              backgroundImage: 'linear-gradient(to right, #a41316, #8b0f12, #a41316)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Cliente VIP</span>
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
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{
                background: 'linear-gradient(to bottom right, #a41316, #8b0f12)'
              }}>
                <Sparkles className="w-5 h-5 text-white" />
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
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{
                background: 'linear-gradient(to bottom right, #a41316, #8b0f12)'
              }}>
                <Gift className="w-5 h-5 text-white" />
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
          className="text-center rounded-2xl p-8 border"
          style={{
            background: 'linear-gradient(to right, rgba(164, 19, 22, 0.05), rgba(164, 19, 22, 0.1), rgba(164, 19, 22, 0.05))',
            borderColor: 'rgba(164, 19, 22, 0.2)'
          }}
        >
          <h3 className="text-2xl font-display font-bold text-foreground mb-3">
            Quer saber todos os seus benefícios?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Acesse seu cartão VIP digital e descubra todas as vantagens disponíveis para você. 
            Novos benefícios são adicionados frequentemente!
          </p>
          <Button 
            size="lg"
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
            <Star className="w-5 h-5" />
            Acessar Meu Cartão VIP
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
