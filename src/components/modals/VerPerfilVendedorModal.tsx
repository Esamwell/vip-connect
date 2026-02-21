import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Mail,
  Phone,
  Hash,
  Store,
  Percent,
  Target,
  DollarSign,
  Calendar,
  Users,
  Gift,
  Star,
  TrendingUp,
  Award,
  Loader2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendedorId: string;
  vendedorNome: string;
}

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
  loja_id: string;
  loja_nome: string;
  data_contratacao?: string;
}

interface ClienteVip {
  id: string;
  nome: string;
  whatsapp: string;
  email?: string;
  status: string;
  data_venda: string;
  data_ativacao: string;
  data_validade: string;
  veiculo_marca?: string;
  veiculo_modelo?: string;
  veiculo_ano?: number;
  veiculo_placa?: string;
}

interface Beneficio {
  id: string;
  nome: string;
  descricao?: string;
  tipo: string;
  valor?: number;
  status: string;
  data_inicio?: string;
  data_fim?: string;
}

interface Estatisticas {
  total_clientes: number;
  clientes_ativos: number;
  total_vendas: number;
  valor_total_vendas: number;
  total_avaliacoes: number;
  nota_media: number;
  vouchers_disponiveis: number;
  vouchers_resgatados: number;
  premiacoes_recebidas: number;
}

