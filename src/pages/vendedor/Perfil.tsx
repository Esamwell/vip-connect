import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Phone, Hash, Store, Percent, Target, DollarSign, KeyRound, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';

interface VendedorPerfil {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  whatsapp?: string;
  user_whatsapp?: string;
  codigo_vendedor: string;
  comissao_padrao: number;
  meta_vendas: number;
  meta_vendas_valor: number;
  ativo: boolean;
  loja_nome?: string;
  data_contratacao?: string;
}

export default function VendedorPerfil() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [alterandoSenha, setAlterandoSenha] = useState(false);

  const { data: perfil, isLoading } = useQuery<VendedorPerfil>({
    queryKey: ['vendedor-perfil'],
    queryFn: async () => {
      return api.get<VendedorPerfil>('/vendedores/meu-perfil');
    },
  });

  const handleAlterarSenha = async (e: React.FormEvent) => {
    e.preventDefault();

    if (novaSenha !== confirmarSenha) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem.',
        variant: 'destructive',
      });
      return;
    }

    if (novaSenha.length < 6) {
      toast({
        title: 'Erro',
        description: 'A nova senha deve ter no mínimo 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setAlterandoSenha(true);
      await api.patch(`/vendedores/${perfil?.id}/senha`, { novaSenha });

      toast({
        title: 'Sucesso!',
        description: 'Senha alterada com sucesso.',
      });
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao alterar senha.',
        variant: 'destructive',
      });
    } finally {
      setAlterandoSenha(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground mt-2">
          Visualize seus dados e altere sua senha.
        </p>
      </div>

      {/* Dados Pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{perfil?.nome || user?.nome || '-'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{perfil?.email || user?.email || '-'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">WhatsApp</p>
                <p className="font-medium">{perfil?.whatsapp || perfil?.user_whatsapp || '-'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Código do Vendedor</p>
                <Badge variant="outline" className="font-mono mt-1">
                  {perfil?.codigo_vendedor || '-'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados da Loja e Metas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Loja
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Loja vinculada</p>
              <p className="font-medium text-lg">{perfil?.loja_nome || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={perfil?.ativo ? 'default' : 'secondary'} className="mt-1">
                {perfil?.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            {perfil?.data_contratacao && (
              <div>
                <p className="text-sm text-muted-foreground">Data de Contratação</p>
                <p className="font-medium">
                  {new Date(perfil.data_contratacao).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Metas e Comissão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Percent className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Comissão Padrão</p>
                <p className="font-medium">{perfil?.comissao_padrao || 0}%</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Target className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Meta de Vendas (quantidade)</p>
                <p className="font-medium">{perfil?.meta_vendas || 0} vendas</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Meta de Valor</p>
                <p className="font-medium">
                  R$ {(perfil?.meta_vendas_valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alterar Senha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Alterar Senha
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAlterarSenha} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="nova-senha">Nova Senha</Label>
              <Input
                id="nova-senha"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmar-senha">Confirmar Nova Senha</Label>
              <Input
                id="confirmar-senha"
                type="password"
                placeholder="Repita a nova senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" disabled={alterandoSenha}>
              {alterandoSenha ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Alterando...
                </>
              ) : (
                'Alterar Senha'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
