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
import { Loader2, Store, Phone, Mail, Building2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VerLojaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lojaId: string | null;
}

interface LojaDetails {
  id: string;
  nome: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  ativo: boolean;
}

export function VerLojaModal({ open, onOpenChange, lojaId }: VerLojaModalProps) {
  const [loja, setLoja] = useState<LojaDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && lojaId) {
      loadLoja();
    } else {
      setLoja(null);
    }
  }, [open, lojaId]);

  const loadLoja = async () => {
    if (!lojaId) return;

    try {
      setLoading(true);
      const data = await api.get<LojaDetails>(`/lojas/${lojaId}`);
      setLoja(data);
    } catch (error: any) {
      console.error('Erro ao carregar loja:', error);
      toast({
        title: 'Erro ao carregar loja',
        description: error.message || 'Não foi possível carregar os detalhes da loja',
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
            <Store className="w-5 h-5" />
            Detalhes da Loja
          </DialogTitle>
          <DialogDescription>
            Informações completas da loja
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : loja ? (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome</label>
                <div className="flex items-center gap-2 mt-1">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <p className="text-base font-semibold">{loja.nome}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loja.cnpj && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">CNPJ</label>
                    <div className="flex items-center gap-2 mt-1">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <p className="text-base">{loja.cnpj}</p>
                    </div>
                  </div>
                )}

                {loja.telefone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <p className="text-base">{loja.telefone}</p>
                    </div>
                  </div>
                )}
              </div>

              {loja.email && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <p className="text-base">{loja.email}</p>
                  </div>
                </div>
              )}

              {loja.endereco && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Endereço</label>
                  <div className="mt-1">
                    <p className="text-base">{loja.endereco}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  <Badge variant={loja.ativo ? 'default' : 'secondary'}>
                    {loja.ativo ? 'Ativa' : 'Inativa'}
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

