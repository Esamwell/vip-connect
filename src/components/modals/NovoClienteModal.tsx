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

interface NovoClienteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface Loja {
  id: string;
  nome: string;
}

interface Vendedor {
  id: string;
  nome: string;
  codigo_vendedor: string;
  loja_id: string;
}

interface FormData {
  nome: string;
  whatsapp: string;
  email?: string;
  loja_id: string;
  vendedor_id?: string;
  data_venda: string;
  veiculo_marca?: string;
  veiculo_modelo?: string;
  veiculo_ano?: string;
  veiculo_placa?: string;
  veiculo_valor?: string;
}

export function NovoClienteModal({ open, onOpenChange, onSuccess }: NovoClienteModalProps) {
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>();

  const lojaSelecionada = watch('loja_id');
  const vendedorSelecionado = watch('vendedor_id');

  useEffect(() => {
    if (open) {
      loadLojas();
      // Resetar formulário quando abrir
      reset({
        data_venda: new Date().toISOString().split('T')[0],
      });
      setVendedores([]);
    }
  }, [open]);

  // Carregar vendedores quando a loja mudar
  useEffect(() => {
    if (lojaSelecionada) {
      loadVendedores(lojaSelecionada);
    } else {
      setVendedores([]);
      setValue('vendedor_id', undefined);
    }
  }, [lojaSelecionada]);

  const loadLojas = async () => {
    try {
      const data = await api.get<Loja[]>('/lojas').catch(() => []);
      setLojas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
      setLojas([]);
    }
  };

  const loadVendedores = async (lojaId: string) => {
    try {
      const data = await api.get<Vendedor[]>('/vendedores').catch(() => []);
      const filtered = Array.isArray(data)
        ? data.filter((v) => v.loja_id === lojaId)
        : [];
      setVendedores(filtered);
    } catch (error) {
      console.error('Erro ao carregar vendedores:', error);
      setVendedores([]);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      await api.post('/clientes-vip', data);
      toast({
        title: 'Sucesso!',
        description: 'Cliente VIP criado com sucesso.',
      });
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Erro ao criar cliente',
        description: error.response?.data?.error || 'Ocorreu um erro ao criar o cliente VIP.',
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
            Novo Cliente VIP
          </DialogTitle>
          <DialogDescription className="text-[15px] leading-relaxed">
            Cadastre um novo cliente VIP no sistema. O cartão digital será gerado automaticamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-sm font-medium">
                Nome Completo *
              </Label>
              <Input
                id="nome"
                placeholder="João Silva"
                {...register('nome', { required: 'Nome é obrigatório' })}
                className={errors.nome ? 'border-destructive' : ''}
              />
              {errors.nome && (
                <p className="text-xs text-destructive">{errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="text-sm font-medium">
                WhatsApp *
              </Label>
              <Input
                id="whatsapp"
                placeholder="(71) 99999-9999"
                {...register('whatsapp', {
                  required: 'WhatsApp é obrigatório',
                  pattern: {
                    value: /^[\d\s\(\)\-\+]+$/,
                    message: 'Formato inválido',
                  },
                })}
                className={errors.whatsapp ? 'border-destructive' : ''}
              />
              {errors.whatsapp && (
                <p className="text-xs text-destructive">{errors.whatsapp.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="cliente@email.com"
                {...register('email')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="loja_id" className="text-sm font-medium">
                Loja *
              </Label>
              <Select
                value={lojaSelecionada}
                onValueChange={(value) => {
                  setValue('loja_id', value, { shouldValidate: true });
                  setValue('vendedor_id', undefined);
                }}
              >
                <SelectTrigger className={errors.loja_id ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Selecione a loja" />
                </SelectTrigger>
                <SelectContent>
                  {lojas.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Nenhuma loja disponível
                    </SelectItem>
                  ) : (
                    lojas.map((loja) => (
                      <SelectItem key={loja.id} value={loja.id}>
                        {loja.nome}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.loja_id && (
                <p className="text-xs text-destructive">Loja é obrigatória</p>
              )}
            </div>
          </div>

          {lojaSelecionada && vendedores.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="vendedor_id" className="text-sm font-medium">
                Vendedor
              </Label>
              <Select
                value={vendedorSelecionado || 'none'}
                onValueChange={(value) => setValue('vendedor_id', value === 'none' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o vendedor (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {vendedores.map((vendedor) => (
                    <SelectItem key={vendedor.id} value={vendedor.id}>
                      {vendedor.nome} ({vendedor.codigo_vendedor})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Vincule este cliente a um vendedor da loja
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="data_venda" className="text-sm font-medium">
              Data da Venda *
            </Label>
            <Input
              id="data_venda"
              type="date"
              {...register('data_venda', { required: 'Data da venda é obrigatória' })}
              className={errors.data_venda ? 'border-destructive' : ''}
            />
            {errors.data_venda && (
              <p className="text-xs text-destructive">{errors.data_venda.message}</p>
            )}
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
              Dados do Veículo (Opcional)
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="veiculo_marca" className="text-sm font-medium">
                  Marca
                </Label>
                <Input
                  id="veiculo_marca"
                  placeholder="Toyota"
                  {...register('veiculo_marca')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="veiculo_modelo" className="text-sm font-medium">
                  Modelo
                </Label>
                <Input
                  id="veiculo_modelo"
                  placeholder="Corolla"
                  {...register('veiculo_modelo')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="veiculo_ano" className="text-sm font-medium">
                  Ano
                </Label>
                <Input
                  id="veiculo_ano"
                  type="number"
                  placeholder="2024"
                  {...register('veiculo_ano')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="veiculo_placa" className="text-sm font-medium">
                  Placa
                </Label>
                <Input
                  id="veiculo_placa"
                  placeholder="ABC-1234"
                  {...register('veiculo_placa')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="veiculo_valor" className="text-sm font-medium">
                  Valor do Veículo
                </Label>
                <Input
                  id="veiculo_valor"
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="50000.00"
                  {...register('veiculo_valor')}
                />
              </div>
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
                  Criando...
                </>
              ) : (
                'Criar Cliente VIP'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

