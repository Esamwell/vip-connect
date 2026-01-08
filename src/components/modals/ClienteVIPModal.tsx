import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/services/api';
import { ClienteVip } from '@/services/clientes.service';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Crown, Calendar, Clock, Gift, CheckCircle2, Car } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '@/hooks/use-toast';

interface ClienteVIPModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clienteId: string | null;
}

interface BeneficioDisponivel {
  id: string;
  nome: string;
  descricao?: string;
  tipo: 'oficial' | 'loja';
  parceiro_nome?: string;
  loja_nome?: string;
  ativo: boolean;
}

interface ValidacaoBeneficio {
  id: string;
  beneficio_nome: string;
  parceiro_nome: string;
  data_validacao: string;
  tipo: 'oficial' | 'loja';
}

export function ClienteVIPModal({ open, onOpenChange, clienteId }: ClienteVIPModalProps) {
  const [cliente, setCliente] = useState<ClienteVip | null>(null);
  const [beneficiosDisponiveis, setBeneficiosDisponiveis] = useState<BeneficioDisponivel[]>([]);
  const [validacoes, setValidacoes] = useState<ValidacaoBeneficio[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && clienteId) {
      loadClienteData();
    } else {
      setCliente(null);
      setBeneficiosDisponiveis([]);
      setValidacoes([]);
    }
  }, [open, clienteId]);

  const loadClienteData = async () => {
    if (!clienteId) return;

    try {
      setLoading(true);
      
      // Buscar cliente primeiro
      let clienteData: ClienteVip;
      try {
        clienteData = await api.get<ClienteVip>(`/clientes-vip/${clienteId}`);
        setCliente(clienteData);
      } catch (error: any) {
        console.error('Erro ao carregar cliente:', error);
        toast({
          title: 'Erro',
          description: error.message || 'Não foi possível carregar os dados do cliente.',
          variant: 'destructive',
        });
        setCliente(null);
        return;
      }

      // Buscar benefícios e validações em paralelo (não críticos)
      const [beneficiosData, validacoesData] = await Promise.all([
        api.get<BeneficioDisponivel[]>(`/clientes-vip/${clienteId}/beneficios`).catch((err) => {
          console.warn('Erro ao carregar benefícios:', err);
          return [];
        }),
        api.get<ValidacaoBeneficio[]>(`/clientes-vip/${clienteId}/validacoes`).catch((err) => {
          console.warn('Erro ao carregar validações:', err);
          return [];
        }),
      ]);

      setBeneficiosDisponiveis(Array.isArray(beneficiosData) ? beneficiosData : []);
      setValidacoes(Array.isArray(validacoesData) ? validacoesData : []);
    } catch (error: any) {
      console.error('Erro ao carregar dados do cliente:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível carregar os dados do cliente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'bg-green-500';
      case 'vencido':
        return 'bg-red-500';
      case 'renovado':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (!cliente) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cliente não encontrado</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  const formatarData = (data: string) => {
    return format(new Date(data), 'dd/MM/yyyy', { locale: ptBR });
  };

  const gerarIdVisual = (id: string) => {
    // Pegar últimos caracteres do UUID para criar um ID visual
    const partes = id.split('-');
    const ano = new Date().getFullYear();
    const numero = partes[0].substring(0, 5).toUpperCase();
    return `VIP-${ano}-${numero}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight">
            Cartão VIP - {cliente.nome}
          </DialogTitle>
          <DialogDescription className="text-[15px] leading-relaxed">
            Visualize o cartão do cliente e gerencie os benefícios disponíveis.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="cartao" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cartao">Cartão VIP</TabsTrigger>
            <TabsTrigger value="beneficios">Benefícios Disponíveis</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="cartao" className="space-y-4">
            {/* Cartão VIP */}
            <Card className="relative overflow-hidden border-0 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-700 to-red-800"></div>
              <CardContent className="relative p-6 text-white">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <Crown className="w-8 h-8 text-yellow-400" />
                    <div>
                      <h2 className="text-2xl font-bold text-yellow-400">Cliente VIP</h2>
                      <p className="text-sm text-red-100">Auto Shopping Itapoan</p>
                    </div>
                  </div>
                  <Badge
                    className={`${getStatusColor(cliente.status)} text-white px-3 py-1 flex items-center gap-1`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {cliente.status.charAt(0).toUpperCase() + cliente.status.slice(1)}
                  </Badge>
                </div>

                <div className="mb-6">
                  <h3 className="text-3xl font-bold mb-2">{cliente.nome}</h3>
                  <p className="text-red-100 mb-3">Loja: {cliente.loja_nome || 'N/A'}</p>
                  {/* Informações do Veículo */}
                  {(cliente.veiculo_marca || cliente.veiculo_modelo || cliente.veiculo_ano || cliente.veiculo_placa) && (
                    <div className="mt-3 pt-3 border-t border-red-400/30">
                      <div className="flex items-center gap-2 text-red-100 mb-2">
                        <Car className="w-4 h-4" />
                        <span className="text-sm font-medium">Veículo Comprado</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm text-white">
                        {cliente.veiculo_marca && <span className="font-semibold">{cliente.veiculo_marca}</span>}
                        {cliente.veiculo_modelo && <span>{cliente.veiculo_modelo}</span>}
                        {cliente.veiculo_ano && <span>({cliente.veiculo_ano})</span>}
                        {cliente.veiculo_placa && (
                          <span className="ml-2 px-2 py-1 bg-red-800/50 rounded font-mono text-xs">
                            {cliente.veiculo_placa.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <div className="flex items-center gap-2 text-red-100 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">Membro desde</span>
                    </div>
                    <p className="text-lg font-semibold">{formatarData(cliente.data_ativacao)}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-red-100 mb-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Válido até</span>
                    </div>
                    <p className="text-lg font-semibold text-yellow-400">
                      {formatarData(cliente.data_validade)}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-xs text-red-200 mb-1">ID Visual</p>
                        <p className="text-sm font-mono text-white bg-red-800/50 px-2 py-1 rounded">
                          {gerarIdVisual(cliente.id)}
                        </p>
                      </div>
                      
                      {/* QR Code Digital */}
                      <div>
                        <p className="text-xs text-red-200 mb-1">QR Code Digital</p>
                        <p className="text-xs font-mono text-white bg-red-800/50 px-2 py-1 rounded break-all">
                          {cliente.qr_code_digital || 'N/A'}
                        </p>
                      </div>
                      
                      {/* QR Code Físico */}
                      {cliente.qr_code_fisico && (
                        <div>
                          <p className="text-xs text-red-200 mb-1">QR Code Físico</p>
                          <p className="text-xs font-mono text-white bg-red-800/50 px-2 py-1 rounded break-all">
                            {cliente.qr_code_fisico}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="bg-white p-3 rounded-lg flex-shrink-0">
                      {cliente.qr_code_digital && (
                        <QRCodeSVG value={cliente.qr_code_digital} size={120} />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="beneficios" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Benefícios Disponíveis para Resgate</h3>
              {beneficiosDisponiveis.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Nenhum benefício disponível no momento.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {beneficiosDisponiveis.map((beneficio) => (
                    <Card key={beneficio.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Gift className="w-5 h-5 text-primary" />
                              <h4 className="font-semibold text-lg">{beneficio.nome}</h4>
                              <Badge variant={beneficio.tipo === 'oficial' ? 'default' : 'outline'}>
                                {beneficio.tipo === 'oficial' ? 'Oficial' : 'Loja'}
                              </Badge>
                            </div>
                            {beneficio.descricao && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {beneficio.descricao}
                              </p>
                            )}
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              {beneficio.tipo === 'oficial' && beneficio.parceiro_nome && (
                                <span>Parceiro: {beneficio.parceiro_nome}</span>
                              )}
                              {beneficio.tipo === 'loja' && beneficio.loja_nome && (
                                <span>Loja: {beneficio.loja_nome}</span>
                              )}
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            Atribuir
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="historico" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Histórico de Resgates</h3>
              {validacoes.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Nenhum benefício resgatado ainda.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {validacoes.map((validacao) => (
                    <Card key={validacao.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold mb-1">{validacao.beneficio_nome}</h4>
                            <p className="text-sm text-muted-foreground">
                              Resgatado em {formatarData(validacao.data_validacao)} • Parceiro:{' '}
                              {validacao.parceiro_nome}
                            </p>
                          </div>
                          <Badge variant={validacao.tipo === 'oficial' ? 'default' : 'outline'}>
                            {validacao.tipo === 'oficial' ? 'Oficial' : 'Loja'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

