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
import { Usuario } from '@/pages/dashboard/Usuarios';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

interface EditarUsuarioFormData {
  nome: string;
  email: string;
  role: string;
  whatsapp?: string;
  ativo: string;
}

interface EditarUsuarioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: Usuario;
  onSuccess: () => void;
}

export function EditarUsuarioModal({ open, onOpenChange, usuario, onSuccess }: EditarUsuarioModalProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch, clearErrors } = useForm<EditarUsuarioFormData>({
    defaultValues: {
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
      whatsapp: usuario.whatsapp,
      ativo: usuario.ativo ? 'true' : 'false'
    }
  });

  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      reset({
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        whatsapp: usuario.whatsapp || '',
        ativo: usuario.ativo ? 'true' : 'false'
      });
    }
  }, [open, usuario, reset]);

  const selectedRole = watch('role');
  const selectedAtivo = watch('ativo');

  const onSubmit = async (data: EditarUsuarioFormData) => {
    try {
      const payload = {
        ...data,
        ativo: data.ativo === 'true'
      };

      await api.patch(`/usuarios/${usuario.id}`, payload);
      
      toast({
        title: 'Sucesso!',
        description: 'Usuário atualizado com sucesso.',
      });
      
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Erro ao atualizar usuário.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>
            Edite as informações e permissões do usuário.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
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
              {...register('email', { required: 'Email é obrigatório' })}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
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
              // Não permitir mudar role do admin_mt a não ser ele mesmo (backend tb protege, mas UX é melhor)
              disabled={usuario.role === 'admin_mt' && user?.role !== 'admin_mt'}
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
            <Label>Status *</Label>
            <Select 
              value={selectedAtivo} 
              onValueChange={(val) => setValue('ativo', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status da conta" />
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
