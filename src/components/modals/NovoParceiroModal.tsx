import { useState } from 'react';
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
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface NovoParceiroModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface FormData {
  nome: string;
  tipo: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
}

export function NovoParceiroModal({ open, onOpenChange, onSuccess }: NovoParceiroModalProps) {
  const [loading, setLoading] = useState(false);
  const [tipoSelecionado, setTipoSelecionado] = useState('');
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormData>();

  const tiposParceiro = [
    { value: 'lavagem', label: 'Lavagem' },
    { value: 'estetica', label: 'Estética Automotiva' },
    { value: 'oficina', label: 'Oficina Mecânica' },
    { value: 'pneu', label: 'Pneus' },
    { value: 'vidros', label: 'Vidros Automotivos' },
    { value: 'outros', label: 'Outros' },
  ];

  const onSubmit = async (data: FormData) => {
    if (!tipoSelecionado) {
      toast({
        title: 'Campo obrigatório',
        description: 'Selecione o tipo de parceiro.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      await api.post('/parceiros', { ...data, tipo: tipoSelecionado });
      toast({
        title: 'Sucesso!',
        description: 'Parceiro criado com sucesso.',
      });
      reset();
      setTipoSelecionado('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Erro ao criar parceiro',
        description: error.message || 'Ocorreu um erro ao criar o parceiro.',
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
            Novo Parceiro
          </DialogTitle>
          <DialogDescription className="text-[15px] leading-relaxed">
            Cadastre um novo parceiro para validar benefícios do programa VIP.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="nome" className="text-sm font-medium">
              Nome do Parceiro *
            </Label>
            <Input
              id="nome"
              placeholder="Nome do parceiro"
              {...register('nome', { required: 'Nome é obrigatório' })}
              className={errors.nome ? 'border-destructive' : ''}
            />
            {errors.nome && (
              <p className="text-xs text-destructive">{errors.nome.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo" className="text-sm font-medium">
              Tipo de Parceiro *
            </Label>
            <Select
              value={tipoSelecionado}
              onValueChange={(value) => {
                setTipoSelecionado(value);
                setValue('tipo', value, { shouldValidate: true });
              }}
            >
              <SelectTrigger className={errors.tipo ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {tiposParceiro.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.tipo && (
              <p className="text-xs text-destructive">Tipo é obrigatório</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cnpj" className="text-sm font-medium">
                CNPJ
              </Label>
              <Input
                id="cnpj"
                placeholder="00.000.000/0000-00"
                {...register('cnpj')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone" className="text-sm font-medium">
                Telefone
              </Label>
              <Input
                id="telefone"
                placeholder="(71) 99999-9999"
                {...register('telefone')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="parceiro@email.com"
              {...register('email')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco" className="text-sm font-medium">
              Endereço
            </Label>
            <Textarea
              id="endereco"
              placeholder="Endereço completo do parceiro"
              {...register('endereco')}
              className="min-h-[80px]"
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
                  Criando...
                </>
              ) : (
                'Criar Parceiro'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

