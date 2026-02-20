import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Loader2, MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RankingAvaliacoes {
  id: string;
  nome: string;
  loja_nome: string;
  total_avaliacoes: number;
  nota_media: number;
  avaliacoes_9_10: number;
  avaliacoes_7_8: number;
  avaliacoes_abaixo_7: number;
  posicao_ranking_loja: number;
  posicao_ranking_geral: number;
}

interface MinhaPosicao {
  vendedor: { id: string; nome: string; loja_id: string };
  ranking_avaliacoes: {
    total_avaliacoes: number;
    nota_media: number;
    posicao_ranking_loja: number;
    posicao_ranking_geral: number;
  } | null;
  periodo: string;
}

const VendedorAvaliacoes = () => {
  const { user } = useAuth();
  const [periodo, setPeriodo] = useState("todos");

  const { data: minhaPosicao, isLoading: loadingPosicao } = useQuery<MinhaPosicao>({
    queryKey: ["vendedor-minha-posicao-aval", periodo],
    queryFn: async () => {
      const response = await fetch(`/api/ranking-vendedores/minha-posicao?periodo=${periodo}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      if (!response.ok) throw new Error("Erro ao buscar posição");
      return response.json();
    },
  });

  const { data: rankingAvaliacoes = [], isLoading: loadingRanking } = useQuery<RankingAvaliacoes[]>({
    queryKey: ["ranking-avaliacoes", periodo],
    queryFn: async () => {
      const response = await fetch(`/api/ranking-vendedores/avaliacoes?periodo=${periodo}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      if (!response.ok) throw new Error("Erro ao buscar ranking");
      return response.json();
    },
  });

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
          <h1 className="text-3xl font-bold">Avaliações</h1>
          <p className="text-muted-foreground mt-2">
            Veja suas avaliações e compare com outros vendedores
          </p>
        </div>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="mes">Este Mês</SelectItem>
            <SelectItem value="trimestre">Trimestre</SelectItem>
            <SelectItem value="ano">Este Ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Resumo das Avaliações */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nota Média</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {minhaPosicao?.ranking_avaliacoes?.nota_media
                ? Number(minhaPosicao.ranking_avaliacoes.nota_media).toFixed(1)
                : "0.0"}
            </div>
            <p className="text-xs text-muted-foreground">de 10.0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Avaliações</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {minhaPosicao?.ranking_avaliacoes?.total_avaliacoes || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ranking na Loja</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {minhaPosicao?.ranking_avaliacoes?.posicao_ranking_loja
                ? `#${minhaPosicao.ranking_avaliacoes.posicao_ranking_loja}`
                : "-"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ranking Geral</CardTitle>
            <ThumbsDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {minhaPosicao?.ranking_avaliacoes?.posicao_ranking_geral
                ? `#${minhaPosicao.ranking_avaliacoes.posicao_ranking_geral}`
                : "-"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ranking de Avaliações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Ranking por Avaliações
          </CardTitle>
          <CardDescription>
            Vendedores com melhores avaliações dos clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rankingAvaliacoes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma avaliação registrada para este período.
            </p>
          ) : (
            <div className="space-y-3">
              {rankingAvaliacoes.map((vendedor) => {
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
                        #{vendedor.posicao_ranking_geral}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">
                          {vendedor.nome}
                          {isMe && (
                            <Badge className="ml-2 text-xs">
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
                      <div className="flex items-center gap-1 justify-end">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">
                          {Number(vendedor.nota_media).toFixed(1)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {vendedor.total_avaliacoes} avaliações
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

export default VendedorAvaliacoes;
