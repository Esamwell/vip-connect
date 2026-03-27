import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, Save, Loader2, AlertTriangle } from 'lucide-react';
import { api } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const PERMISSIONS = [
  { id: 'gestao:clientes', label: 'Gerenciar Clientes VIP', section: 'Gestão' },
  { id: 'gestao:lojas', label: 'Criar/Editar Lojas', section: 'Gestão' },
  { id: 'gestao:parceiros', label: 'Gerenciar Parceiros', section: 'Gestão' },
  { id: 'gestao:vendedores', label: 'Gerenciar Vendedores', section: 'Gestão' },
  { id: 'gestao:beneficios', label: 'Gerenciar Benefícios', section: 'Gestão' },
  { id: 'gestao:beneficios-asi', label: 'Gerenciar Benefícios ASI', section: 'Gestão' },
  { id: 'atendimento:chamados', label: 'Ver/Responder Chamados', section: 'Atendimento' },
  { id: 'atendimento:renovacoes', label: 'Gerenciar Renovações', section: 'Atendimento' },
  { id: 'analise:ranking', label: 'Ver Ranking', section: 'Análise' },
  { id: 'analise:relatorios', label: 'Ver Relatórios', section: 'Análise' },
  { id: 'sistema:usuarios', label: 'Gerenciar Usuários', section: 'Sistema' },
  { id: 'sistema:configuracoes', label: 'Configurações do Sistema', section: 'Sistema' },
  { id: 'sistema:permissoes', label: 'Gerenciar Permissões', section: 'Sistema' },
];

const ROLES = [
  { id: 'admin_mt', label: 'Admin MT' },
  { id: 'admin_shopping', label: 'Admin Shopping' },
  { id: 'lojista', label: 'Lojista' },
  { id: 'parceiro', label: 'Parceiro' },
  { id: 'vendedor', label: 'Vendedor' },
];

export default function Permissoes() {
  const [permissionsByRole, setPermissionsByRole] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const data = await api.get<Record<string, string[]>>('/permissoes');
      setPermissionsByRole(data || {});
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as permissões. Verifique se a tabela existe no banco.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (roleId: string, permissionId: string) => {
    setPermissionsByRole(prev => {
      const current = prev[roleId] || [];
      const updated = current.includes(permissionId)
        ? current.filter(p => p !== permissionId)
        : [...current, permissionId];
      return { ...prev, [roleId]: updated };
    });
  };

  const handleSave = async (roleId: string) => {
    try {
      setSaving(roleId);
      await api.post('/permissoes/update', {
        role: roleId,
        permissions: permissionsByRole[roleId] || [],
      });
      toast({
        title: 'Sucesso!',
        description: `Permissões para ${roleId} atualizadas.`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar permissões.',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Permissões</h1>
        <p className="text-muted-foreground text-lg mt-1">
          Gerencie o que cada tipo de usuário pode acessar e realizar no sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {ROLES.map((role) => (
          <motion.div
            key={role.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    {role.label}
                  </CardTitle>
                  <CardDescription>
                    Configure as permissões de acesso para o perfil {role.label}
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => handleSave(role.id)} 
                  disabled={saving === role.id}
                  variant="vip"
                  size="sm"
                >
                  {saving === role.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Salvar Alterações
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {['Gestão', 'Atendimento', 'Análise', 'Sistema'].map(section => (
                    <div key={section} className="space-y-3">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider border-b pb-1">
                        {section}
                      </h3>
                      {PERMISSIONS.filter(p => p.section === section).map((perm) => (
                        <div key={perm.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`${role.id}-${perm.id}`} 
                            checked={(permissionsByRole[role.id] || []).includes(perm.id)}
                            onCheckedChange={() => togglePermission(role.id, perm.id)}
                          />
                          <label
                            htmlFor={`${role.id}-${perm.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {perm.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
        <p className="text-sm text-amber-800 dark:text-amber-300">
          <strong>Atenção:</strong> Alterar as permissões afeta imediatamente o que os usuários veem no menu lateral. 
          Certifique-se de não remover o acesso do Admin MT à página de Permissões!
        </p>
      </div>
    </div>
  );
}
