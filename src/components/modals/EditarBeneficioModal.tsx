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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

interface Beneficio {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
}

interface EditarBeneficioFormData {
  nome: string;
  descricao: string;
  ativo: string;
}

interface EditarBeneficioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  beneficio: Beneficio | null;
  onSuccess: () => void;
  tipo: 'oficial' | 'loja';
}

export function EditarBeneficioModal({ open, onOpenChange, beneficio, onSuccess, tipo }: EditarBeneficioModalProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = useForm<EditarBeneficioFormData>();
  const { toast } = useToast();

  useEffect(() => {
    if (open && beneficio) {
      reset({
        nome: beneficio.nome,
        descricao: beneficio.descricao || '',
        ativo: beneficio.ativo ? 'true' : 'false',
      });
      setValue('ativo', beneficio.ativo ? 'true' : 'false');
    }
  }, [open, beneficio, reset, setValue]);

  const selectedAtivo = watch('ativo');

  const onSubmit = async (data: EditarBeneficioFormData) => {
    if (!beneficio) return;
    
    try {
      const endpoint = tipo === 'oficial' ? `/beneficios/oficiais/${beneficio.id}` : `/beneficios/loja/${beneficio.id}`;
      
      const payload = {
        nome: data.nome,
        descricao: data.descricao,
        ativo: data.ativo === 'true'
      };

      await api.put(endpoint, payload);
      
      toast({
        title: 'Sucesso!',
        description: 'Benefício atualizado com sucesso.',
      });
      
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Erro ao atualizar benefício.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Benefício</DialogTitle>
          <DialogDescription>
            Atualize as informações do benefício selecionado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Benefício *</Label>
            <Input
              id="nome"
              placeholder="Ex: Lavagem VIP"
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

          <div className="space-y-2">
            <Label>Status *</Label>
            <Select 
              value={selectedAtivo} 
              onValueChange={(val) => setValue('ativo', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status do benefício" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Ativo</SelectItem>
                <SelectItem value="false">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