export function VerPerfilVendedorModal({ open, onOpenChange, vendedorId, vendedorNome }: Props) {
  const [activeTab, setActiveTab] = useState('perfil');

  const { data: perfil, isLoading: loadingPerfil } = useQuery<VendedorPerfil>({
    queryKey: ['vendedor-perfil-detalhes', vendedorId],
    queryFn: () => api.get<VendedorPerfil>(`/vendedores/${vendedorId}`),
    enabled: open && !!vendedorId,
  });

  const { data: clientes = [], isLoading: loadingClientes } = useQuery<ClienteVip[]>({
    queryKey: ['vendedor-clientes', vendedorId],
    queryFn: () => api.get<ClienteVip[]>(`/clientes-vip/vendedor/${vendedorId}`),
    enabled: open && !!vendedorId,
  });

  const { data: beneficios = [], isLoading: loadingBeneficios } = useQuery<Beneficio[]>({
    queryKey: ['vendedor-beneficios', vendedorId],
    queryFn: () => api.get<Beneficio[]>(`/beneficios/vendedor/${vendedorId}`),
    enabled: open && !!vendedorId,
  });

  const { data: estatisticas, isLoading: loadingEstatisticas } = useQuery<Estatisticas>({
    queryKey: ['vendedor-estatisticas-completas', vendedorId],
    queryFn: () => api.get<Estatisticas>(`/vendedores/${vendedorId}/estatisticas-completas`),
    enabled: open && !!vendedorId,
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      ativo: 'bg-green-100 text-green-800',
      inativo: 'bg-gray-100 text-gray-800',
      vencido: 'bg-red-100 text-red-800',
      renovado: 'bg-blue-100 text-blue-800',
      cancelado: 'bg-orange-100 text-orange-800',
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  };

  const isLoading = loadingPerfil || loadingClientes || loadingBeneficios || loadingEstatisticas;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <User className="w-5 h-5" />
            Perfil do Vendedor: {vendedorNome}
          </DialogTitle>
          <DialogDescription>
            Visualize informações detalhadas, clientes, benefícios e estatísticas do vendedor.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="perfil">Perfil</TabsTrigger>
            <TabsTrigger value="clientes">
              Clientes
              {clientes.length > 0 && (
                <Badge className="ml-1 bg-primary text-primary-foreground">
                  {clientes.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="beneficios">
              Benefícios
              {beneficios.length > 0 && (
                <Badge className="ml-1 bg-primary text-primary-foreground">
                  {beneficios.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="estatisticas">Estatísticas</TabsTrigger>
          </TabsList>

          {/* Aba Perfil */}
          <TabsContent value="perfil" className="mt-4">
            {loadingPerfil ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : perfil ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações Pessoais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Nome</p>
                          <p className="font-medium">{perfil.nome}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Hash className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Código</p>
                          <p className="font-mono font-medium">{perfil.codigo_vendedor}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{perfil.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">WhatsApp</p>
                          <p className="font-medium">{perfil.whatsapp || perfil.user_whatsapp || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Store className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Loja</p>
                          <p className="font-medium">{perfil.loja_nome}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Contratação</p>
                          <p className="font-medium">
                            {perfil.data_contratacao ? formatDate(perfil.data_contratacao) : '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={perfil.ativo ? 'default' : 'secondary'}>
                        {perfil.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Comissões e Metas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Percent className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Comissão Padrão</p>
                          <p className="font-medium">{perfil.comissao_padrao}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Target className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Meta de Vendas</p>
                          <p className="font-medium">{perfil.meta_vendas} vendas</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Meta de Valor</p>
                          <p className="font-medium">
                            R$ {Number(perfil.meta_vendas_valor).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <User className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Perfil não encontrado</p>
              </div>
            )}
          </TabsContent>

          {/* Aba Clientes */}
          <TabsContent value="clientes" className="mt-4">
            {loadingClientes ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : clientes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Nenhum cliente encontrado</p>
                <p className="text-sm mt-1">Este vendedor ainda não possui clientes VIP cadastrados.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {clientes.map((cliente) => (
                  <Card key={cliente.id}>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold truncate">{cliente.nome}</span>
                            <Badge className={getStatusBadge(cliente.status)}>
                              {cliente.status}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {cliente.whatsapp}
                            </span>
                            {cliente.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {cliente.email}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Venda: {formatDate(cliente.data_venda)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Validade: {formatDate(cliente.data_validade)}
                            </span>
                          </div>

                          {(cliente.veiculo_marca || cliente.veiculo_placa) && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              {cliente.veiculo_marca && cliente.veiculo_modelo && (
                                <span>{cliente.veiculo_marca} {cliente.veiculo_modelo}</span>
                              )}
                              {cliente.veiculo_placa && (
                                <span className="ml-2 font-mono">{cliente.veiculo_placa}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Aba Benefícios */}
          <TabsContent value="beneficios" className="mt-4">
            {loadingBeneficios ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : beneficios.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Gift className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Nenhum benefício encontrado</p>
                <p className="text-sm mt-1">Este vendedor ainda não possui benefícios cadastrados.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {beneficios.map((beneficio) => (
                  <Card key={beneficio.id}>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold truncate">{beneficio.nome}</span>
                            <Badge className={getStatusBadge(beneficio.status)}>
                              {beneficio.status}
                            </Badge>
                            {beneficio.valor && (
                              <span className="font-medium text-green-700 text-sm">
                                R$ {Number(beneficio.valor).toFixed(2)}
                              </span>
                            )}
                          </div>

                          {beneficio.descricao && (
                            <p className="text-sm text-muted-foreground mt-1">{beneficio.descricao}</p>
                          )}

                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {beneficio.data_inicio ? `De ${formatDate(beneficio.data_inicio)}` : 'Sem início'}
                            </span>
                            {beneficio.data_fim && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Até {formatDate(beneficio.data_fim)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Aba Estatísticas */}
          <TabsContent value="estatisticas" className="mt-4">
            {loadingEstatisticas ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : estatisticas ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{estatisticas.total_clientes}</p>
                        <p className="text-sm text-muted-foreground">Total de Clientes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{estatisticas.clientes_ativos}</p>
                        <p className="text-sm text-muted-foreground">Clientes Ativos</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{estatisticas.total_vendas}</p>
                        <p className="text-sm text-muted-foreground">Total de Vendas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          R$ {Number(estatisticas.valor_total_vendas).toLocaleString('pt-BR')}
                        </p>
                        <p className="text-sm text-muted-foreground">Valor Total</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <Star className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{estatisticas.total_avaliacoes}</p>
                        <p className="text-sm text-muted-foreground">Total de Avaliações</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
                        <Star className="w-5 h-5 text-teal-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {estatisticas.nota_media ? estatisticas.nota_media.toFixed(1) : '-'}
                        </p>
                        <p className="text-sm text-muted-foreground">Nota Média</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
                        <Gift className="w-5 h-5 text-pink-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{estatisticas.vouchers_disponiveis}</p>
                        <p className="text-sm text-muted-foreground">Vouchers Disponíveis</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <Gift className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{estatisticas.vouchers_resgatados}</p>
                        <p className="text-sm text-muted-foreground">Vouchers Resgatados</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Award className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{estatisticas.premiacoes_recebidas}</p>
                        <p className="text-sm text-muted-foreground">Premiações Recebidas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Estatísticas não disponíveis</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
