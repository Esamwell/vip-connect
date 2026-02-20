import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Bell, Shield, Palette, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const VendedorConfiguracoes = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie suas preferências e configurações da conta
        </p>
      </div>

      {/* Aparência */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Aparência
          </CardTitle>
          <CardDescription>
            Personalize a aparência do painel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dark-mode">Modo Escuro</Label>
              <p className="text-sm text-muted-foreground">
                Ativar o tema escuro para reduzir o cansaço visual
              </p>
            </div>
            <Switch
              id="dark-mode"
              checked={theme === "dark"}
              onCheckedChange={toggleTheme}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notificações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações
          </CardTitle>
          <CardDescription>
            Configure como deseja receber notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notif-vendas">Novas Vendas</Label>
              <p className="text-sm text-muted-foreground">
                Receber notificação quando uma venda for registrada
              </p>
            </div>
            <Switch id="notif-vendas" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notif-avaliacoes">Avaliações</Label>
              <p className="text-sm text-muted-foreground">
                Receber notificação quando receber uma avaliação
              </p>
            </div>
            <Switch id="notif-avaliacoes" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notif-premiacoes">Premiações</Label>
              <p className="text-sm text-muted-foreground">
                Receber notificação sobre novas premiações
              </p>
            </div>
            <Switch id="notif-premiacoes" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notif-vouchers">Vouchers</Label>
              <p className="text-sm text-muted-foreground">
                Receber notificação sobre novos vouchers disponíveis
              </p>
            </div>
            <Switch id="notif-vouchers" defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Segurança */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Segurança
          </CardTitle>
          <CardDescription>
            Configurações de segurança da sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Alterar Senha</p>
              <p className="text-sm text-muted-foreground">
                Atualize sua senha de acesso
              </p>
            </div>
            <Button variant="outline" asChild>
              <a href="/vendedor/dashboard/perfil">Ir para Perfil</a>
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sessão Atual</p>
              <p className="text-sm text-muted-foreground">
                Logado como: {user?.email}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Informações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Versão</span>
            <span>1.0.0</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Plataforma</span>
            <span>Clube VIP - Painel do Vendedor</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendedorConfiguracoes;
