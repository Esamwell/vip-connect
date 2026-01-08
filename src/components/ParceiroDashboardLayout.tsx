import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  Gift,
  Settings,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { api } from '@/services/api';
import { useTheme } from '@/hooks/use-theme';

interface ParceiroDashboardLayoutProps {
  children: React.ReactNode;
}

interface MenuItemType {
  title: string;
  icon: React.ElementType;
  path: string;
}

interface Parceiro {
  id: string;
  nome: string;
  tipo: string;
  email?: string;
  telefone?: string;
}

export function ParceiroDashboardLayout({ children }: ParceiroDashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [parceiro, setParceiro] = useState<Parceiro | null>(null);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    // Buscar dados do parceiro do banco
    const loadParceiro = async () => {
      try {
        const data = await api.get<Parceiro>('/parceiros/me').catch(() => null);
        if (data) {
          setParceiro(data);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do parceiro:', error);
      }
    };

    if (user?.role === 'parceiro') {
      loadParceiro();
    }
  }, [user]);

  const menuItems: MenuItemType[] = [
    {
      title: 'Clientes',
      icon: Users,
      path: '/parceiro/dashboard/clientes',
    },
    {
      title: 'Benefícios',
      icon: Gift,
      path: '/parceiro/dashboard/beneficios',
    },
    {
      title: 'Configurações',
      icon: Settings,
      path: '/parceiro/dashboard/configuracoes',
    },
  ];

  const getInitials = (name?: string) => {
    if (!name) return 'P';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Usar nome do parceiro do banco ou fallback
  const parceiroNome = parceiro?.nome || user?.name || 'Parceiro';
  const parceiroIniciais = getInitials(parceiroNome);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-64 bg-card border-r border-border transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-border px-6">
            <Link to="/parceiro/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-primary">
                <img 
                  src="/logovipasi.png" 
                  alt="Clube Vip Beneficios" 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-display font-bold text-lg">Parceiro VIP</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Menu */}
          <ScrollArea className="flex-1 py-4">
            <nav className="space-y-1 px-3">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.title}
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          {/* User Section */}
          <div className="border-t border-border p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-auto p-2"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {parceiroIniciais}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium">{parceiroNome}</span>
                    <span className="text-xs text-muted-foreground">Parceiro</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Dashboard do Parceiro</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleTheme} title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}>
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </Button>
        </header>

        {/* Content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}


