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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface NovoVendedorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface FormData {
  nome: string;
  email: string;
  senha: string;
  whatsapp?: string;
  loja_id: string;
  codigo_vendedor: string;
  comissao_padrao?: number;
  meta_vendas?: number;
  meta_vendas_valor?: number;
}

interface Loja {
  id: string;
  nome: string;
}

export function NovoVendedorModal({ open, onOpenChange, onSuccess }: NovoVendedorModalProps) {
  const [loading, setLoading] = useState(false);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [loadingLojas, setLoadingLojas] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>();

  const selectedLojaId = watch('loja_id');

  useEffect(() => {
    if (open) {
      loadLojas();
    }
  }, [open]);

  const loadLojas = async () => {
    try {
      setLoadingLojas(true);
      const data = await api.get<Loja[]>('/lojas');
      setLojas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
      setLojas([]);
    } finally {
      setLoadingLojas(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      await api.post('/vendedores', {
        ...data,
        comissao_padrao: data.comissao_padrao ? Number(data.comissao_padrao) : 0,
        meta_vendas: data.meta_vendas ? Number(data.meta_vendas) : 0,
        meta_vendas_valor: data.meta_vendas_valor ? Number(data.meta_vendas_valor) : 0,
      });
      toast({
        title: 'Sucesso!',
        description: 'Vendedor cadastrado com sucesso.',
      });
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      const errorMessage = error.message || 'Ocorreu um erro ao cadastrar o vendedor.';
      toast({
        title: 'Erro ao cadastrar vendedor',
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
            Novo Vendedor
          </DialogTitle>
          <DialogDescription className="text-[15px] leading-relaxed">
            Cadastre um novo vendedor vinculado a uma loja.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-sm font-medium">
              Nome Completo *
            </Label>
            <Input
              id="nome"
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
              <Label htmlFor="email" className="text-sm font-medium">
                Email *
              </Label>
              <Input
                id="email"
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
              <Label htmlFor="senha" className="text-sm font-medium">
                Senha *
              </Label>
              <Input
                id="senha"
                type="password"
                placeholder="Mínimo 6 caracteres"
                {...register('senha', {
                  required: 'Senha é obrigatória',
                  minLength: { value: 6, message: 'Mínimo 6 caracteres' },
                })}
                className={errors.senha ? 'border-destructive' : ''}
              />
              {errors.senha && (
                <p className="text-xs text-destructive">{errors.senha.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="text-sm font-medium">
                WhatsApp
              </Label>
              <Input
                id="whatsapp"
                placeholder="(71) 99999-9999"
                {...register('whatsapp')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="codigo_vendedor" className="text-sm font-medium">
                Código do Vendedor *
              </Label>
              <Input
                id="codigo_vendedor"
                placeholder="Ex: VND001"
                {...register('codigo_vendedor', { required: 'Código é obrigatório' })}
                className={errors.codigo_vendedor ? 'border-destructive' : ''}
              />
              {errors.codigo_vendedor && (
                <p className="text-xs text-destructive">{errors.codigo_vendedor.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Loja *
            </Label>
            {loadingLojas ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando lojas...
              </div>
            ) : (
              <Select
                value={selectedLojaId}
                onValueChange={(value) => setValue('loja_id', value)}
              >
                <SelectTrigger className={!selectedLojaId && errors.loja_id ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecione uma loja" />
                </SelectTrigger>
                <SelectContent>
                  {lojas.map((loja) => (
                    <SelectItem key={loja.id} value={loja.id}>
                      {loja.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <input type="hidden" {...register('loja_id', { required: 'Loja é obrigatória' })} />
            {errors.loja_id && (
              <p className="text-xs text-destructive">{errors.loja_id.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="comissao_padrao" className="text-sm font-medium">
                Comissão (%)
              </Label>
              <Input
                id="comissao_padrao"
                type="number"
                step="0.01"
                placeholder="0"
                {...register('comissao_padrao')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta_vendas" className="text-sm font-medium">
                Meta Vendas (qtd)
              </Label>
              <Input
                id="meta_vendas"
                type="number"
                placeholder="0"
                {...register('meta_vendas')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meta_vendas_valor" className="text-sm font-medium">
                Meta Valor (R$)
              </Label>
              <Input
                id="meta_vendas_valor"
                type="number"
                step="0.01"
                placeholder="0"
                {...register('meta_vendas_valor')}
              />
            </div>
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
                  Cadastrando...
                </>
              ) : (
                'Cadastrar Vendedor'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
