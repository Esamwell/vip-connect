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
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api } from '@/services/api';
import { NovoBeneficioModal } from '@/components/modals/NovoBeneficioModal';
import { EditarBeneficioModal } from '@/components/modals/EditarBeneficioModal';
import { useToast } from '@/hooks/use-toast';

interface BeneficioOficial {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
}

export default function ParceiroBeneficios() {
  const [beneficios, setBeneficios] = useState<BeneficioOficial[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [selectedBeneficio, setSelectedBeneficio] = useState<BeneficioOficial | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadBeneficios();
  }, []);

  const loadBeneficios = async () => {
    try {
      setLoading(true);
      // Buscar apenas benefícios oficiais do parceiro logado
      const data = await api.get<BeneficioOficial[]>('/beneficios/oficiais').catch(() => []);
      setBeneficios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar benefícios:', error);
      setBeneficios([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (beneficio: BeneficioOficial) => {
    setSelectedBeneficio(beneficio);
    setModalEditOpen(true);
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o benefício "${nome}"?`)) return;

    try {
      await api.delete(`/beneficios/oficiais/${id}`);
      toast({
        title: 'Sucesso',
        description: 'Benefício excluído com sucesso.',
      });
      loadBeneficios();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Erro ao excluir benefício.',
        variant: 'destructive',
      });
    }
  };


  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-[-0.03em]">Benefícios Oficiais</h1>
          <p className="text-muted-foreground mt-1">
            Visualize seus benefícios oficiais do programa VIP
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Benefício
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Benefícios</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              Carregando benefícios...
            </div>
          ) : beneficios.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Nenhum benefício cadastrado ainda
            </div>
          ) : (
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
                {beneficios.map((beneficio) => (
                  <TableRow key={beneficio.id}>
                    <TableCell className="font-medium">{beneficio.nome}</TableCell>
                    <TableCell>{beneficio.descricao || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={beneficio.ativo ? 'default' : 'secondary'}>
                        {beneficio.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEditClick(beneficio)}
                          title="Editar Benefício"
                        >
                          <Pencil className="w-4 h-4 text-muted-foreground hover:text-primary" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(beneficio.id, beneficio.nome)}
                          title="Excluir Benefício"
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <NovoBeneficioModal 
        open={modalOpen} 
        onOpenChange={setModalOpen}
        onSuccess={loadBeneficios}
        apenasOficiais={true}
      />

      <EditarBeneficioModal
        open={modalEditOpen}
        onOpenChange={setModalEditOpen}
        beneficio={selectedBeneficio}
        onSuccess={loadBeneficios}
        tipo="oficial"
      />
    </div>
  );
}


