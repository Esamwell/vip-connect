import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, DollarSign, TrendingUp, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

interface MetasData {
  vendedor: {
    id: string;
    nome: string;
    meta_vendas: number;
    meta_vendas_valor: number;
  };
  desempenho: {
    vendas_realizadas: number;
    valor_total_vendas: number;
    meta_vendas_percentual: number;
    meta_valor_percentual: number;
  };
  periodo: string;
}

const VendedorMetas = () => {
  const { user } = useAuth();
  const [periodo, setPeriodo] = useState("mes");

  // Buscar vendedor ID primeiro
  const { data: perfil } = useQuery<{ id: string }>({
    queryKey: ["vendedor-perfil-id-metas"],
    queryFn: async () => {
      const response = await fetch("/api/vendedores/meu-perfil", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      if (!response.ok) throw new Error("Erro ao buscar perfil");
      return response.json();
    },
  });

  // Buscar metas
  const { data: metas, isLoading } = useQuery<MetasData>({
    queryKey: ["vendedor-metas", perfil?.id, periodo],
    queryFn: async () => {
      if (!perfil?.id) throw new Error("Perfil não encontrado");
      const response = await fetch(
        `/api/ranking-vendedores/metas/${perfil.id}?periodo=${periodo}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      );
      if (!response.ok) throw new Error("Erro ao buscar metas");
      return response.json();
    },
    enabled: !!perfil?.id,
  });

  const getPeriodoLabel = (p: string) => {
    switch (p) {
      case "hoje": return "Hoje";
      case "semana": return "Esta Semana";
      case "mes": return "Este Mês";
      case "trimestre": return "Este Trimestre";
      case "ano": return "Este Ano";
      default: return p;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const metaVendasPercentual = Math.min(metas?.desempenho?.meta_vendas_percentual || 0, 100);
  const metaValorPercentual = Math.min(metas?.desempenho?.meta_valor_percentual || 0, 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Metas</h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe o progresso das suas metas de vendas
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

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Realizadas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metas?.desempenho?.vendas_realizadas || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Meta: {metas?.vendedor?.meta_vendas || 0} vendas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Faturado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {Number(metas?.desempenho?.valor_total_vendas || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">
              Meta: R$ {Number(metas?.vendedor?.meta_vendas_valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">% Meta Vendas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metas?.desempenho?.meta_vendas_percentual || 0}%
            </div>
            <Progress value={metaVendasPercentual} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">% Meta Valor</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metas?.desempenho?.meta_valor_percentual || 0}%
            </div>
            <Progress value={metaValorPercentual} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Meta de Vendas Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Meta de Vendas - {getPeriodoLabel(periodo)}
          </CardTitle>
          <CardDescription>
            Progresso em relação à meta de quantidade de vendas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Vendas realizadas</span>
              <span className="font-medium">
                {metas?.desempenho?.vendas_realizadas || 0} / {metas?.vendedor?.meta_vendas || 0}
              </span>
            </div>
            <Progress value={metaVendasPercentual} className="h-4" />
            <p className="text-xs text-muted-foreground mt-2">
              {metaVendasPercentual >= 100
                ? "Parabéns! Você atingiu sua meta de vendas!"
                : `Faltam ${Math.max((metas?.vendedor?.meta_vendas || 0) - (metas?.desempenho?.vendas_realizadas || 0), 0)} vendas para atingir a meta.`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Meta de Faturamento Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Meta de Faturamento - {getPeriodoLabel(periodo)}
          </CardTitle>
          <CardDescription>
            Progresso em relação à meta de valor faturado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Valor faturado</span>
              <span className="font-medium">
                R$ {Number(metas?.desempenho?.valor_total_vendas || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                {" / "}
                R$ {Number(metas?.vendedor?.meta_vendas_valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <Progress value={metaValorPercentual} className="h-4" />
            <p className="text-xs text-muted-foreground mt-2">
              {metaValorPercentual >= 100
                ? "Parabéns! Você atingiu sua meta de faturamento!"
                : `Faltam R$ ${Math.max(
                    (metas?.vendedor?.meta_vendas_valor || 0) - Number(metas?.desempenho?.valor_total_vendas || 0),
                    0
                  ).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} para atingir a meta.`}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendedorMetas;
