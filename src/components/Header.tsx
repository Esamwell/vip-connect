import { Menu, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  showNav?: boolean;
}

export function Header({ showNav = true }: HeaderProps) {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border"
    >
      <div className="container mx-auto px-4 h-20 flex items-center">
        {/* Logo - Enhanced - Large and Visible */}
        <a href="/" className="flex items-center gap-4 group flex-shrink-0">
          <div className="relative">
            <div className="absolute -inset-2 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ 
              background: 'linear-gradient(to bottom right, rgba(164, 19, 22, 0.15), hsl(var(--primary) / 0.1))'
            }} />
            <img 
              src="/logovipasi.png" 
              alt="Cliente VIP" 
              className="relative w-24 h-24 object-contain group-hover:scale-110 transition-transform duration-300"
              style={{ 
                filter: 'drop-shadow(0 6px 20px rgba(0, 0, 0, 0.25)) brightness(1.1) contrast(1.15)',
                imageRendering: 'crisp-edges'
              }}
            />
          </div>
          <div className="relative">
            <span className="font-display font-bold text-2xl text-foreground block leading-tight">
              Cliente <span className="bg-clip-text text-transparent font-extrabold" style={{
                backgroundImage: 'linear-gradient(to right, #a41316, #8b0f12, #a41316)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>VIP</span>
            </span>
            <p className="text-sm text-muted-foreground font-medium -mt-0.5 tracking-wide">
              Auto Shopping Itapoan
            </p>
          </div>
        </a>

        {/* Navigation - Centered */}
        {showNav && (
          <nav className="hidden md:flex items-center gap-8 mx-auto">
            <a href="#beneficios" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Benefícios
            </a>
            <a href="#ranking" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Ranking
            </a>
            <a href="#contato" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Contato
            </a>
          </nav>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="hidden md:block text-sm text-muted-foreground">
                Olá, {user?.nome}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout}
                className="hidden md:flex"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </>
          ) : (
            <Button 
              variant="ghost" 
              size="sm" 
              className="hidden md:flex"
              onClick={() => navigate('/login')}
            >
              Acessar
            </Button>
          )}
          <Button 
            variant="vip" 
            size="sm"
            onClick={() => navigate('/meu-cartao')}
          >
            Meu Cartão
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
