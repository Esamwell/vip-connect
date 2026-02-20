import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface EditarVendedorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendedor: Vendedor | null;
  onSuccess?: () => void;
}

interface Vendedor {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  whatsapp?: string;
  codigo_vendedor: string;
  comissao_padrao: number;
  meta_vendas: number;
  meta_vendas_valor: number;
  ativo: boolean;
  loja_nome?: string;
}

interface FormData {
  nome: string;
  email: string;
  whatsapp?: string;
  codigo_vendedor: string;
  comissao_padrao?: number;
  meta_vendas?: number;
  meta_vendas_valor?: number;
  ativo: boolean;
}

export function EditarVendedorModal({ open, onOpenChange, vendedor, onSuccess }: EditarVendedorModalProps) {
  const [loading, setLoading] = useState(false);
  const [ativo, setAtivo] = useState(true);
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>();

  useEffect(() => {
    if (vendedor && open) {
      reset({
        nome: vendedor.nome,
        email: vendedor.email,
        whatsapp: vendedor.whatsapp || '',
        codigo_vendedor: vendedor.codigo_vendedor,
        comissao_padrao: vendedor.comissao_padrao,
        meta_vendas: vendedor.meta_vendas,
        meta_vendas_valor: vendedor.meta_vendas_valor,
        ativo: vendedor.ativo,
      });
      setAtivo(vendedor.ativo);
    }
  }, [vendedor, open, reset]);

  const onSubmit = async (data: FormData) => {
    if (!vendedor) return;

    try {
      setLoading(true);
      await api.put(`/vendedores/${vendedor.id}`, {
        ...data,
        ativo,
        comissao_padrao: data.comissao_padrao ? Number(data.comissao_padrao) : 0,
        meta_vendas: data.meta_vendas ? Number(data.meta_vendas) : 0,
        meta_vendas_valor: data.meta_vendas_valor ? Number(data.meta_vendas_valor) : 0,
      });
      toast({
        title: 'Sucesso!',
        description: 'Vendedor atualizado com sucesso.',
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      const errorMessage = error.message || 'Ocorreu um erro ao atualizar o vendedor.';
      toast({
        title: 'Erro ao atualizar vendedor',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight">
            Editar Vendedor
          </DialogTitle>
          <DialogDescription className="text-[15px] leading-relaxed">
            Atualize os dados do vendedor{vendedor?.loja_nome ? ` da loja ${vendedor.loja_nome}` : ''}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="edit-nome" className="text-sm font-medium">
              Nome Completo *
            </Label>
            <Input
              id="edit-nome"
              placeholder="Nome do vendedor"
              {...register('nome', { required: 'Nome é obrigatório' })}
              className={errors.nome ? 'border-destructive' : ''}
            />
            {errors.nome && (
              <p className="text-xs text-destructive">{errors.nome.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-email" className="text-sm font-medium">
                Email *
              </Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="vendedor@email.com"
                {...register('email', { required: 'Email é obrigatório' })}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-whatsapp" className="text-sm font-medium">
                WhatsApp
              </Label>
              <Input
                id="edit-whatsapp"
                placeholder="(71) 99999-9999"
                {...register('whatsapp')}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-codigo" className="text-sm font-medium">
                Código do Vendedor *
              </Label>
              <Input
                id="edit-codigo"
                placeholder="Ex: VND001"
                {...register('codigo_vendedor', { required: 'Código é obrigatório' })}
                className={errors.codigo_vendedor ? 'border-destructive' : ''}
              />
              {errors.codigo_vendedor && (
                <p className="text-xs text-destructive">{errors.codigo_vendedor.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-comissao" className="text-sm font-medium">
                Comissão (%)
              </Label>
              <Input
                id="edit-comissao"
                type="number"
                step="0.01"
                placeholder="0"
                {...register('comissao_padrao')}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-meta-vendas" className="text-sm font-medium">
                Meta Vendas (qtd)
              </Label>
              <Input
                id="edit-meta-vendas"
                type="number"
                placeholder="0"
                {...register('meta_vendas')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-meta-valor" className="text-sm font-medium">
                Meta Valor (R$)
              </Label>
              <Input
                id="edit-meta-valor"
                type="number"
                step="0.01"
                placeholder="0"
                {...register('meta_vendas_valor')}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Status do Vendedor</Label>
              <p className="text-xs text-muted-foreground">
                {ativo ? 'Vendedor ativo no sistema' : 'Vendedor desativado'}
              </p>
            </div>
            <Switch
              checked={ativo}
              onCheckedChange={setAtivo}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
