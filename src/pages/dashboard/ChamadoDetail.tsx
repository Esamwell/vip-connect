import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chamadosService } from '@/services/chamados.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Building, Calendar, MessageSquare, FileText, Wrench, HelpCircle, MessageCircle, Car } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Chamado } from '@/services/chamados.service';

export default function ChamadoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [chamado, setChamado] = useState<(Chamado & { historico?: any[]; cliente_whatsapp?: string; cliente_email?: string; loja_telefone?: string; responsavel_nome?: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (id) {
      loadChamado();
    }
  }, [id]);

  const loadChamado = async () => {
    try {
      setLoading(true);
      const data = await chamadosService.getById(id!);
      setChamado(data);
      setStatus(data.status);
    } catch (error: any) {
      console.error('Erro ao carregar chamado:', error);
      toast({
        title: 'Erro ao carregar chamado',
        description: error.message || 'Tente novamente mais tarde',
        variant: 'destructive',
      });
      navigate('/dashboard/chamados');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!chamado || !id) return;

    setUpdating(true);
    try {
      const updateData: any = { status };
      if (observacoes.trim()) {
        updateData.observacoes_resolucao = observacoes.trim();
      }

      await chamadosService.update(id, updateData);
      
      toast({
        title: 'Chamado atualizado com sucesso!',
        description: 'O status do chamado foi atualizado.',
      });
      
      loadChamado();
      setObservacoes('');
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar chamado',
        description: error.message || 'Tente novamente mais tarde',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      aberto: 'destructive',
      em_andamento: 'default',
      resolvido: 'secondary',
      cancelado: 'outline',
    };
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status === 'em_andamento' ? 'Em Andamento' : 
         status === 'aberto' ? 'Aberto' :
         status === 'resolvido' ? 'Resolvido' : 'Cancelado'}
      </Badge>
    );
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      documentacao: 'Documentação',
      ajuste_pos_venda: 'Ajuste Pós-Venda',
      problema_loja: 'Problema com Loja',
      duvidas_gerais: 'Dúvidas Gerais',
    };
    return labels[tipo] || tipo;
  };

  const getTipoIcon = (tipo: string) => {
    const icons: Record<string, any> = {
      documentacao: FileText,
      ajuste_pos_venda: Wrench,
      problema_loja: MessageCircle,
      duvidas_gerais: HelpCircle,
    };
    return icons[tipo] || MessageSquare;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!chamado) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Chamado não encontrado</p>
        <Button onClick={() => navigate('/dashboard/chamados')} className="mt-4">
          Voltar para Chamados
        </Button>
      </div>
    );
  }

  const TipoIcon = getTipoIcon(chamado.tipo);

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/chamados')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-[-0.03em]">Detalhes do Chamado</h1>
          <p className="text-muted-foreground text-[15px] leading-relaxed">
            Visualize e gerencie os detalhes do chamado
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TipoIcon className="w-5 h-5" />
              {chamado.titulo}
            </CardTitle>
            <CardDescription>
              {getTipoLabel(chamado.tipo)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              {getStatusBadge(chamado.status)}
            </div>
            
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{(chamado as any).cliente_nome || 'N/A'}</p>
                {chamado.cliente_whatsapp && (
                  <p className="text-xs text-muted-foreground">WhatsApp: {chamado.cliente_whatsapp}</p>
                )}
                {chamado.cliente_email && (
                  <p className="text-xs text-muted-foreground">Email: {chamado.cliente_email}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{(chamado as any).loja_nome || 'N/A'}</p>
                {chamado.loja_telefone && (
                  <p className="text-xs text-muted-foreground">Telefone: {chamado.loja_telefone}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  Criado em: {format(new Date(chamado.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </p>
                {chamado.data_resolucao && (
                  <p className="text-xs text-muted-foreground">
                    Resolvido em: {format(new Date(chamado.data_resolucao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                )}
              </div>
            </div>

            {chamado.responsavel_nome && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm">
                  <span className="text-muted-foreground">Responsável: </span>
                  {chamado.responsavel_nome}
                </p>
              </div>
            )}

            {chamado.veiculo_marca && chamado.veiculo_modelo && (
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm">
                  <span className="text-muted-foreground">Veículo: </span>
                  <strong>
                    {chamado.veiculo_marca} {chamado.veiculo_modelo}
                    {chamado.veiculo_ano && ` (${chamado.veiculo_ano})`}
                    {chamado.veiculo_placa && ` - ${chamado.veiculo_placa.toUpperCase()}`}
                  </strong>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Descrição</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{chamado.descricao}</p>
            
            {chamado.observacoes_resolucao && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">Observações de Resolução</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {chamado.observacoes_resolucao}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Atualizar Chamado</CardTitle>
          <CardDescription>
            Altere o status e adicione observações de resolução
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aberto">Aberto</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="resolvido">Resolvido</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Observações de Resolução</label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Adicione observações sobre a resolução do chamado..."
              rows={4}
            />
          </div>

          <Button onClick={handleUpdate} disabled={updating || status === chamado.status && !observacoes.trim()}>
            {updating ? 'Atualizando...' : 'Atualizar Chamado'}
          </Button>
        </CardContent>
      </Card>

      {chamado.historico && chamado.historico.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico</CardTitle>
            <CardDescription>
              Histórico de alterações do chamado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {chamado.historico.map((item: any) => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.acao}</p>
                    {item.status_anterior && item.status_novo && (
                      <p className="text-xs text-muted-foreground">
                        {item.status_anterior} → {item.status_novo}
                      </p>
                    )}
                    {item.observacao && (
                      <p className="text-xs text-muted-foreground mt-1">{item.observacao}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      {item.usuario_nome && ` • por ${item.usuario_nome}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

