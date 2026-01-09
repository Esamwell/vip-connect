import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/api';
import { Loader2, Handshake, Phone, Mail, FileText, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VerParceiroModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parceiroId: string | null;
}

interface ParceiroDetails {
  id: string;
  nome: string;
  tipo: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  ativo: boolean;
}

export function VerParceiroModal({ open, onOpenChange, parceiroId }: VerParceiroModalProps) {
  const [parceiro, setParceiro] = useState<ParceiroDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && parceiroId) {
      loadParceiro();
    } else {
      setParceiro(null);
    }
  }, [open, parceiroId]);

  const loadParceiro = async () => {
    if (!parceiroId) return;

    try {
      setLoading(true);
      const data = await api.get<ParceiroDetails>(`/parceiros/${parceiroId}`);
      setParceiro(data);
    } catch (error: any) {
      console.error('Erro ao carregar parceiro:', error);
      toast({
        title: 'Erro ao carregar parceiro',
        description: error.message || 'Não foi possível carregar os detalhes do parceiro',
        variant: 'destructive',
      });
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Handshake className="w-5 h-5" />
            Detalhes do Parceiro
          </DialogTitle>
          <DialogDescription>
            Informações completas do parceiro
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : parceiro ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome</label>
                <p className="text-base font-semibold mt-1">{parceiro.nome}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                  <div className="mt-1">
                    <Badge variant="outline">{parceiro.tipo}</Badge>
                  </div>
                </div>

                {parceiro.cnpj && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">CNPJ</label>
                    <div className="flex items-center gap-2 mt-1">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <p className="text-base">{parceiro.cnpj}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parceiro.telefone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <p className="text-base">{parceiro.telefone}</p>
                    </div>
                  </div>
                )}

                {parceiro.email && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <p className="text-base">{parceiro.email}</p>
                    </div>
                  </div>
                )}
              </div>

              {parceiro.endereco && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Endereço</label>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <p className="text-base">{parceiro.endereco}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <Badge variant={parceiro.ativo ? 'default' : 'secondary'}>
                    {parceiro.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

