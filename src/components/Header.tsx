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
      <div className="container mx-auto px-4 h-20 flex items-center relative">
        {/* Logo - Enhanced - Large and Visible */}
        <a href="/" className="flex items-center group flex-shrink-0 z-10">
          <img 
            src="/logovipasi.png" 
            alt="Cliente VIP" 
            className="w-40 h-40 md:w-48 md:h-48 object-contain group-hover:scale-110 transition-transform duration-300"
            style={{ 
              filter: 'drop-shadow(0 6px 20px rgba(0, 0, 0, 0.25)) brightness(1.1) contrast(1.15)',
              imageRendering: 'crisp-edges'
            }}
          />
        </a>

        {/* Navigation - Centered */}
        {showNav && (
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2 z-10">
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

        {/* Actions - Right Side */}
        <div className="flex items-center gap-3 ml-auto z-10">
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
