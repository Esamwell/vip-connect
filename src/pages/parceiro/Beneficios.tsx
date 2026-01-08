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
import { Plus } from 'lucide-react';
import { api } from '@/services/api';
import { NovoBeneficioModal } from '@/components/modals/NovoBeneficioModal';

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


  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-[-0.03em]">Benefícios Oficiais</h1>
        <p className="text-muted-foreground mt-1">
          Visualize seus benefícios oficiais do programa VIP
        </p>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


