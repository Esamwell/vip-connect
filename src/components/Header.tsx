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
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center shadow-vip group-hover:scale-105 transition-transform bg-background">
            <img 
              src="/logovipasi.png" 
              alt="Cliente VIP" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <span className="font-display font-bold text-lg text-foreground">
              Cliente <span className="text-gradient-vip">VIP</span>
            </span>
            <p className="text-[10px] text-muted-foreground -mt-1">
              Auto Shopping Itapoan
            </p>
          </div>
        </a>

        {/* Navigation */}
        {showNav && (
          <nav className="hidden md:flex items-center gap-6">
            <a href="#beneficios" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Benefícios
            </a>
            <a href="#ranking" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Ranking
            </a>
            <a href="#contato" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
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
