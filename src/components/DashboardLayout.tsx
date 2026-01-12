import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Store,
  Handshake,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Gift,
  MessageSquare,
  TrendingUp,
  Calendar,
  Shield,
  Bell,
  Search,
  Moon,
  Sun,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useTheme } from '@/hooks/use-theme';
import { notificacoesService, Notificacao } from '@/services/notificacoes.service';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface MenuItemType {
  title: string;
  icon: React.ElementType;
  path: string;
  roles: string[];
  section?: string;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loadingNotificacoes, setLoadingNotificacoes] = useState(false);
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Close sidebar on mobile when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Carregar notificações
  useEffect(() => {
    loadNotificacoes();
    // Recarregar notificações a cada 30 segundos
    const interval = setInterval(loadNotificacoes, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotificacoes = async () => {
    try {
      setLoadingNotificacoes(true);
      const data = await notificacoesService.listar();
      setNotificacoes(data);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoadingNotificacoes(false);
    }
  };

  const handleNotificacaoClick = async (notificacao: Notificacao) => {
    // Marcar como lida
    try {
      await notificacoesService.marcarComoLida(notificacao.id);
      // Remover da lista ou atualizar estado
      setNotificacoes(prev => prev.filter(n => n.id !== notificacao.id));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }

    // Navegar baseado no tipo
    if (notificacao.tipo === 'chamado_aberto' || notificacao.tipo === 'chamado_resolvido') {
      navigate('/dashboard/chamados');
    } else if (notificacao.tipo === 'vencimento_proximo') {
      navigate('/dashboard/clientes');
    }
  };

  // Notificações não lidas são aquelas criadas recentemente (últimas 7 dias) e não enviadas
  const notificacoesNaoLidas = notificacoes.filter(n => {
    const dataCriacao = new Date(n.created_at);
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
    return dataCriacao >= seteDiasAtras && !n.enviada;
  }).length;

  const getMenuItems = (): MenuItemType[] => {
    const role = user?.role;

    const baseItems: MenuItemType[] = [
      {
        title: 'Dashboard',
        icon: LayoutDashboard,
        path: '/dashboard',
        roles: ['admin_mt', 'admin_shopping', 'lojista'],
        section: 'principal',
      },
    ];

    if (role === 'admin_mt') {
      return [
        ...baseItems,
        {
          title: 'Clientes VIP',
          icon: Users,
          path: '/dashboard/clientes',
          roles: ['admin_mt'],
          section: 'gestao',
        },
        {
          title: 'Lojas',
          icon: Store,
          path: '/dashboard/lojas',
          roles: ['admin_mt'],
          section: 'gestao',
        },
        {
          title: 'Parceiros',
          icon: Handshake,
          path: '/dashboard/parceiros',
          roles: ['admin_mt'],
          section: 'gestao',
        },
        {
          title: 'Benefícios',
          icon: Gift,
          path: '/dashboard/beneficios',
          roles: ['admin_mt'],
          section: 'gestao',
        },
        {
          title: 'Chamados',
          icon: MessageSquare,
          path: '/dashboard/chamados',
          roles: ['admin_mt', 'admin_shopping', 'lojista'],
          section: 'atendimento',
        },
        {
          title: 'Ranking',
          icon: TrendingUp,
          path: '/dashboard/ranking',
          roles: ['admin_mt', 'admin_shopping', 'lojista'],
          section: 'analise',
        },
        {
          title: 'Relatórios',
          icon: BarChart3,
          path: '/dashboard/relatorios',
          roles: ['admin_mt', 'admin_shopping', 'lojista'],
          section: 'analise',
        },
        {
          title: 'Renovações',
          icon: Calendar,
          path: '/dashboard/renovacoes',
          roles: ['admin_mt', 'admin_shopping', 'lojista'],
          section: 'atendimento',
        },
        {
          title: 'Configurações',
          icon: Settings,
          path: '/dashboard/configuracoes',
          roles: ['admin_mt'],
          section: 'sistema',
        },
      ];
    }

    if (role === 'admin_shopping') {
      return [
        ...baseItems,
        {
          title: 'Clientes VIP',
          icon: Users,
          path: '/dashboard/clientes',
          roles: ['admin_shopping'],
          section: 'gestao',
        },
        {
          title: 'Lojas',
          icon: Store,
          path: '/dashboard/lojas',
          roles: ['admin_shopping'],
          section: 'gestao',
        },
        {
          title: 'Chamados',
          icon: MessageSquare,
          path: '/dashboard/chamados',
          roles: ['admin_shopping'],
          section: 'atendimento',
        },
        {
          title: 'Ranking',
          icon: TrendingUp,
          path: '/dashboard/ranking',
          roles: ['admin_shopping'],
          section: 'analise',
        },
        {
          title: 'Relatórios',
          icon: BarChart3,
          path: '/dashboard/relatorios',
          roles: ['admin_shopping'],
          section: 'analise',
        },
        {
          title: 'Renovações',
          icon: Calendar,
          path: '/dashboard/renovacoes',
          roles: ['admin_shopping'],
          section: 'atendimento',
        },
      ];
    }

    if (role === 'lojista') {
      return [
        ...baseItems,
        {
          title: 'Meus Clientes',
          icon: Users,
          path: '/dashboard/clientes',
          roles: ['lojista'],
          section: 'gestao',
        },
        {
          title: 'Benefícios',
          icon: Gift,
          path: '/dashboard/beneficios',
          roles: ['lojista'],
          section: 'gestao',
        },
        {
          title: 'Chamados',
          icon: MessageSquare,
          path: '/dashboard/chamados',
          roles: ['lojista'],
          section: 'atendimento',
        },
        {
          title: 'Ranking',
          icon: TrendingUp,
          path: '/dashboard/ranking',
          roles: ['lojista'],
          section: 'analise',
        },
        {
          title: 'Relatórios',
          icon: BarChart3,
          path: '/dashboard/relatorios',
          roles: ['lojista'],
          section: 'analise',
        },
        {
          title: 'Renovações',
          icon: Calendar,
          path: '/dashboard/renovacoes',
          roles: ['lojista'],
          section: 'atendimento',
        },
      ];
    }

    return baseItems;
  };

  const menuItems = getMenuItems();

  // Group menu items by section
  const groupedMenuItems = menuItems.reduce((acc, item) => {
    const section = item.section || 'outros';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(item);
    return acc;
  }, {} as Record<string, MenuItemType[]>);

  const sectionLabels: Record<string, string> = {
    principal: 'Principal',
    gestao: 'Gestão',
    atendimento: 'Atendimento',
    analise: 'Análise',
    sistema: 'Sistema',
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin_mt':
        return 'Admin MT';
      case 'admin_shopping':
        return 'Admin Shopping';
      case 'lojista':
        return 'Lojista';
      case 'parceiro':
        return 'Parceiro';
      case 'cliente_vip':
        return 'Cliente VIP';
      default:
        return 'Usuário';
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Backdrop Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[260px] bg-card border-r border-border transition-transform duration-300 ease-in-out',
          'lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="flex items-center justify-between px-6 h-16 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <h1 className="font-bold text-[15px] leading-tight tracking-tight">Clube Vip Beneficios</h1>
                <p className="text-[11px] text-muted-foreground leading-tight font-medium uppercase tracking-wider">Auto Shopping Itapoan</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Menu */}
          <ScrollArea className="flex-1">
            <nav className="px-4 py-6 space-y-6">
              {Object.entries(groupedMenuItems).map(([section, items]) => (
                <div key={section}>
                  {sectionLabels[section] && (
                    <div className="px-3 mb-3 mt-4 first:mt-0">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                        {sectionLabels[section]}
                      </p>
                    </div>
                  )}
                  <div className="space-y-1">
                    {items.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative group',
                        'hover:bg-muted/60 hover:text-foreground',
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold shadow-xs'
                          : 'text-muted-foreground'
                      )}
                        >
                          <Icon
                            className={cn(
                              'w-5 h-5 shrink-0 transition-colors',
                              isActive && 'text-primary'
                            )}
                          />
                          <span className="flex-1 text-sm font-medium tracking-tight">{item.title}</span>
                          {isActive && (
                            <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </ScrollArea>

          {/* User Footer */}
          <div className="border-t border-border/50 p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 h-auto p-3 hover:bg-accent"
                >
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {user?.nome?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold truncate tracking-tight">{user?.nome}</p>
                    <p className="text-[11px] text-muted-foreground truncate font-medium uppercase tracking-wider">
                      {getRoleLabel(user?.role)}
                    </p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 h-16 border-b border-border/50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-xs">
          <div className="flex h-full items-center justify-between px-4 lg:px-6 xl:px-8 gap-4 w-full">
            <div className="flex items-center gap-4 flex-1">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu open={notificacoesAbertas} onOpenChange={setNotificacoesAbertas}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {notificacoesNaoLidas > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notificações</span>
                    {notificacoesNaoLidas > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {notificacoesNaoLidas} nova{notificacoesNaoLidas > 1 ? 's' : ''}
                      </span>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <ScrollArea className="h-[300px]">
                    {loadingNotificacoes ? (
                      <div className="flex items-center justify-center p-4">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : notificacoes.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-8 text-center">
                        <Bell className="w-12 h-12 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Nenhuma notificação
                        </p>
                      </div>
                    ) : (
                      <div className="py-1">
                        {notificacoes.map((notificacao) => (
                          <DropdownMenuItem
                            key={notificacao.id}
                            className="flex flex-col items-start p-3 cursor-pointer hover:bg-accent"
                            onClick={() => handleNotificacaoClick(notificacao)}
                          >
                            <div className="flex items-start justify-between w-full gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium line-clamp-1">
                                  {notificacao.titulo}
                                </p>
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                  {notificacao.mensagem}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Clock className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(notificacao.created_at), {
                                      addSuffix: true,
                                      locale: ptBR,
                                    })}
                                  </span>
                                </div>
                              </div>
                              {!notificacao.enviada && (
                                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                              )}
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  {notificacoes.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-center justify-center text-sm text-muted-foreground"
                        onClick={() => navigate('/dashboard')}
                      >
                        Ver todas
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" onClick={toggleTheme} title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}>
                {theme === 'light' ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 h-auto py-1.5">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {user?.nome?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col items-start">
                      <span className="text-sm font-medium">{user?.nome}</span>
                      <span className="text-xs text-muted-foreground">
                        {getRoleLabel(user?.role)}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6 xl:px-8 xl:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
