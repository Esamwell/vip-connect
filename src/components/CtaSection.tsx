import { motion } from 'framer-motion';
import { Crown, MessageCircle, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CtaSection() {
  return (
    <section id="contato" className="py-20 gradient-hero relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 right-10 w-64 h-64 bg-vip-gold/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-vip-gold/20 rounded-full blur-2xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-16 h-16 rounded-2xl gradient-vip flex items-center justify-center mx-auto mb-6 shadow-vip animate-pulse-gold">
              <Crown className="w-8 h-8 text-primary" />
            </div>

            <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-4">
              Precisa de Ajuda?
            </h2>
            <p className="text-lg text-primary-foreground/70 mb-8">
              Nossa Central Cliente VIP está pronta para atender você com 
              prioridade. Tire dúvidas, abra chamados ou solicite suporte.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <Button variant="hero" size="lg">
                <MessageCircle className="w-5 h-5" />
                Abrir Chamado
              </Button>
              <Button variant="hero-outline" size="lg">
                <Phone className="w-5 h-5" />
                WhatsApp VIP
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-primary-foreground/60">
              <a href="tel:+5511999999999" className="flex items-center gap-2 hover:text-vip-gold transition-colors">
                <Phone className="w-4 h-4" />
                (11) 99999-9999
              </a>
              <a href="mailto:vip@autoshopping.com.br" className="flex items-center gap-2 hover:text-vip-gold transition-colors">
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
