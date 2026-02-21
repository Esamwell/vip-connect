import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Users, Plus, Search, MoreHorizontal, Pencil, Trash2, Gift, Eye } from 'lucide-react';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { NovoVendedorModal } from '@/components/modals/NovoVendedorModal';
import { EditarVendedorModal } from '@/components/modals/EditarVendedorModal';
import { GerenciarVouchersVendedorModal } from '@/components/modals/GerenciarVouchersVendedorModal';
import { VerPerfilVendedorModal } from '@/components/modals/VerPerfilVendedorModal';

interface Vendedor {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  user_whatsapp?: string;
  whatsapp?: string;
  codigo_vendedor: string;
  comissao_padrao: number;
  meta_vendas: number;
  meta_vendas_valor: number;
  ativo: boolean;
  loja_id: string;
  loja_nome: string;
  data_contratacao?: string;
}

export default function Vendedores() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [novoModalOpen, setNovoModalOpen] = useState(false);
  const [editarModalOpen, setEditarModalOpen] = useState(false);
  const [vendedorSelecionado, setVendedorSelecionado] = useState<Vendedor | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vendedorParaDeletar, setVendedorParaDeletar] = useState<Vendedor | null>(null);
  const [deletando, setDeletando] = useState(false);
  const [vouchersModalOpen, setVouchersModalOpen] = useState(false);
  const [vendedorVouchers, setVendedorVouchers] = useState<Vendedor | null>(null);
  const [perfilModalOpen, setPerfilModalOpen] = useState(false);
  const [vendedorPerfil, setVendedorPerfil] = useState<Vendedor | null>(null);
  const [filterLoja, setFilterLoja] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadVendedores();
  }, []);

  const loadVendedores = async () => {
    try {
      setLoading(true);
      const data = await api.get<Vendedor[]>('/vendedores');
      setVendedores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar vendedores:', error);
      setVendedores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDesativar = async () => {
    if (!vendedorParaDeletar) return;

    try {
      setDeletando(true);
      await api.delete(`/vendedores/${vendedorParaDeletar.id}`);
      toast({
        title: 'Sucesso!',
        description: 'Vendedor desativado com sucesso.',
      });
      loadVendedores();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao desativar vendedor.',
        variant: 'destructive',
      });
    } finally {
      setDeletando(false);
      setDeleteDialogOpen(false);
      setVendedorParaDeletar(null);
    }
  };

  const filteredVendedores = vendedores.filter((v) => {
    const termo = search.toLowerCase();
    const nomeMatch = v.nome.toLowerCase().includes(termo);
    const emailMatch = v.email.toLowerCase().includes(termo);
    const codigoMatch = v.codigo_vendedor.toLowerCase().includes(termo);
    const lojaMatch = filterLoja ? v.loja_id === filterLoja : true;
    
    return nomeMatch || emailMatch || codigoMatch;
  }).filter(v => filterLoja ? v.loja_id === filterLoja : true);

  const canCreate = user?.role === 'admin_mt' || user?.role === 'admin_shopping' || user?.role === 'lojista';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-[-0.03em]">Vendedores</h1>
          <p className="text-muted-foreground text-[15px] leading-relaxed">
            Gerencie os vendedores {user?.role === 'lojista' ? 'da sua loja' : 'de todas as lojas'}
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setNovoModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Vendedor
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{vendedores.length}</p>
                <p className="text-sm text-muted-foreground">Total de Vendedores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{vendedores.filter(v => v.ativo).length}</p>
                <p className="text-sm text-muted-foreground">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {new Set(vendedores.map(v => v.loja_id)).size}
                </p>
                <p className="text-sm text-muted-foreground">Lojas com Vendedores</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={filterLoja} onValueChange={setFilterLoja}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por loja" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas as lojas</SelectItem>
              {Array.from(new Set(vendedores.map(v => ({ id: v.loja_id, nome: v.loja_nome }))))
                .map((loja: { id: string; nome: string }) => (
                  <SelectItem key={loja.id} value={loja.id}>
                    {loja.nome}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Vendedores</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Código</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden lg:table-cell">Loja</TableHead>
                <TableHead className="hidden lg:table-cell">Comissão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendedores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {search ? 'Nenhum vendedor encontrado para a busca' : 'Nenhum vendedor cadastrado'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredVendedores.map((vendedor) => (
                  <TableRow key={vendedor.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{vendedor.nome}</p>
                        <p className="text-xs text-muted-foreground md:hidden">{vendedor.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {vendedor.codigo_vendedor}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{vendedor.email}</TableCell>
                    <TableCell className="hidden lg:table-cell">{vendedor.loja_nome}</TableCell>
                    <TableCell className="hidden lg:table-cell">{vendedor.comissao_padrao}%</TableCell>
                    <TableCell>
                      <Badge variant={vendedor.ativo ? 'default' : 'secondary'}>
                        {vendedor.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setVendedorPerfil(vendedor);
                              setPerfilModalOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setVendedorSelecionado(vendedor);
                              setEditarModalOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setVendedorVouchers(vendedor);
                              setVouchersModalOpen(true);
                            }}
                          >
                            <Gift className="w-4 h-4 mr-2" />
                            Vouchers
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setVendedorParaDeletar(vendedor);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Desativar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modals */}
      <NovoVendedorModal
        open={novoModalOpen}
        onOpenChange={setNovoModalOpen}
        onSuccess={loadVendedores}
      />

      <EditarVendedorModal
        open={editarModalOpen}
        onOpenChange={setEditarModalOpen}
        vendedor={vendedorSelecionado}
        onSuccess={loadVendedores}
      />

      {vendedorVouchers && (
        <GerenciarVouchersVendedorModal
          open={vouchersModalOpen}
          onOpenChange={setVouchersModalOpen}
          vendedorId={vendedorVouchers.id}
          vendedorNome={vendedorVouchers.nome}
        />
      )}

      {vendedorPerfil && (
        <VerPerfilVendedorModal
          open={perfilModalOpen}
          onOpenChange={setPerfilModalOpen}
          vendedorId={vendedorPerfil.id}
          vendedorNome={vendedorPerfil.nome}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar Vendedor</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desativar o vendedor <strong>{vendedorParaDeletar?.nome}</strong>?
              O vendedor não poderá mais acessar o sistema, mas seus dados serão mantidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDesativar}
              disabled={deletando}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletando ? 'Desativando...' : 'Desativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
