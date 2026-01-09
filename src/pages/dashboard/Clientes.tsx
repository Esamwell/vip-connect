import { useEffect, useState } from 'react';
import { clientesService, ClienteVip } from '@/services/clientes.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { Search, Plus, Eye, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { useNavigate } from 'react-router-dom';
import { NovoClienteModal } from '@/components/modals/NovoClienteModal';
import { ClienteVIPModal } from '@/components/modals/ClienteVIPModal';

export default function Clientes() {
  const [clientes, setClientes] = useState<ClienteVip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [clienteModalOpen, setClienteModalOpen] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadClientes();
  }, []);

  const loadClientes = async () => {
    try {
      setLoading(true);
      const data = await clientesService.list();
      setClientes(data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNovoClienteSuccess = () => {
    loadClientes();
  };

  const filteredClientes = clientes.filter((cliente) =>
    cliente.nome.toLowerCase().includes(search.toLowerCase()) ||
    cliente.whatsapp.includes(search) ||
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

  // Função para formatar telefone: remove caracteres não numéricos e adiciona 55 se necessário
  const formatarTelefone = (whatsapp: string): string => {
    // Remove todos os caracteres não numéricos
    let numero = whatsapp.replace(/\D/g, '');
    
    // Se não começar com 55, adiciona
    if (!numero.startsWith('55')) {
      numero = '55' + numero;
    }
    
    return numero;
  };

  // Função para exportar contatos em CSV
  const handleExportarContatos = () => {
    try {
      setExporting(true);

      // Usar todos os clientes carregados (não apenas os filtrados)
      const clientesParaExportar = clientes.length > 0 ? clientes : [];

      if (clientesParaExportar.length === 0) {
        toast({
          title: 'Nenhum cliente para exportar',
          description: 'Não há clientes cadastrados para exportar',
          variant: 'destructive',
        });
        return;
      }

      // Criar linhas do CSV: telefone,nome
      const linhasCSV = clientesParaExportar.map((cliente) => {
        const telefone = formatarTelefone(cliente.whatsapp);
        const nome = cliente.nome.trim();
        return `${telefone},${nome}`;
      });

      // Juntar todas as linhas com quebra de linha
      const conteudoCSV = linhasCSV.join('\n');

      // Criar blob e fazer download
      const blob = new Blob([conteudoCSV], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `clientes_vip_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);

      toast({
        title: 'Exportação concluída!',
        description: `${clientesParaExportar.length} contato(s) exportado(s) com sucesso`,
      });
    } catch (error: any) {
      console.error('Erro ao exportar contatos:', error);
      toast({
        title: 'Erro ao exportar',
        description: error.message || 'Ocorreu um erro ao exportar os contatos',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
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
          <h1 className="text-3xl font-bold tracking-[-0.03em]">Clientes VIP</h1>
          <p className="text-muted-foreground text-[15px] leading-relaxed">
            Gerencie todos os clientes VIP do sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportarContatos}
            disabled={exporting || clientes.length === 0}
            variant="outline"
          >
            <Download className={`w-4 h-4 mr-2 ${exporting ? 'animate-spin' : ''}`} />
            {exporting ? 'Exportando...' : 'Exportar Contatos'}
          </Button>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </div>

      <NovoClienteModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleNovoClienteSuccess}
      />

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
                placeholder="Buscar por nome, WhatsApp ou email..."
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
                <TableHead>WhatsApp</TableHead>
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
                    Nenhum cliente encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredClientes.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell className="font-medium">{cliente.nome}</TableCell>
                    <TableCell>{cliente.whatsapp}</TableCell>
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

