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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface NovoUsuarioFormData {
  nome: string;
  email: string;
  senha?: string;
  role: string;
  whatsapp?: string;
}

interface NovoUsuarioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function NovoUsuarioModal({ open, onOpenChange, onSuccess }: NovoUsuarioModalProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch, clearErrors } = useForm<NovoUsuarioFormData>({
    defaultValues: {
      role: 'admin_shopping'
    }
  });
  const { toast } = useToast();
  const { user } = useAuth();
  
  const selectedRole = watch('role');

  const onSubmit = async (data: NovoUsuarioFormData) => {
    try {
      if (!data.senha) {
         toast({ title: 'Erro', description: 'A senha é obrigatória', variant: 'destructive' });
         return;
      }
      await api.post('/usuarios', data);
      
      toast({
        title: 'Sucesso!',
        description: 'Usuário criado com sucesso.',
      });
      
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Erro ao criar usuário.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) reset();
      onOpenChange(val);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Novo Usuário</DialogTitle>
          <DialogDescription>
            Adicione um novo usuário ao sistema com permissões administrativas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              placeholder="Digite o nome"
              {...register('nome', { required: 'Nome é obrigatório' })}
              className={errors.nome ? 'border-destructive' : ''}
            />
            {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@email.com"
              {...register('email', { required: 'Email é obrigatório' })}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp (opcional)</Label>
            <Input
              id="whatsapp"
              placeholder="(00) 00000-0000"
              {...register('whatsapp')}
            />
          </div>

          <div className="space-y-2">
            <Label>Nível de Acesso *</Label>
            <Select 
              value={selectedRole} 
              onValueChange={(val) => {
                 setValue('role', val);
                 clearErrors('role');
              }}
            >
              <SelectTrigger className={errors.role ? 'border-destructive' : ''}>
                <SelectValue placeholder="Selecione o acesso" />
              </SelectTrigger>
              <SelectContent>
                {user?.role === 'admin_mt' && (
                  <SelectItem value="admin_mt">Admin MT</SelectItem>
                )}
                <SelectItem value="admin_shopping">Admin</SelectItem>
                <SelectItem value="lojista">Lojista</SelectItem>
                <SelectItem value="parceiro">Parceiro</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">Senha *</Label>
            <Input
              id="senha"
              type="password"
              placeholder="Senha de acesso"
              {...register('senha', { 
                required: 'Senha é obrigatória',
                minLength: { value: 6, message: 'No mínimo 6 caracteres' } 
              })}
              className={errors.senha ? 'border-destructive' : ''}
            />
            {errors.senha && <p className="text-xs text-destructive">{errors.senha.message}</p>}
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
