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
import { Handshake, Plus, Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { NovoParceiroModal } from '@/components/modals/NovoParceiroModal';
import { VerParceiroModal } from '@/components/modals/VerParceiroModal';

interface Parceiro {
  id: string;
  nome: string;
  tipo: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  ativo: boolean;
}

export default function Parceiros() {
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [parceiroModalOpen, setParceiroModalOpen] = useState(false);
  const [parceiroSelecionado, setParceiroSelecionado] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [parceiroParaDeletar, setParceiroParaDeletar] = useState<Parceiro | null>(null);
  const [deletando, setDeletando] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadParceiros();
  }, []);

  const loadParceiros = async () => {
    try {
      setLoading(true);
      const data = await api.get<Parceiro[]>('/parceiros');
      setParceiros(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar parceiros:', error);
      setParceiros([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNovoParceiroSuccess = () => {
    loadParceiros();
  };

  const handleDesativar = async () => {
    if (!parceiroParaDeletar) return;

    try {
      setDeletando(true);
      await api.delete(`/parceiros/${parceiroParaDeletar.id}`);
      toast({
        title: 'Sucesso!',
        description: 'Parceiro desativado com sucesso.',
      });
      loadParceiros();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao desativar parceiro.',
        variant: 'destructive',
      });
    } finally {
      setDeletando(false);
      setDeleteDialogOpen(false);
      setParceiroParaDeletar(null);
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
          <h1 className="text-3xl font-bold tracking-[-0.03em]">Parceiros</h1>
          <p className="text-muted-foreground text-[15px] leading-relaxed">
            Gerencie todos os parceiros do programa VIP
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Parceiro
        </Button>
      </div>

      <NovoParceiroModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleNovoParceiroSuccess}
      />

      <VerParceiroModal
        open={parceiroModalOpen}
        onOpenChange={setParceiroModalOpen}
        parceiroId={parceiroSelecionado}
      />

      <Card>
        <CardHeader>
          <CardTitle>Lista de Parceiros</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parceiros.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhum parceiro cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                parceiros.map((parceiro) => (
                  <TableRow key={parceiro.id}>
                    <TableCell className="font-medium">{parceiro.nome}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{parceiro.tipo}</Badge>
                    </TableCell>
                    <TableCell>{parceiro.cnpj || 'N/A'}</TableCell>
                    <TableCell>{parceiro.telefone || 'N/A'}</TableCell>
                    <TableCell>{parceiro.email || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={parceiro.ativo ? 'default' : 'secondary'}>
                        {parceiro.ativo ? 'Ativo' : 'Inativo'}
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
                              setParceiroSelecionado(parceiro.id);
                              setParceiroModalOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setParceiroParaDeletar(parceiro);
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
            <AlertDialogTitle>Desativar Parceiro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desativar o parceiro <strong>{parceiroParaDeletar?.nome}</strong>?
              O login do parceiro também será desativado, mas os dados serão mantidos.
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

