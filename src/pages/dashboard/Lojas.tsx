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
import { Store, Plus, Eye } from 'lucide-react';
import { api } from '@/services/api';
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
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setLojaSelecionada(loja.id);
                          setLojaModalOpen(true);
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

