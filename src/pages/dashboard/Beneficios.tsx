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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gift, Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '@/services/api';
import { NovoBeneficioModal } from '@/components/modals/NovoBeneficioModal';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
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

interface BeneficioOficial {
  id: string;
  nome: string;
  descricao?: string;
  parceiro_nome?: string;
  ativo: boolean;
}

interface BeneficioLoja {
  id: string;
  nome: string;
  descricao?: string;
  loja_nome?: string;
  tipo?: string;
  ativo: boolean;
}

export default function Beneficios() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [beneficiosOficiais, setBeneficiosOficiais] = useState<BeneficioOficial[]>([]);
  const [beneficiosLoja, setBeneficiosLoja] = useState<BeneficioLoja[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBeneficio, setEditingBeneficio] = useState<BeneficioOficial | BeneficioLoja | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [beneficioToDelete, setBeneficioToDelete] = useState<{ id: string; tipo: 'oficial' | 'loja'; nome: string } | null>(null);
  const isLojista = user?.role === 'lojista';
  const isAdminMt = user?.role === 'admin_mt';
  const isAdminShopping = user?.role === 'admin_shopping';

  useEffect(() => {
    loadBeneficios();
  }, []);

  const loadBeneficios = async () => {
    try {
      setLoading(true);
      
      // Lojistas só carregam benefícios de loja
      if (isLojista) {
        const loja = await api.get<BeneficioLoja[]>('/beneficios/loja').catch(() => []);
        setBeneficiosLoja(Array.isArray(loja) ? loja : []);
        setBeneficiosOficiais([]);
      } else {
        // Admin carrega ambos (visualização)
        const [oficiais, loja] = await Promise.all([
          api.get<BeneficioOficial[]>('/beneficios/oficiais').catch(() => []),
          api.get<BeneficioLoja[]>('/beneficios/loja').catch(() => []),
        ]);

        setBeneficiosOficiais(Array.isArray(oficiais) ? oficiais : []);
        setBeneficiosLoja(Array.isArray(loja) ? loja : []);
      }
    } catch (error) {
      console.error('Erro ao carregar benefícios:', error);
      setBeneficiosOficiais([]);
      setBeneficiosLoja([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNovoBeneficioSuccess = () => {
    loadBeneficios();
    setEditingBeneficio(null);
  };

  const handleEdit = (beneficio: BeneficioOficial | BeneficioLoja, tipo: 'oficial' | 'loja') => {
    setEditingBeneficio({ ...beneficio, tipo } as any);
    setModalOpen(true);
  };

  const handleDeleteClick = (beneficio: BeneficioOficial | BeneficioLoja, tipo: 'oficial' | 'loja') => {
    setBeneficioToDelete({ id: beneficio.id, tipo, nome: beneficio.nome });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!beneficioToDelete) return;

    try {
      const endpoint = beneficioToDelete.tipo === 'oficial' 
        ? `/beneficios/oficiais/${beneficioToDelete.id}`
        : `/beneficios/loja/${beneficioToDelete.id}`;
      
      await api.delete(endpoint);
      
      toast({
        title: 'Sucesso!',
        description: 'Benefício excluído com sucesso.',
      });
      
      loadBeneficios();
      setDeleteDialogOpen(false);
      setBeneficioToDelete(null);
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir benefício',
        description: error.response?.data?.error || 'Ocorreu um erro ao excluir o benefício.',
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
          <h1 className="text-3xl font-bold tracking-[-0.03em]">Benefícios</h1>
          <p className="text-muted-foreground text-[15px] leading-relaxed">
            {isLojista 
              ? 'Gerencie os benefícios da sua loja'
              : 'Gerencie benefícios oficiais e de lojas'}
          </p>
        </div>
        {/* Admin_shopping não pode criar benefícios, apenas visualizar */}
        {(isAdminMt || isLojista) && (
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Benefício
          </Button>
        )}
      </div>

      <NovoBeneficioModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setEditingBeneficio(null);
          }
        }}
        onSuccess={handleNovoBeneficioSuccess}
        beneficioEditando={editingBeneficio}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Benefício</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o benefício "{beneficioToDelete?.nome}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isLojista ? (
        // Lojistas só veem benefícios de loja
        <Card>
          <CardHeader>
            <CardTitle>Benefícios da Minha Loja</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {beneficiosLoja.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Nenhum benefício de loja cadastrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    beneficiosLoja.map((beneficio) => (
                      <TableRow key={beneficio.id}>
                        <TableCell className="font-medium">{beneficio.nome}</TableCell>
                        <TableCell>{beneficio.descricao || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={beneficio.ativo ? 'default' : 'secondary'}>
                            {beneficio.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(beneficio, 'loja')}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(beneficio, 'loja')}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        // Admin vê ambos em abas (visualização)
        <Tabs defaultValue="oficiais" className="space-y-4">
          <TabsList>
            <TabsTrigger value="oficiais">Benefícios Oficiais</TabsTrigger>
            <TabsTrigger value="loja">Benefícios de Loja</TabsTrigger>
          </TabsList>

        <TabsContent value="oficiais">
          <Card>
            <CardHeader>
              <CardTitle>Benefícios Oficiais do Shopping</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Parceiro</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {beneficiosOficiais.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Nenhum benefício oficial cadastrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    beneficiosOficiais.map((beneficio) => (
                      <TableRow key={beneficio.id}>
                        <TableCell className="font-medium">{beneficio.nome}</TableCell>
                        <TableCell>{beneficio.descricao || 'N/A'}</TableCell>
                        <TableCell>{beneficio.parceiro_nome || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={beneficio.ativo ? 'default' : 'secondary'}>
                            {beneficio.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(beneficio, 'oficial')}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(beneficio, 'oficial')}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loja">
          <Card>
            <CardHeader>
              <CardTitle>Benefícios das Lojas</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Loja</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {beneficiosLoja.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Nenhum benefício de loja cadastrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    beneficiosLoja.map((beneficio) => (
                      <TableRow key={beneficio.id}>
                        <TableCell className="font-medium">{beneficio.nome}</TableCell>
                        <TableCell>{beneficio.descricao || 'N/A'}</TableCell>
                        <TableCell>{beneficio.loja_nome || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{beneficio.tipo || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={beneficio.ativo ? 'default' : 'secondary'}>
                            {beneficio.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(beneficio, 'loja')}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(beneficio, 'loja')}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      )}
    </div>
  );
}

