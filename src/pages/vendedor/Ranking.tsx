import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Star, TrendingUp, Medal, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";

interface RankingVendedor {
  id: string;
  nome: string;
  loja_id: string;
  loja_nome: string;
  total_vendas: number;
  valor_total_vendas: number;
  nota_media_avaliacao?: number;
  total_avaliacoes?: number;
  posicao_ranking_loja: number;
  posicao_ranking_geral: number;
}

interface MinhaPosicao {
  vendedor: { id: string; nome: string; loja_id: string };
  ranking_vendas: {
    total_vendas: number;
    valor_total_vendas: number;
    posicao_ranking_loja: number;
    posicao_ranking_geral: number;
  } | null;
  ranking_avaliacoes: {
    total_avaliacoes: number;
    nota_media: number;
    posicao_ranking_loja: number;
    posicao_ranking_geral: number;
  } | null;
  periodo: string;
}

const VendedorRanking = () => {
  const { user } = useAuth();
  const [periodo, setPeriodo] = useState("mes");

  const { data: minhaPosicao, isLoading: loadingPosicao } = useQuery<MinhaPosicao>({
    queryKey: ["vendedor-minha-posicao", periodo],
    queryFn: async () => {
      return api.get<MinhaPosicao>(`/ranking-vendedores/minha-posicao?periodo=${periodo}`);
    },
  });

  const { data: rankingVendas = [], isLoading: loadingRanking } = useQuery<RankingVendedor[]>({
    queryKey: ["ranking-vendas", periodo],
    queryFn: async () => {
      return api.get<RankingVendedor[]>(`/ranking-vendedores/vendas?periodo=${periodo}`);
    },
  });

  const getMedalIcon = (posicao: number) => {
    if (posicao === 1) return "🥇";
    if (posicao === 2) return "🥈";
    if (posicao === 3) return "🥉";
    return `#${posicao}`;
  };

  const isLoading = loadingPosicao || loadingRanking;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ranking</h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe sua posição no ranking de vendedores
          </p>
        </div>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hoje">Hoje</SelectItem>
            <SelectItem value="semana">Esta Semana</SelectItem>
            <SelectItem value="mes">Este Mês</SelectItem>
            <SelectItem value="trimestre">Trimestre</SelectItem>
            <SelectItem value="ano">Este Ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Minha Posição */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ranking Loja (Vendas)</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {minhaPosicao?.ranking_vendas?.posicao_ranking_loja
                ? `#${minhaPosicao.ranking_vendas.posicao_ranking_loja}`
                : "-"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ranking Geral (Vendas)</CardTitle>
            <Medal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {minhaPosicao?.ranking_vendas?.posicao_ranking_geral
                ? `#${minhaPosicao.ranking_vendas.posicao_ranking_geral}`
                : "-"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {minhaPosicao?.ranking_vendas?.total_vendas || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              R$ {Number(minhaPosicao?.ranking_vendas?.valor_total_vendas || 0).toFixed(2)}
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
              {minhaPosicao?.ranking_avaliacoes?.nota_media
                ? Number(minhaPosicao.ranking_avaliacoes.nota_media).toFixed(1)
                : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              {minhaPosicao?.ranking_avaliacoes?.total_avaliacoes || 0} avaliações
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ranking Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Ranking de Vendedores
          </CardTitle>
          <CardDescription>
            Classificação por vendas no período selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rankingVendas.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum dado de ranking disponível para este período.
            </p>
          ) : (
            <div className="space-y-3">
              {rankingVendas.map((vendedor) => {
                const isMe = minhaPosicao?.vendedor?.id === vendedor.id;
                return (
                  <div
                    key={vendedor.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      isMe ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-2xl font-bold w-12 text-center">
                        {getMedalIcon(vendedor.posicao_ranking_geral)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">
                          {vendedor.nome}
                          {isMe && (
                            <Badge variant="default" className="ml-2 text-xs">
                              Você
                            </Badge>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {vendedor.loja_nome}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{vendedor.total_vendas} vendas</p>
                      <p className="text-sm text-muted-foreground">
                        R$ {Number(vendedor.valor_total_vendas).toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VendedorRanking;
