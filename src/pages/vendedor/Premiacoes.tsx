import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Gift, Calendar, Loader2, Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";

interface Premiacao {
  id: string;
  vendedor_id: string;
  premiacoes_ranking_id: string;
  periodo_referencia: string;
  posicao_ranking: number;
  status: string;
  data_premiacao: string;
  observacoes: string | null;
  premio_nome: string;
  premio_descricao: string;
  premio_tipo: string;
  premio_descricao_premio: string;
  premio_valor: number;
}

interface PremiacaoDisponivel {
  id: string;
  nome: string;
  descricao: string;
  tipo: string;
  posicao_minima: number;
  posicao_maxima: number;
  premio: string;
  valor_premio: number;
  ativo: boolean;
  total_premiacoes_recebidas: number;
}

const VendedorPremiacoes = () => {
  const { user } = useAuth();

  // Buscar vendedor ID primeiro
  const { data: perfil } = useQuery<{ id: string }>({
    queryKey: ["vendedor-perfil-id"],
    queryFn: async () => {
      return api.get<{ id: string }>('/vendedores/meu-perfil');
    },
  });

  // Buscar premiações recebidas
  const { data: premiacoes = [], isLoading: loadingPremiacoes } = useQuery<Premiacao[]>({
    queryKey: ["vendedor-premiacoes", perfil?.id],
    queryFn: async () => {
      if (!perfil?.id) return [];
      return api.get<Premiacao[]>(`/premiacoes/vendedor/${perfil.id}`);
    },
    enabled: !!perfil?.id,
  });

  // Buscar premiações disponíveis
  const { data: premiacoesDisponiveis = [], isLoading: loadingDisponiveis } = useQuery<PremiacaoDisponivel[]>({
    queryKey: ["premiacoes-disponiveis"],
    queryFn: async () => {
      return api.get<PremiacaoDisponivel[]>('/premiacoes');
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "recebido":
        return <Badge className="bg-green-100 text-green-800">Recebido</Badge>;
      case "pendente":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case "cancelado":
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isLoading = loadingPremiacoes || loadingDisponiveis;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Premiações</h1>
        <p className="text-muted-foreground mt-2">
          Veja suas premiações recebidas e as premiações disponíveis
        </p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recebidas</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {premiacoes.filter((p) => p.status === "recebido").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {premiacoes.filter((p) => p.status === "pendente").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premiações Disponíveis</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{premiacoesDisponiveis.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Premiações Recebidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Minhas Premiações
          </CardTitle>
          <CardDescription>Premiações que você recebeu por seu desempenho</CardDescription>
        </CardHeader>
        <CardContent>
          {premiacoes.length === 0 ? (
            <div className="text-center py-8">
              <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Nenhuma premiação recebida</h3>
              <p className="text-muted-foreground mt-2">
                Continue vendendo e melhorando suas avaliações para conquistar premiações!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {premiacoes.map((premiacao) => (
                <div
                  key={premiacao.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Award className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{premiacao.premio_nome}</h3>
                      <p className="text-sm text-muted-foreground">
                        {premiacao.premio_descricao}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Período: {new Date(premiacao.periodo_referencia).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          | Posição: #{premiacao.posicao_ranking}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    {getStatusBadge(premiacao.status)}
                    {premiacao.premio_valor > 0 && (
                      <p className="text-sm font-medium">
                        R$ {Number(premiacao.premio_valor).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Premiações Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Premiações Disponíveis
          </CardTitle>
          <CardDescription>
            Premiações que você pode conquistar com seu desempenho
          </CardDescription>
        </CardHeader>
        <CardContent>
          {premiacoesDisponiveis.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma premiação configurada no momento.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {premiacoesDisponiveis.map((premiacao) => (
                <div
                  key={premiacao.id}
                  className="p-4 rounded-lg border space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold">{premiacao.nome}</h3>
                    <Badge variant="outline" className="capitalize">
                      {premiacao.tipo}
                    </Badge>
                  </div>
                  {premiacao.descricao && (
                    <p className="text-sm text-muted-foreground">{premiacao.descricao}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      Posições: {premiacao.posicao_minima}° a {premiacao.posicao_maxima}°
                    </span>
                    {premiacao.valor_premio > 0 && (
                      <span className="font-medium text-primary">
                        R$ {Number(premiacao.valor_premio).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">Prêmio:</span> {premiacao.premio}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VendedorPremiacoes;
