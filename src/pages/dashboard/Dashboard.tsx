import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/cards/StatCard';
import { AnalyticsCard } from '@/components/cards/AnalyticsCard';
import { Users, Store, MessageSquare, TrendingUp, Calendar, Gift, Trophy, Activity } from 'lucide-react';
import { api } from '@/services/api';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

interface DashboardStats {
  totalClientes: number;
  totalLojas: number;
  chamadosAbertos: number;
  clientesVencendo: number;
  renovacoesMes: number;
  beneficiosUsados: number;
  crescimentoClientes: number;
  crescimentoRenovacoes: number;
}

interface AtividadeRecente {
  id: string;
  tipo: 'cliente_cadastrado' | 'vip_renovado' | 'beneficio_validado' | 'beneficio_resgatado';
  titulo: string;
  descricao: string;
  data: string;
  loja_nome?: string;
  parceiro_nome?: string;
  resgatado_por_nome?: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalClientes: 0,
    totalLojas: 0,
    chamadosAbertos: 0,
    clientesVencendo: 0,
    renovacoesMes: 0,
    beneficiosUsados: 0,
    crescimentoClientes: 0,
    crescimentoRenovacoes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [atividadesRecentes, setAtividadesRecentes] = useState<AtividadeRecente[]>([]);

  useEffect(() => {
    loadStats();
    loadAtividadesRecentes();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Carregar estatísticas do dashboard
      const data = await api.get<DashboardStats>('/dashboard/stats');
      
      console.log('[Dashboard] Resposta da API:', data);
      
      if (data) {
        setStats({
          totalClientes: data.totalClientes || 0,
          totalLojas: data.totalLojas || 0,
          chamadosAbertos: data.chamadosAbertos || 0,
          clientesVencendo: data.clientesVencendo || 0,
          renovacoesMes: data.renovacoesMes || 0,
          beneficiosUsados: data.beneficiosUsados || 0,
          crescimentoClientes: data.crescimentoClientes || 0,
          crescimentoRenovacoes: data.crescimentoRenovacoes || 0,
        });
      }
    } catch (error: any) {
      console.error('Erro ao carregar estatísticas:', error);
      console.error('Detalhes do erro:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAtividadesRecentes = async () => {
    try {
      const atividades = await api.get<AtividadeRecente[]>('/dashboard/atividades-recentes');
      setAtividadesRecentes(atividades || []);
    } catch (error: any) {
      console.error('Erro ao carregar atividades recentes:', error);
    }
  };

  const getAtividadeIcon = (tipo: string) => {
    switch (tipo) {
      case 'cliente_cadastrado':
        return Users;
      case 'vip_renovado':
        return TrendingUp;
      case 'beneficio_validado':
        return Gift;
      case 'beneficio_resgatado':
        return Gift;
      default:
        return Activity;
    }
  };

  const getAtividadeIconColor = (tipo: string) => {
    switch (tipo) {
      case 'cliente_cadastrado':
        return 'bg-primary/10 text-primary';
      case 'vip_renovado':
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      case 'beneficio_validado':
        return 'bg-accent/10 text-accent';
      case 'beneficio_resgatado':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatarTempoRelativo = (data: string) => {
    try {
      return formatDistanceToNow(new Date(data), {
        addSuffix: true,
        locale: ptBR,
      }).replace('há ', 'Há ');
    } catch {
      return 'Data inválida';
    }
  };

  const getRoleTitle = () => {
    switch (user?.role) {
      case 'admin_mt':
        return 'Admin MT - Visão Geral';
      case 'admin_shopping':
        return 'Admin Shopping - Visão Geral';
      case 'lojista':
        return 'Minha Loja - Visão Geral';
      default:
        return 'Dashboard';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Usar crescimento vindo do backend
  const crescimentoClientes = stats.crescimentoClientes;
  const crescimentoRenovacoes = stats.crescimentoRenovacoes;

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="space-y-3 mb-2">
        <h1 className="text-3xl font-bold tracking-[-0.03em]">{getRoleTitle()}</h1>
        <p className="text-muted-foreground text-[15px] leading-relaxed">
          Bem-vindo, {user?.nome}! Aqui está um resumo do sistema.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          title="Clientes VIP"
          value={stats.totalClientes.toLocaleString('pt-BR')}
          subtitle="Total de clientes cadastrados"
          icon={Users}
          iconColor="primary"
          trend={{
            value: crescimentoClientes,
            label: 'vs mês anterior',
            isPositive: true,
          }}
        />

        {(user?.role === 'admin_mt' || user?.role === 'admin_shopping') && (
          <StatCard
            title="Lojas"
            value={stats.totalLojas.toLocaleString('pt-BR')}
            subtitle="Lojas cadastradas no sistema"
            icon={Store}
            iconColor="info"
          />
        )}

        <StatCard
          title="Chamados Abertos"
          value={stats.chamadosAbertos.toLocaleString('pt-BR')}
          subtitle="Requerem atenção imediata"
          icon={MessageSquare}
          iconColor={stats.chamadosAbertos > 0 ? 'danger' : 'success'}
        />

        <StatCard
          title="Vencendo em 30 dias"
          value={stats.clientesVencendo.toLocaleString('pt-BR')}
          subtitle="Clientes próximos do vencimento"
          icon={Calendar}
          iconColor="warning"
        />

        <StatCard
          title="Renovações este mês"
          value={stats.renovacoesMes.toLocaleString('pt-BR')}
          subtitle="VIPs renovados"
          icon={TrendingUp}
          iconColor="success"
          trend={{
            value: crescimentoRenovacoes,
            label: 'vs mês anterior',
            isPositive: true,
          }}
        />

        <StatCard
          title="Benefícios Usados"
          value={stats.beneficiosUsados.toLocaleString('pt-BR')}
          subtitle="Validações realizadas"
          icon={Gift}
          iconColor="accent"
        />
      </div>

      {/* Analytics Cards - Largura completa */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        <AnalyticsCard
          title="Performance do Sistema"
          subtitle="Resumo geral das operações"
          className="md:col-span-2 lg:col-span-2"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Clientes</p>
                <p className="text-lg font-semibold">{stats.totalClientes}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Renovações</p>
                <p className="text-lg font-semibold">{stats.renovacoesMes}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vencendo</p>
                <p className="text-lg font-semibold">{stats.clientesVencendo}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Chamados</p>
                <p className="text-lg font-semibold">{stats.chamadosAbertos}</p>
              </div>
            </div>
          </div>
        </AnalyticsCard>

        <AnalyticsCard
          title="Atividade Recente"
          subtitle="Últimas ações do sistema"
        >
          <div className="space-y-4">
            {atividadesRecentes.length > 0 ? (
              atividadesRecentes.map((atividade, index) => {
                const Icon = getAtividadeIcon(atividade.tipo);
                const iconColor = getAtividadeIconColor(atividade.tipo);
                return (
                  <div key={`${atividade.tipo}-${atividade.id}-${index}`} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${iconColor} flex items-center justify-center flex-shrink-0`}>
                      {Icon && <Icon className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{atividade.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatarTempoRelativo(atividade.data)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma atividade recente
              </p>
            )}
          </div>
        </AnalyticsCard>

        <AnalyticsCard
          title="Status do Sistema"
          subtitle="Visão geral rápida"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium">Sistema Operacional</span>
              </div>
              <span className="text-xs text-muted-foreground">100%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span className="text-sm font-medium">Taxa de Renovação</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {stats.totalClientes > 0
                  ? ((stats.renovacoesMes / stats.totalClientes) * 100).toFixed(1)
                  : 0}
                %
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-sm font-medium">Atenção Necessária</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {stats.chamadosAbertos + stats.clientesVencendo}
              </span>
            </div>
          </div>
        </AnalyticsCard>
      </div>
    </div>
  );
}
