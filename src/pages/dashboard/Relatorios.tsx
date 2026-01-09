import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/services/api';
import { BarChart3, TrendingUp, Users, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

interface RelatorioClientesMes {
  id: string;
  cliente_nome: string;
  mes: string;
  data_ativacao: string;
  loja_nome?: string;
  status: string;
}

interface RelatorioUsoBeneficios {
  cliente_nome: string;
  beneficio_nome: string;
  parceiro_nome: string;
  data_uso: string;
  tipo_uso: 'resgatado' | 'validado';
}

export default function Relatorios() {
  const [clientesMes, setClientesMes] = useState<RelatorioClientesMes[]>([]);
  const [usoBeneficios, setUsoBeneficios] = useState<RelatorioUsoBeneficios[]>([]);
  const [loading, setLoading] = useState(true);
  const [mesSelecionado, setMesSelecionado] = useState<string>('all');

  useEffect(() => {
    loadRelatorios();
  }, [mesSelecionado]);

  const loadRelatorios = async () => {
    try {
      setLoading(true);
      const mesQuery = mesSelecionado && mesSelecionado !== 'all' ? `?mes=${mesSelecionado}` : '';
      const [clientes, beneficios] = await Promise.all([
        api.get(`/relatorios/clientes-vip-mes${mesQuery}`).catch(() => []),
        api.get(`/relatorios/uso-beneficios${mesQuery}`).catch(() => []),
      ]);

      setClientesMes(Array.isArray(clientes) ? clientes : []);
      setUsoBeneficios(Array.isArray(beneficios) ? beneficios : []);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-[-0.03em]">Relatórios</h1>
        <p className="text-muted-foreground text-[15px] leading-relaxed">
          Visualize relatórios e estatísticas do sistema
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por mês" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os meses</SelectItem>
            <SelectItem value="1">Janeiro</SelectItem>
            <SelectItem value="2">Fevereiro</SelectItem>
            <SelectItem value="3">Março</SelectItem>
            <SelectItem value="4">Abril</SelectItem>
            <SelectItem value="5">Maio</SelectItem>
            <SelectItem value="6">Junho</SelectItem>
            <SelectItem value="7">Julho</SelectItem>
            <SelectItem value="8">Agosto</SelectItem>
            <SelectItem value="9">Setembro</SelectItem>
            <SelectItem value="10">Outubro</SelectItem>
            <SelectItem value="11">Novembro</SelectItem>
            <SelectItem value="12">Dezembro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Clientes VIP por Mês
            </CardTitle>
            <CardDescription>
              Total de clientes VIP cadastrados por mês
            </CardDescription>
          </CardHeader>
          <CardContent>
            {clientesMes.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum dado disponível
              </p>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {clientesMes.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted border border-border/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.cliente_nome}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {item.loja_nome && (
                          <>
                            <p className="text-xs text-muted-foreground truncate">
                              {item.loja_nome}
                            </p>
                            <span className="text-xs text-muted-foreground">•</span>
                          </>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(item.data_ativacao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Uso de Benefícios
            </CardTitle>
            <CardDescription>
              Validações de benefícios por parceiro
            </CardDescription>
          </CardHeader>
          <CardContent>
            {usoBeneficios.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum dado disponível
              </p>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {usoBeneficios.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between p-3 rounded-lg bg-muted border border-border/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.cliente_nome}</p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {item.beneficio_nome}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {item.parceiro_nome && (
                          <>
                            <p className="text-xs text-muted-foreground truncate">
                              {item.parceiro_nome}
                            </p>
                            <span className="text-xs text-muted-foreground">•</span>
                          </>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          item.tipo_uso === 'resgatado' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {item.tipo_uso === 'resgatado' ? 'Resgatado' : 'Validado'}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(item.data_uso), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

