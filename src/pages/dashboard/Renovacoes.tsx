import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/services/api';
import { Calendar, AlertCircle, CheckCircle } from 'lucide-react';
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

interface ClienteVencimento {
  id: string;
  nome: string;
  whatsapp: string;
  loja_nome: string;
  data_validade: string;
  dias_para_vencer: number;
}

interface ClienteRenovado {
  id: string;
  nome: string;
  whatsapp: string;
  loja_nome: string;
  data_renovacao: string;
  data_validade: string;
}

export default function Renovacoes() {
  const [vencendo, setVencendo] = useState<ClienteVencimento[]>([]);
  const [renovados, setRenovados] = useState<ClienteRenovado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRenovacoes();
  }, []);

  const loadRenovacoes = async () => {
    try {
      setLoading(true);
      const [vencendoData, renovadosData] = await Promise.all([
        api.get('/relatorios/clientes-vencimento-proximo').catch(() => ({ data: [] })),
        api.get('/relatorios/clientes-renovados').catch(() => ({ data: [] })),
      ]);

      setVencendo(vencendoData.data || []);
      setRenovados(renovadosData.data || []);
    } catch (error) {
      console.error('Erro ao carregar renovações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRenovar = async (clienteId: string) => {
    try {
      await api.post(`/renovacao/${clienteId}`);
      loadRenovacoes();
    } catch (error) {
      console.error('Erro ao renovar VIP:', error);
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
        <h1 className="text-3xl font-bold tracking-[-0.03em]">Renovações</h1>
        <p className="text-muted-foreground text-[15px] leading-relaxed">
          Gerencie renovações e clientes próximos do vencimento
        </p>
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
              {vencendo.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhum cliente próximo do vencimento
                  </TableCell>
                </TableRow>
              ) : (
                vencendo.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell className="font-medium">{cliente.nome}</TableCell>
                    <TableCell>{cliente.whatsapp}</TableCell>
                    <TableCell>{cliente.loja_nome}</TableCell>
                    <TableCell>
                      {format(new Date(cliente.data_validade), 'dd/MM/yyyy', {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          cliente.dias_para_vencer <= 7
                            ? 'destructive'
                            : cliente.dias_para_vencer <= 15
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {cliente.dias_para_vencer} dias
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
                <TableHead>Data Renovação</TableHead>
                <TableHead>Nova Validade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renovados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhuma renovação registrada
                  </TableCell>
                </TableRow>
              ) : (
                renovados.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell className="font-medium">{cliente.nome}</TableCell>
                    <TableCell>{cliente.whatsapp}</TableCell>
                    <TableCell>{cliente.loja_nome}</TableCell>
                    <TableCell>
                      {format(new Date(cliente.data_renovacao), 'dd/MM/yyyy', {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      {format(new Date(cliente.data_validade), 'dd/MM/yyyy', {
                        locale: ptBR,
                      })}
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

