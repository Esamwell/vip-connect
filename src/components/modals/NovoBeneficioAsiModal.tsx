import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface NovoBeneficioAsiFormData {
  nome: string;
  descricao: string;
}

interface NovoBeneficioAsiModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function NovoBeneficioAsiModal({ open, onOpenChange, onSuccess }: NovoBeneficioAsiModalProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<NovoBeneficioAsiFormData>();
  const { toast } = useToast();

  const onSubmit = async (data: NovoBeneficioAsiFormData) => {
    try {
      await api.post('/beneficios-asi', data);
      
      toast({
        title: 'Sucesso!',
        description: 'Benefício ASI criado com sucesso.',
      });
      
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Erro ao criar benefício ASI.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Benefício ASI</DialogTitle>
          <DialogDescription>
            Crie um novo benefício institucional para os VIPs.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Benefício *</Label>
            <Input
              id="nome"
              placeholder="Ex: Cota ASI Super VIP"
              {...register('nome', { required: 'Nome é obrigatório' })}
              className={errors.nome ? 'border-destructive' : ''}
            />
            {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição (Opcional)</Label>
            <Textarea
              id="descricao"
              placeholder="Descreva o que está incluso no benefício"
              {...register('descricao')}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Criando...' : 'Criar Benefício'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
