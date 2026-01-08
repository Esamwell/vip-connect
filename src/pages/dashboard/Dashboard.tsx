import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/cards/StatCard';
import { AnalyticsCard } from '@/components/cards/AnalyticsCard';
import { Users, Store, MessageSquare, TrendingUp, Calendar, Gift, Trophy, Activity } from 'lucide-react';
import { api } from '@/services/api';

interface DashboardStats {
  totalClientes: number;
  totalLojas: number;
  chamadosAbertos: number;
  clientesVencendo: number;
  renovacoesMes: number;
  beneficiosUsados: number;
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
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Carregar estatísticas baseadas no role
      const [clientes, chamados, vencimentos, renovacoes] = await Promise.all([
        api.get('/clientes-vip').catch(() => ({ data: [] })),
        api.get('/chamados?status=aberto').catch(() => ({ data: [] })),
        api.get('/relatorios/clientes-vencimento-proximo').catch(() => ({ data: [] })),
        api.get('/relatorios/clientes-renovados?mes=' + new Date().getMonth() + 1).catch(() => ({ data: [] })),
      ]);

      setStats({
        totalClientes: clientes.data?.length || 0,
        totalLojas: 0, // Será implementado quando tiver rota de lojas
        chamadosAbertos: chamados.data?.length || 0,
        clientesVencendo: vencimentos.data?.length || 0,
        renovacoesMes: renovacoes.data?.length || 0,
        beneficiosUsados: 0, // Será implementado quando tiver rota de benefícios
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
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

  // Calcular crescimento percentual (simulado para demonstração)
  const crescimentoClientes = stats.totalClientes > 0 ? Math.floor(Math.random() * 20) + 5 : 0;
  const crescimentoRenovacoes = stats.renovacoesMes > 0 ? Math.floor(Math.random() * 30) + 10 : 0;

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
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Novo cliente VIP cadastrado</p>
                <p className="text-xs text-muted-foreground">Há 2 horas</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">VIP renovado com sucesso</p>
                <p className="text-xs text-muted-foreground">Há 5 horas</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                <Gift className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Benefício validado</p>
                <p className="text-xs text-muted-foreground">Há 1 dia</p>
              </div>
            </div>
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
