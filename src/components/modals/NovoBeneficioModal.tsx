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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface NovoBeneficioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface Parceiro {
  id: string;
  nome: string;
  tipo?: string;
}

interface FormData {
  nome: string;
  descricao?: string;
  tipo: 'oficial' | 'loja';
  parceiro_id?: string;
  loja_id?: string;
}

export function NovoBeneficioModal({ open, onOpenChange, onSuccess }: NovoBeneficioModalProps) {
  const [loading, setLoading] = useState(false);
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [tipo, setTipo] = useState<'oficial' | 'loja'>('oficial');
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

  const parceiroSelecionado = watch('parceiro_id');

  useEffect(() => {
    if (open) {
      setTipo('oficial');
      setValue('tipo', 'oficial');
      loadParceiros();
      reset({
        tipo: 'oficial',
      });
    }
  }, [open]);

  const loadParceiros = async () => {
    try {
      const data = await api.get<Parceiro[]>('/parceiros').catch(() => []);
      setParceiros(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar parceiros:', error);
      setParceiros([]);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!data.nome) {
      toast({
        title: 'Campo obrigatório',
        description: 'Nome do benefício é obrigatório.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      if (tipo === 'oficial') {
        if (!parceiroSelecionado) {
          toast({
            title: 'Campo obrigatório',
            description: 'Parceiro é obrigatório para benefícios oficiais.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
        // Criar benefício oficial
        await api.post('/beneficios/oficiais', {
          nome: data.nome,
          descricao: data.descricao,
          parceiro_id: parceiroSelecionado,
        });
      } else {
        // Criar benefício de loja
        await api.post('/beneficios/loja', {
          nome: data.nome,
          descricao: data.descricao,
          loja_id: data.loja_id || user?.id, // Usar loja do lojista logado
        });
      }

      toast({
        title: 'Sucesso!',
        description: 'Benefício criado com sucesso.',
      });
      reset();
      setTipo('oficial');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Erro ao criar benefício',
        description: error.message || 'Ocorreu um erro ao criar o benefício.',
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
            Novo Benefício
          </DialogTitle>
          <DialogDescription className="text-[15px] leading-relaxed">
            Cadastre um novo benefício oficial do shopping ou da loja.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Tabs 
            value={tipo} 
            onValueChange={(v) => {
              const newTipo = v as 'oficial' | 'loja';
              setTipo(newTipo);
              setValue('tipo', newTipo, { shouldValidate: true });
              if (newTipo === 'oficial') {
                loadParceiros();
              }
            }}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="oficial">Benefício Oficial</TabsTrigger>
              <TabsTrigger value="loja">Benefício de Loja</TabsTrigger>
            </TabsList>

            <TabsContent value="oficial" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-sm font-medium">
                  Nome do Benefício *
                </Label>
                <Input
                  id="nome"
                  placeholder="Ex: Lavagem Completa Grátis"
                  {...register('nome', { required: 'Nome é obrigatório' })}
                  className={errors.nome ? 'border-destructive' : ''}
                />
                {errors.nome && (
                  <p className="text-xs text-destructive">{errors.nome.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="parceiro_id" className="text-sm font-medium">
                  Parceiro *
                </Label>
                <Select
                  value={parceiroSelecionado}
                  onValueChange={(value) => setValue('parceiro_id', value, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o parceiro" />
                  </SelectTrigger>
                  <SelectContent>
                    {parceiros.length === 0 ? (
                      <SelectItem value="none" disabled>
                        Nenhum parceiro disponível
                      </SelectItem>
                    ) : (
                      parceiros.map((parceiro) => (
                        <SelectItem key={parceiro.id} value={parceiro.id}>
                          {parceiro.nome}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao" className="text-sm font-medium">
                  Descrição
                </Label>
                <Textarea
                  id="descricao"
                  placeholder="Descreva o benefício oferecido"
                  {...register('descricao')}
                  className="min-h-[100px]"
                />
              </div>
            </TabsContent>

            <TabsContent value="loja" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="nome_loja" className="text-sm font-medium">
                  Nome do Benefício *
                </Label>
                <Input
                  id="nome_loja"
                  placeholder="Ex: Revisão com desconto"
                  {...register('nome', { required: 'Nome é obrigatório' })}
                  className={errors.nome ? 'border-destructive' : ''}
                />
                {errors.nome && (
                  <p className="text-xs text-destructive">{errors.nome.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao_loja" className="text-sm font-medium">
                  Descrição
                </Label>
                <Textarea
                  id="descricao_loja"
                  placeholder="Descreva o benefício oferecido pela loja"
                  {...register('descricao')}
                  className="min-h-[100px]"
                />
              </div>
            </TabsContent>
          </Tabs>

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
                'Criar Benefício'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

