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
import { Handshake, Plus, Eye } from 'lucide-react';
import { api } from '@/services/api';
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
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setParceiroSelecionado(parceiro.id);
                          setParceiroModalOpen(true);
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

