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
import { Gift, Plus } from 'lucide-react';
import { api } from '@/services/api';
import { NovoBeneficioModal } from '@/components/modals/NovoBeneficioModal';

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
  const [beneficiosOficiais, setBeneficiosOficiais] = useState<BeneficioOficial[]>([]);
  const [beneficiosLoja, setBeneficiosLoja] = useState<BeneficioLoja[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadBeneficios();
  }, []);

  const loadBeneficios = async () => {
    try {
      setLoading(true);
      const [oficiais, loja] = await Promise.all([
        api.get<BeneficioOficial[]>('/beneficios/oficiais').catch(() => []),
        api.get<BeneficioLoja[]>('/beneficios/loja').catch(() => []),
      ]);

      setBeneficiosOficiais(Array.isArray(oficiais) ? oficiais : []);
      setBeneficiosLoja(Array.isArray(loja) ? loja : []);
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
            Gerencie benefícios oficiais e de lojas
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Benefício
        </Button>
      </div>

      <NovoBeneficioModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={handleNovoBeneficioSuccess}
      />

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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {beneficiosOficiais.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {beneficiosLoja.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
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
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

