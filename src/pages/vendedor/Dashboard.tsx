import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Star, 
  Gift, 
  Award,
  Target,
  Calendar,
  DollarSign,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

interface VendedorStats {
  total_vendas: number;
  valor_total_vendas: number;
  total_avaliacoes: number;
  nota_media: number;
  posicao_ranking_loja: number;
  posicao_ranking_geral: number;
  vouchers_disponiveis: number;
  vouchers_resgatados: number;
  premiacoes_recebidas: number;
  meta_vendas_percentual: number;
  meta_valor_percentual: number;
}

const VendedorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Buscar estatísticas do vendedor
  const { data: stats, isLoading, error, refetch } = useQuery<VendedorStats>({
    queryKey: ["vendedor-stats"],
    queryFn: async () => {
      const response = await fetch("/api/vendedores/minhas-estatisticas", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      
      if (!response.ok) {
        throw new Error("Erro ao buscar estatísticas");
      }
      
      return response.json();
    },
    retry: 2,
    staleTime: 30000,
  });

  // Valores padrão quando API falha
  const defaultStats: VendedorStats = {
    total_vendas: 0,
    valor_total_vendas: 0,
    total_avaliacoes: 0,
    nota_media: 0,
    posicao_ranking_loja: 0,
    posicao_ranking_geral: 0,
    vouchers_disponiveis: 0,
    vouchers_resgatados: 0,
    premiacoes_recebidas: 0,
    meta_vendas_percentual: 0,
    meta_valor_percentual: 0,
  };

  const displayStats = stats || defaultStats;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-32 bg-muted rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-destructive/50 bg-destructive/10">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">Não foi possível carregar os dados atualizados</p>
            <p className="text-xs text-muted-foreground">Exibindo valores padrão. Verifique sua conexão.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard Vendedor</h1>
        <p className="text-muted-foreground mt-2">
          Bem-vindo, {user?.nome}! Aqui está seu resumo de desempenho.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayStats.total_vendas}</div>
            <p className="text-xs text-muted-foreground">
              R$ {displayStats.valor_total_vendas?.toFixed(2) || "0,00"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {displayStats.nota_media?.toFixed(1) || "0,0"}
            </div>
            <p className="text-xs text-muted-foreground">
              {displayStats.total_avaliacoes} avaliações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ranking Loja</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#{displayStats.posicao_ranking_loja || "-"}</div>
            <p className="text-xs text-muted-foreground">
              Geral: #{displayStats.posicao_ranking_geral || "-"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vouchers</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayStats.vouchers_resgatados}</div>
            <p className="text-xs text-muted-foreground">
              {displayStats.vouchers_disponiveis} disponíveis
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meta de Vendas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Meta de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progresso</span>
                <span>{displayStats.meta_vendas_percentual}%</span>
              </div>
              <Progress value={displayStats.meta_vendas_percentual} className="h-2" />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Vendas realizadas: {displayStats.total_vendas}</span>
              <span>Meta: 100</span>
            </div>
          </CardContent>
        </Card>

        {/* Meta de Valor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Meta de Faturamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progresso</span>
                <span>{displayStats.meta_valor_percentual}%</span>
              </div>
              <Progress value={displayStats.meta_valor_percentual} className="h-2" />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Faturado: R$ {displayStats.valor_total_vendas?.toFixed(2) || "0,00"}</span>
              <span>Meta: R$ 50.000,00</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-20 flex-col gap-2" variant="outline" onClick={() => navigate("/vendedor/dashboard/vouchers")}>
              <Gift className="h-6 w-6" />
              <span>Ver Vouchers</span>
            </Button>
            <Button className="h-20 flex-col gap-2" variant="outline" onClick={() => navigate("/vendedor/dashboard/ranking")}>
              <TrendingUp className="h-6 w-6" />
              <span>Ver Ranking</span>
            </Button>
            <Button className="h-20 flex-col gap-2" variant="outline" onClick={() => navigate("/vendedor/dashboard/premiacoes")}>
              <Award className="h-6 w-6" />
              <span>Minhas Premiações</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Vendas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">Cliente {i}</p>
                    <p className="text-sm text-muted-foreground">Plano VIP</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">R$ 1.200,00</p>
                    <p className="text-sm text-muted-foreground">Há {i} dias</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Avaliações Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 border rounded">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Cliente {i}</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= (5 - i + 1) ? "text-yellow-400 fill-current" : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    "Excelente atendimento, muito profissional!"
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VendedorDashboard;
