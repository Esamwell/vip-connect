import { useEffect, useState } from 'react';
import { chamadosService } from '@/services/chamados.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { useNavigate } from 'react-router-dom';
import { Chamado } from '@/services/chamados.service';

export default function Chamados() {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadChamados();
  }, [statusFilter]);

  const loadChamados = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      const data = await chamadosService.list(filters);
      setChamados(data);
    } catch (error) {
      console.error('Erro ao carregar chamados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      aberto: 'destructive',
      em_andamento: 'default',
      resolvido: 'secondary',
      cancelado: 'outline',
    };
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status === 'em_andamento' ? 'Em Andamento' : 
         status === 'aberto' ? 'Aberto' :
         status === 'resolvido' ? 'Resolvido' : 'Cancelado'}
      </Badge>
    );
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      documentacao: 'Documentação',
      ajuste_pos_venda: 'Ajuste Pós-Venda',
      problema_loja: 'Problema com Loja',
      duvidas_gerais: 'Dúvidas Gerais',
    };
    return labels[tipo] || tipo;
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
          <h1 className="text-3xl font-bold tracking-[-0.03em]">Chamados</h1>
          <p className="text-muted-foreground text-[15px] leading-relaxed">
            Gerencie todos os chamados de atendimento prioritário
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="aberto">Abertos</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="resolvido">Resolvidos</SelectItem>
                <SelectItem value="cancelado">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chamados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhum chamado encontrado
                  </TableCell>
                </TableRow>
              ) : (
                chamados.map((chamado) => (
                  <TableRow key={chamado.id}>
                    <TableCell className="font-medium">{chamado.titulo}</TableCell>
                    <TableCell>{(chamado as any).cliente_nome || 'N/A'}</TableCell>
                    <TableCell>{(chamado as any).loja_nome || 'N/A'}</TableCell>
                    <TableCell>{getTipoLabel(chamado.tipo)}</TableCell>
                    <TableCell>{getStatusBadge(chamado.status)}</TableCell>
                    <TableCell>
                      {format(new Date(chamado.created_at), 'dd/MM/yyyy HH:mm', {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/dashboard/chamados/${chamado.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver
                      </Button>
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

