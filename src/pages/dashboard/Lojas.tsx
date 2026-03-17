import { useEffect, useState } from 'react';
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
import { Store, Plus, Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { NovaLojaModal } from '@/components/modals/NovaLojaModal';
import { VerLojaModal } from '@/components/modals/VerLojaModal';

interface Loja {
  id: string;
  nome: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  ativo: boolean;
}

export default function Lojas() {
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [lojaModalOpen, setLojaModalOpen] = useState(false);
  const [lojaSelecionada, setLojaSelecionada] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lojaParaDeletar, setLojaParaDeletar] = useState<Loja | null>(null);
  const [deletando, setDeletando] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadLojas();
  }, []);

  const loadLojas = async () => {
    try {
      setLoading(true);
      const data = await api.get<Loja[]>('/lojas');
      setLojas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
      setLojas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNovaLojaSuccess = () => {
    loadLojas();
  };

  const handleDesativar = async () => {
    if (!lojaParaDeletar) return;

    try {
      setDeletando(true);
      await api.delete(`/lojas/${lojaParaDeletar.id}`);
      toast({
        title: 'Sucesso!',
        description: 'Loja desativada com sucesso.',
      });
      loadLojas();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao desativar loja.',
        variant: 'destructive',
      });
    } finally {
      setDeletando(false);
      setDeleteDialogOpen(false);
      setLojaParaDeletar(null);
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
          <h1 className="text-3xl font-bold tracking-[-0.03em]">Lojas</h1>
          <p className="text-muted-foreground text-[15px] leading-relaxed">
            Gerencie todas as lojas do shopping
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Loja
        </Button>
      </div>

      <NovaLojaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleNovaLojaSuccess}
      />

      <VerLojaModal
        open={lojaModalOpen}
        onOpenChange={setLojaModalOpen}
        lojaId={lojaSelecionada}
      />

      <Card>
        <CardHeader>
          <CardTitle>Lista de Lojas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lojas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhuma loja cadastrada
                  </TableCell>
                </TableRow>
              ) : (
                lojas.map((loja) => (
                  <TableRow key={loja.id}>
                    <TableCell className="font-medium">{loja.nome}</TableCell>
                    <TableCell>{loja.cnpj || 'N/A'}</TableCell>
                    <TableCell>{loja.telefone || 'N/A'}</TableCell>
                    <TableCell>{loja.email || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={loja.ativo ? 'default' : 'secondary'}>
                        {loja.ativo ? 'Ativa' : 'Inativa'}
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
                              setLojaSelecionada(loja.id);
                              setLojaModalOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setLojaParaDeletar(loja);
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
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar Loja</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desativar a loja <strong>{lojaParaDeletar?.nome}</strong>?
              O login da loja também será desativado, mas os dados serão mantidos.
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

