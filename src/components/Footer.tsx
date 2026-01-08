import { Crown } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-primary py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-vip flex items-center justify-center">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="font-display font-bold text-lg text-primary-foreground">
                Cliente VIP
              </span>
              <p className="text-xs text-primary-foreground/60">
                Auto Shopping Itapoan
              </p>
            </div>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-primary-foreground/70">
            <a href="#" className="hover:text-vip-gold transition-colors">
              Termos de Uso
            </a>
            <a href="#" className="hover:text-vip-gold transition-colors">
              Privacidade
            </a>
            <a href="#" className="hover:text-vip-gold transition-colors">
              Regulamento
            </a>
            <a href="#" className="hover:text-vip-gold transition-colors">
              Lojas Participantes
            </a>
          </nav>

          {/* Copyright */}
          <p className="text-xs text-primary-foreground/50">
            © {new Date().getFullYear()} Auto Shopping Itapoan. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
