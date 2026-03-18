import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { BeneficioAsi } from '@/pages/dashboard/BeneficiosASI';
import { ClienteVip } from '@/services/clientes.service';

interface VincularBeneficioAsiFormData {
  beneficio_asi_id: string;
}

interface VincularBeneficioAsiModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente: ClienteVip | null;
  onSuccess: () => void;
}

export function VincularBeneficioAsiModal({ open, onOpenChange, cliente, onSuccess }: VincularBeneficioAsiModalProps) {
  const [beneficiosDisponiveis, setBeneficiosDisponiveis] = useState<BeneficioAsi[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch, clearErrors } = useForm<VincularBeneficioAsiFormData>();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadBeneficiosAsi();
      reset();
    }
  }, [open, reset]);

  const loadBeneficiosAsi = async () => {
    try {
      setLoading(true);
      const data = await api.get<BeneficioAsi[]>('/beneficios-asi');
      setBeneficiosDisponiveis(Array.isArray(data) ? data.filter(b => b.ativo) : []);
    } catch (error) {
      console.error('Erro ao buscar benefícios ASI:', error);
      toast({
        title: 'Erro de Comunicação',
        description: 'Não foi possível listar os Benefícios ASI disponíveis.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedBeneficio = watch('beneficio_asi_id');

  const onSubmit = async (data: VincularBeneficioAsiFormData) => {
    if (!cliente) return;
    
    try {
      const payload = {
        cliente_vip_id: cliente.id,
        beneficio_asi_id: data.beneficio_asi_id,
      };

      await api.post('/beneficios-asi/vincular', payload);
      
      toast({
        title: 'Sucesso!',
        description: 'Benefício ASI vinculado com sucesso a este cliente.',
      });
      
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Erro ao vincular benefício. O cliente já pode possuí-lo.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Vincular Benefício ASI</DialogTitle>
          <DialogDescription>
            Conceda um benefício extra para o(a) cliente <span className="font-semibold text-foreground">{cliente?.nome || 'Selecionado'}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Selecione o Benefício ASI *</Label>
            <Select 
              value={selectedBeneficio} 
              onValueChange={(val) => {
                setValue('beneficio_asi_id', val);
                clearErrors('beneficio_asi_id');
              }}
              disabled={loading}
            >
              <SelectTrigger className={errors.beneficio_asi_id ? 'border-destructive' : ''}>
                <SelectValue placeholder={loading ? 'Carregando opções...' : 'Selecione um benefício'} />
              </SelectTrigger>
              <SelectContent>
                {beneficiosDisponiveis.length === 0 ? (
                   <SelectItem value="none" disabled>Nenhum benefício ativo encontrado</SelectItem>
                ) : (
                  beneficiosDisponiveis.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {/* O react-hook-form check para required com inputs hidden */}
            <input type="hidden" {...register('beneficio_asi_id', { required: 'Selecione um benefício' })} />
            {errors.beneficio_asi_id && <p className="text-xs text-destructive">{errors.beneficio_asi_id.message}</p>}
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
            <Button type="submit" disabled={isSubmitting || beneficiosDisponiveis.length === 0}>
              {isSubmitting ? 'Vinculando...' : 'Vincular'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
