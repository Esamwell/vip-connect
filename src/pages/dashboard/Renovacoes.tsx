import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/services/api';
import { Calendar, AlertCircle, CheckCircle, Car, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { useToast } from '@/hooks/use-toast';

// Função auxiliar para formatar datas de forma segura
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  
  try {
    // Tenta fazer parse da data
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    
    // Verifica se a data é válida
    if (!isValid(date)) {
      return '-';
    }
    
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data:', dateString, error);
    return '-';
  }
};

interface ClienteVencimento {
  id: string;
  nome: string;
  whatsapp: string;
  loja_nome: string;
  data_validade: string;
  dias_restantes: number | string; // Pode vir como número ou string do PostgreSQL
}

interface ClienteRenovado {
  renovacao_id: string;
  cliente_vip_id: string;
  cliente_nome: string;
  whatsapp: string;
  loja_nome: string;
  data_renovacao: string;
  nova_data_validade: string;
  motivo?: string;
}

export default function Renovacoes() {
  const [vencendo, setVencendo] = useState<ClienteVencimento[]>([]);
  const [renovados, setRenovados] = useState<ClienteRenovado[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadRenovacoes();
  }, []);

  const loadRenovacoes = async () => {
    try {
      setLoading(true);
      const [vencendoData, renovadosData] = await Promise.all([
        api.get<ClienteVencimento[]>('/relatorios/clientes-vencimento-proximo').catch((error: any) => {
          console.error('Erro ao buscar clientes próximos do vencimento:', error);
          const errorMessage = error?.response?.data?.error || error?.message || 'Erro desconhecido';
          toast({
            title: 'Erro ao carregar dados',
            description: `Não foi possível carregar clientes próximos do vencimento: ${errorMessage}`,
            variant: 'destructive',
          });
          return [];
        }),
        api.get<ClienteRenovado[]>('/relatorios/clientes-renovados').catch((error: any) => {
          console.error('Erro ao buscar clientes renovados:', error);
          // Não mostrar toast para renovados pois pode não ser crítico
          return [];
        }),
      ]);

      console.log('Dados carregados - Vencendo:', vencendoData);
      console.log('Dados carregados - Renovados:', renovadosData);

      setVencendo(Array.isArray(vencendoData) ? vencendoData : []);
      setRenovados(Array.isArray(renovadosData) ? renovadosData : []);
    } catch (error: any) {
      console.error('Erro ao carregar renovações:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: error?.message || 'Ocorreu um erro ao carregar as renovações',
        variant: 'destructive',
      });
      setVencendo([]);
      setRenovados([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRenovar = async (clienteId: string) => {
    try {
      await api.post(`/renovacao/${clienteId}`);
      toast({
        title: 'Sucesso!',
        description: 'Cliente VIP renovado com sucesso',
      });
      loadRenovacoes();
    } catch (error: any) {
      console.error('Erro ao renovar VIP:', error);
      toast({
        title: 'Erro ao renovar VIP',
        description: error.message || 'Ocorreu um erro ao renovar o cliente VIP',
        variant: 'destructive',
      });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-[-0.03em]">Renovações</h1>
          <p className="text-muted-foreground text-[15px] leading-relaxed">
            Gerencie renovações e clientes próximos do vencimento
          </p>
        </div>
        <Button
          onClick={loadRenovacoes}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            Clientes Próximos do Vencimento
          </CardTitle>
          <CardDescription>
            Clientes que vencem nos próximos 30 dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Dias Restantes</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Carregando...
                    </div>
                  </TableCell>
                </TableRow>
              ) : vencendo.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="w-8 h-8 text-muted-foreground/50" />
                      <p className="font-medium">Nenhum cliente próximo do vencimento</p>
                      <p className="text-sm">Não há clientes VIP que vençam nos próximos 30 dias</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                vencendo.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell className="font-medium">{cliente.nome}</TableCell>
                    <TableCell>{cliente.whatsapp}</TableCell>
                    <TableCell>{cliente.loja_nome}</TableCell>
                    <TableCell>
                      {formatDate(cliente.data_validade)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          Number(cliente.dias_restantes) <= 7
                            ? 'destructive'
                            : Number(cliente.dias_restantes) <= 15
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {Number(cliente.dias_restantes) >= 0 
                          ? `${cliente.dias_restantes} ${Number(cliente.dias_restantes) === 1 ? 'dia' : 'dias'}`
                          : 'Vencido'
                        }
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => handleRenovar(cliente.id)}
                      >
                        Renovar VIP
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Clientes Renovados
          </CardTitle>
          <CardDescription>
            Histórico de renovações realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Data Renovação</TableHead>
                <TableHead>Nova Validade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renovados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhuma renovação registrada
                  </TableCell>
                </TableRow>
              ) : (
                renovados.map((cliente) => (
                  <TableRow key={cliente.renovacao_id || cliente.cliente_vip_id}>
                    <TableCell className="font-medium">{cliente.cliente_nome}</TableCell>
                    <TableCell>{cliente.whatsapp}</TableCell>
                    <TableCell>{cliente.loja_nome}</TableCell>
                    <TableCell>
                      {cliente.motivo ? (
                        <span className="text-sm">{cliente.motivo}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatDate(cliente.data_renovacao)}
                    </TableCell>
                    <TableCell>
                      {formatDate(cliente.nova_data_validade)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

