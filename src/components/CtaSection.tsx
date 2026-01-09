import { motion } from 'framer-motion';
import { Crown, MessageCircle, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CtaSection() {
  return (
    <section id="contato" className="py-20 relative overflow-hidden bg-gradient-to-br from-muted/50 via-background to-muted/30">
      {/* Elegant Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #a41316 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Subtle Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-10 right-10 w-64 h-64 rounded-full blur-3xl animate-pulse" style={{ backgroundColor: 'rgba(164, 19, 22, 0.05)' }} />
        <div className="absolute bottom-10 left-10 w-48 h-48 rounded-full blur-2xl animate-pulse" style={{ backgroundColor: 'rgba(164, 19, 22, 0.03)', animationDelay: '1s' }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg" style={{
              background: 'linear-gradient(135deg, #a41316 0%, #8b0f12 100%)'
            }}>
              <Crown className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Precisa de Ajuda?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Nossa Central Cliente VIP está pronta para atender você com 
              prioridade. Tire dúvidas, abra chamados ou solicite suporte.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <Button 
                size="lg"
                onClick={() => window.location.href = '/meu-cartao'}
                className="shadow-lg hover:shadow-xl transition-shadow text-white"
                style={{
                  backgroundColor: '#a41316',
                  borderColor: '#a41316'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#8b0f12';
                  e.currentTarget.style.borderColor = '#8b0f12';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#a41316';
                  e.currentTarget.style.borderColor = '#a41316';
                }}
              >
                <MessageCircle className="w-5 h-5" />
                Abrir Chamado
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 hover:bg-muted transition-colors"
                style={{
                  borderColor: '#a41316',
                  color: '#a41316'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(164, 19, 22, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Phone className="w-5 h-5" />
                WhatsApp VIP
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-muted-foreground">
              <a 
                href="tel:+5511999999999" 
                className="flex items-center gap-2 transition-colors hover:text-foreground"
                style={{ '--hover-color': '#a41316' } as any}
                onMouseEnter={(e) => e.currentTarget.style.color = '#a41316'}
                onMouseLeave={(e) => e.currentTarget.style.color = ''}
              >
                <Phone className="w-4 h-4" />
                (11) 99999-9999
              </a>
              <a 
                href="mailto:vip@autoshopping.com.br" 
                className="flex items-center gap-2 transition-colors hover:text-foreground"
                onMouseEnter={(e) => e.currentTarget.style.color = '#a41316'}
                onMouseLeave={(e) => e.currentTarget.style.color = ''}
              >
                <Mail className="w-4 h-4" />
                vip@autoshopping.com.br
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
