import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Home,
  UserCircle,
  Gift,
  Trophy,
  Star,
  Settings,
  LogOut,
  TrendingUp,
  Award,
  Menu,
  X,
  Moon,
  Sun,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/hooks/use-theme";

interface VendedorDashboardLayoutProps {
  children: React.ReactNode;
}

interface MenuItemType {
  title: string;
  icon: React.ElementType;
  path: string;
}

const VendedorDashboardLayout = ({ children }: VendedorDashboardLayoutProps) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const menuItems: MenuItemType[] = [
    { title: "Início", path: "/vendedor/dashboard", icon: Home },
    { title: "Meus Vouchers", path: "/vendedor/dashboard/vouchers", icon: Gift },
    { title: "Ranking", path: "/vendedor/dashboard/ranking", icon: Trophy },
    { title: "Avaliações", path: "/vendedor/dashboard/avaliacoes", icon: Star },
    { title: "Premiações", path: "/vendedor/dashboard/premiacoes", icon: Award },
    { title: "Metas", path: "/vendedor/dashboard/metas", icon: TrendingUp },
    { title: "Meu Perfil", path: "/vendedor/dashboard/perfil", icon: UserCircle },
    { title: "Configurações", path: "/vendedor/dashboard/configuracoes", icon: Settings },
  ];

  const getInitials = (name?: string) => {
    if (!name) return "V";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
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
          "fixed inset-y-0 left-0 z-50 w-[260px] bg-card border-r border-border transition-transform duration-300 ease-in-out",
          "lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="flex items-center justify-between px-6 h-16 border-b border-border/50">
            <Link to="/vendedor/dashboard" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <h1 className="font-bold text-[15px] leading-tight tracking-tight">Clube Vip</h1>
                <p className="text-[11px] text-muted-foreground leading-tight font-medium uppercase tracking-wider">Vendedor</p>
              </div>
            </Link>
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
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 relative group",
                      "hover:bg-muted/60 hover:text-foreground",
                      isActive
                        ? "bg-primary/10 text-primary font-semibold shadow-xs"
                        : "text-muted-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5 shrink-0 transition-colors",
                        isActive && "text-primary"
                      )}
                    />
                    <span className="flex-1 text-sm font-medium tracking-tight">{item.title}</span>
                    {isActive && (
                      <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </Link>
                );
              })}
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
                      {getInitials(user?.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold truncate tracking-tight">{user?.nome}</p>
                    <p className="text-[11px] text-muted-foreground truncate font-medium uppercase tracking-wider">
                      Vendedor
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
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border/50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-xs px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Dashboard do Vendedor</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleTheme} title={theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"}>
            {theme === "light" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </Button>
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
};

export default VendedorDashboardLayout;
