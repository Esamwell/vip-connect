import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { api } from '@/services/api';
import { ClienteVIPModal } from '@/components/modals/ClienteVIPModal';

interface ClienteParceiro {
  id: string;
  nome: string;
  email?: string;
  telefone: string;
  whatsapp?: string;
  loja_nome?: string;
  status: 'ativo' | 'vencido' | 'renovado' | 'cancelado';
  data_ativacao: string;
  data_validade: string;
  qr_code_digital: string;
  qr_code_fisico?: string;
}

export default function ParceiroClientes() {
  const [clientes, setClientes] = useState<ClienteParceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [clienteModalOpen, setClienteModalOpen] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<string | null>(null);

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      setLoading(true);
      const data = await api.get<ClienteParceiro[]>('/parceiros/meus-clientes').catch(() => []);
      setClientes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredClientes = clientes.filter((cliente) =>
    cliente.nome.toLowerCase().includes(search.toLowerCase()) ||
    cliente.telefone?.includes(search) ||
    cliente.whatsapp?.includes(search) ||
    cliente.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      ativo: 'default',
      renovado: 'default',
      vencido: 'destructive',
      cancelado: 'outline',
    };
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
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
        <h1 className="text-3xl font-bold tracking-[-0.03em]">Meus Clientes</h1>
        <p className="text-muted-foreground text-[15px] leading-relaxed">
          Clientes VIP que utilizam seus benefícios oficiais
        </p>
      </div>

      <ClienteVIPModal
        open={clienteModalOpen}
        onOpenChange={setClienteModalOpen}
        clienteId={clienteSelecionado}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, telefone ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {clientes.length === 0
                      ? 'Nenhum cliente encontrado ainda'
                      : 'Nenhum cliente encontrado com os filtros aplicados'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredClientes.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell className="font-medium">{cliente.nome}</TableCell>
                    <TableCell>
                      {cliente.whatsapp || cliente.telefone || 'N/A'}
                    </TableCell>
                    <TableCell>{cliente.loja_nome || 'N/A'}</TableCell>
                    <TableCell>{getStatusBadge(cliente.status)}</TableCell>
                    <TableCell>
                      {format(new Date(cliente.data_validade), 'dd/MM/yyyy', {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setClienteSelecionado(cliente.id);
                          setClienteModalOpen(true);
                        }}
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

