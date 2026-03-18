import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  FileText, 
  Wrench, 
  HelpCircle,
  Send,
  CheckCircle,
  ArrowLeft,
  QrCode,
  Loader2,
  Gift,
  History,
  MapPin,
  Calendar,
  Store,
  Star,
  StarOff,
  Clock,
  AlertCircle,
  User,
  Eye,
  Car
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VipCard } from '@/components/VipCard';
import { clientesService, ClienteVip } from '@/services/clientes.service';
import { chamadosService } from '@/services/chamados.service';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { Badge } from '@/components/ui/badge';

const ticketTypes = [
  { id: 'documentacao', icon: FileText, label: 'Documentação', description: 'Dúvidas sobre documentos do veículo' },
  { id: 'ajuste_pos_venda', icon: Wrench, label: 'Ajuste Pós-venda', description: 'Problemas ou ajustes após a compra' },
  { id: 'problema_loja', icon: MessageCircle, label: 'Problema com Loja', description: 'Reclamação ou sugestão sobre atendimento' },
  { id: 'duvidas_gerais', icon: HelpCircle, label: 'Dúvidas Gerais', description: 'Outras dúvidas sobre o programa VIP' },
] as const;

const ClientCard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [cliente, setCliente] = useState<ClienteVip | null>(null);
  const [beneficiosDisponiveis, setBeneficiosDisponiveis] = useState<any[]>([]);
  const [beneficiosResgatados, setBeneficiosResgatados] = useState<any[]>([]);
  const [historicoResgates, setHistoricoResgates] = useState<any[]>([]);
  const [loadingBeneficios, setLoadingBeneficios] = useState(false);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [qrCode, setQrCode] = useState(searchParams.get('qr') || '');
  const [showQRInput, setShowQRInput] = useState(!isAuthenticated && !qrCode);
  
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('');
  const [message, setMessage] = useState('');
  const [selectedVeiculo, setSelectedVeiculo] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para avaliação
  const [avaliacaoNotaLoja, setAvaliacaoNotaLoja] = useState<number>(0);
  const [avaliacaoComentarioLoja, setAvaliacaoComentarioLoja] = useState('');
  const [avaliacaoNotaVendedor, setAvaliacaoNotaVendedor] = useState<number>(0);
  const [avaliacaoComentarioVendedor, setAvaliacaoComentarioVendedor] = useState('');
  const [avaliacaoEnviada, setAvaliacaoEnviada] = useState(false);
  const [avaliacaoEnviando, setAvaliacaoEnviando] = useState(false);
  const [jaAvaliouLoja, setJaAvaliouLoja] = useState(false);
  const [jaAvaliouVendedor, setJaAvaliouVendedor] = useState(false);

  // Estados para chamados
  const [meusChamados, setMeusChamados] = useState<any[]>([]);
  const [loadingChamados, setLoadingChamados] = useState(false);

  // Estados para modal de respostas
  const [respostasModalOpen, setRespostasModalOpen] = useState(false);
  const [respostasChamadoSelecionado, setRespostasChamadoSelecionado] = useState<any>(null);
  const [respostas, setRespostas] = useState<any[]>([]);
  const [loadingRespostas, setLoadingRespostas] = useState(false);

  // Buscar benefícios disponíveis
  const loadBeneficios = useCallback(async (clienteId: string, qrCode?: string) => {
    try {
      setLoadingBeneficios(true);
      // Se tiver QR code, usar rota pública; caso contrário, usar rota protegida
      const endpoint = qrCode ? `/clientes-vip/qr/${qrCode}/beneficios` : `/clientes-vip/${clienteId}/beneficios`;
      const data = await api.get<any[]>(endpoint).catch(() => []);
      const beneficios = Array.isArray(data) ? data : [];
      
      // Separar benefícios disponíveis (não resgatados) dos resgatados
      const disponiveis = beneficios.filter((b: any) => !b.resgatado);
      const resgatados = beneficios.filter((b: any) => b.resgatado === true);
      
      setBeneficiosDisponiveis(disponiveis);
      setBeneficiosResgatados(resgatados);
    } catch (error) {
      console.error('Erro ao carregar benefícios:', error);
      setBeneficiosDisponiveis([]);
      setBeneficiosResgatados([]);
    } finally {
      setLoadingBeneficios(false);
    }
  }, []);

  // Buscar histórico de resgates por QR code (rota pública)
  const loadHistoricoResgates = useCallback(async (qrCode: string) => {
    if (!qrCode) return;
    try {
      setLoadingHistorico(true);
      // Usar rota pública para buscar histórico por QR code
      const data = await api.get<any[]>(`/clientes-vip/qr/${qrCode}/validacoes`).catch(() => []);
      setHistoricoResgates(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      setHistoricoResgates([]);
    } finally {
      setLoadingHistorico(false);
    }
  }, []);

  const loadMeusChamados = useCallback(async (qrCode: string) => {
    if (!qrCode) return;
    try {
      setLoadingChamados(true);
      const data = await api.get<any[]>(`/chamados/qr/${qrCode}`).catch(() => []);
      setMeusChamados(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar chamados:', error);
      setMeusChamados([]);
    } finally {
      setLoadingChamados(false);
    }
  }, []);

  const loadRespostasChamado = useCallback(async (chamadoId: string, chamado: any) => {
    const qrCodeToUse = qrCode || cliente?.qr_code_digital || cliente?.qr_code_fisico || '';
    if (!qrCodeToUse) return;
    
    try {
      setLoadingRespostas(true);
      setRespostasChamadoSelecionado(chamado);
      setRespostasModalOpen(true);
      
      const data = await api.get<any[]>(`/chamados/qr/${qrCodeToUse}/${chamadoId}/respostas`).catch(() => []);
      setRespostas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar respostas:', error);
      setRespostas([]);
    } finally {
      setLoadingRespostas(false);
    }
  }, [qrCode, cliente]);

  // Verificar se já avaliou a loja
  const verificarAvaliacao = useCallback(async (qrCode: string) => {
    if (!qrCode) return;
    try {
      // Tentar buscar avaliação existente usando QR code (rota pública)
      const avaliacoes = await api.get<any>(`/ranking/qr/${qrCode}/avaliacao`).catch(() => null);
      
      if (avaliacoes) {
        if (avaliacoes.loja) {
          setJaAvaliouLoja(true);
          setAvaliacaoNotaLoja(avaliacoes.loja.nota);
          setAvaliacaoComentarioLoja(avaliacoes.loja.comentario || '');
        }
        if (avaliacoes.vendedor) {
          setJaAvaliouVendedor(true);
          setAvaliacaoNotaVendedor(avaliacoes.vendedor.nota);
          setAvaliacaoComentarioVendedor(avaliacoes.vendedor.comentario || '');
        }
        if (avaliacoes.loja || avaliacoes.vendedor) {
          setAvaliacaoEnviada(true);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar avaliação:', error);
    }
  }, []);

  // Enviar avaliação
  const handleEnviarAvaliacao = async () => {
    if (!cliente) return;
    if (avaliacaoNotaLoja === 0 && avaliacaoNotaVendedor === 0) {
      toast({
        title: 'Avaliação incompleta',
        description: 'Por favor, selecione uma nota para a loja ou vendedor.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setAvaliacaoEnviando(true);
      
      // Usar QR code para rota pública ou ID para rota autenticada
      const qrCodeToUse = qrCode || cliente.qr_code_digital || cliente.qr_code_fisico || '';
      
      const payload = {
        nota_loja: avaliacaoNotaLoja > 0 ? avaliacaoNotaLoja : undefined,
        comentario_loja: avaliacaoComentarioLoja || undefined,
        nota_vendedor: avaliacaoNotaVendedor > 0 ? avaliacaoNotaVendedor : undefined,
        comentario_vendedor: avaliacaoComentarioVendedor || undefined,
        anonima: false, // Sempre enviar dados do cliente
      };
      
      if (qrCodeToUse && (qrCodeToUse.startsWith('VIP-') || qrCodeToUse.startsWith('FISICO-'))) {
        await api.post('/ranking/avaliacoes/qr', {
          qr_code: qrCodeToUse,
          ...payload
        });
      } else {
        await api.post('/ranking/avaliacoes', {
          cliente_vip_id: cliente.id,
          loja_id: cliente.loja_id,
          vendedor_id: cliente.vendedor_id,
          ...payload
        });
      }

      setAvaliacaoEnviada(true);
      if (avaliacaoNotaLoja > 0) setJaAvaliouLoja(true);
      if (avaliacaoNotaVendedor > 0) setJaAvaliouVendedor(true);
      
      toast({
        title: 'Avaliação enviada!',
        description: 'Obrigado por nos avaliar.',
      });
    } catch (error: any) {
      console.error('Erro ao enviar avaliação:', error);
      toast({
        title: 'Erro ao enviar avaliação',
        description: error.response?.data?.error || 'Não foi possível enviar sua avaliação.',
        variant: 'destructive',
      });
    } finally {
      setAvaliacaoEnviando(false);
    }
  };

  // Buscar cliente VIP
  useEffect(() => {
    const buscarCliente = async () => {
      if (!qrCode && !isAuthenticated) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Se autenticado, buscar pelo ID do usuário ou QR Code
        // Por enquanto, vamos usar o QR Code da URL ou input
        if (qrCode) {
          const data = await clientesService.getByIdOrQR(qrCode);
          setCliente(data);
          setShowQRInput(false);
          
          // Buscar benefícios disponíveis e histórico
          if (data.id) {
            const qrCodeToUse = qrCode || data.qr_code_digital || data.qr_code_fisico || '';
            // Buscar benefícios usando QR code para rota pública, ou ID para rota protegida
            loadBeneficios(data.id, qrCodeToUse);
            // Buscar histórico usando QR code para rota pública
            if (qrCodeToUse && (qrCodeToUse.startsWith('VIP-') || qrCodeToUse.startsWith('FISICO-'))) {
              loadHistoricoResgates(qrCodeToUse);
              // Verificar se já avaliou a loja usando QR code
              verificarAvaliacao(qrCodeToUse);
              // Carregar chamados do cliente
              loadMeusChamados(qrCodeToUse);
            }
          }
        }
      } catch (error: any) {
        toast({
          title: 'Erro ao buscar cartão',
          description: error.message || 'Cliente VIP não encontrado. Verifique se o QR Code está correto.',
          variant: 'destructive',
        });
        setShowQRInput(true);
      } finally {
        setIsLoading(false);
      }
    };

    buscarCliente();
  }, [qrCode, isAuthenticated, toast, loadBeneficios, loadHistoricoResgates, verificarAvaliacao, loadMeusChamados]);

  const handleQRSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (qrCode.trim()) {
      navigate(`/meu-cartao?qr=${qrCode.trim()}`);
    }
  };

  const handleSubmit = async () => {
    if (!cliente || !selectedType || !message.trim()) return;

    setIsSubmitting(true);
    try {
      const qrCodeToUse = qrCode || cliente.qr_code_digital || cliente.qr_code_fisico || '';
      const tituloChamado = titulo.trim() || ticketTypes.find(t => t.id === selectedType)?.label || 'Chamado';
      
      // Se não estiver autenticado, usar rota pública com QR code
      if (!isAuthenticated && qrCodeToUse) {
        await chamadosService.createByQR({
          qr_code: qrCodeToUse,
          tipo: selectedType as any,
          titulo: tituloChamado,
          descricao: message,
          prioridade: 2,
          veiculo_id: selectedVeiculo && selectedVeiculo.trim() !== '' ? selectedVeiculo : undefined,
        });
      } else {
        // Se estiver autenticado, usar rota normal
      await chamadosService.create({
        cliente_vip_id: cliente.id,
        tipo: selectedType as any,
          titulo: tituloChamado,
        descricao: message,
        prioridade: 2,
          veiculo_id: selectedVeiculo && selectedVeiculo.trim() !== '' ? selectedVeiculo : undefined,
      });
      }

      setSubmitted(true);
      setTitulo('');
      setMessage('');
      setSelectedType(null);
      setSelectedVeiculo('');
      
      // Recarregar lista de chamados após criar novo
      if (qrCodeToUse) {
        loadMeusChamados(qrCodeToUse);
      }
      
      toast({
        title: 'Chamado enviado com sucesso!',
        description: 'Você receberá uma resposta em até 24h.',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar chamado',
        description: error.message || 'Tente novamente mais tarde',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedType(null);
    setTitulo('');
    setMessage('');
    setSelectedVeiculo('');
    setSubmitted(false);
  };

  // Formatação de data
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  // Status do cliente
  const getStatus = (cliente: ClienteVip) => {
    if (cliente.status === 'cancelado') return 'cancelled';
    if (cliente.status === 'vencido') return 'expired';
    if (cliente.status === 'renovado') return 'renewed';
    const hoje = new Date();
    const validade = new Date(cliente.data_validade);
    if (validade < hoje) return 'expired';
    return 'active';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando cartão...</p>
        </div>
      </div>
    );
  }

  if (showQRInput || !cliente) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Acessar Cartão VIP
            </CardTitle>
            <CardDescription className="text-[15px] leading-relaxed">
              Digite o código QR do seu cartão VIP para visualizar seus benefícios e abrir chamados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleQRSubmit} className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 bg-muted/50 rounded-lg border border-border">
                  <p className="text-xs font-medium text-foreground mb-2">Onde encontrar seu QR Code?</p>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                    <li>No seu <strong>cartão físico VIP</strong> - Código começa com "FISICO-"</li>
                    <li>No <strong>cartão digital</strong> enviado por email - Código começa com "VIP-"</li>
                    <li>Ou escaneie o <strong>QR Code</strong> diretamente no cartão</li>
                  </ul>
                </div>
                <Input
                  placeholder="Digite seu QR Code (ex: VIP-30B7A86FDD9A4AA6 ou FISICO-169DD66DD2FE4E2B)"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  className="text-center font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Você pode digitar o código completo ou apenas escanear o QR Code do cartão
                </p>
              </div>
              <Button type="submit" variant="vip" className="w-full" disabled={!qrCode.trim()}>
                Buscar Cartão
              </Button>
              {!isAuthenticated && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/login')}
                >
                  Ou faça login
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-primary py-4">
        <div className="container mx-auto px-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center shadow-vip bg-background">
            <img 
              src="/logovipasi.png" 
              alt="Cliente VIP" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <span className="font-display font-bold text-lg text-primary-foreground">
              Meu Cartão VIP
            </span>
            <p className="text-xs text-primary-foreground/60">
              Olá, {cliente.nome}!
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl pb-20">
        {/* VIP Card - Destaque no topo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex justify-center"
        >
          <div className="w-full max-w-md">
          <VipCard
            clientName={cliente.nome}
            clientId={cliente.qr_code_digital || cliente.qr_code_fisico || ''}
            storeName={cliente.loja_nome || 'Loja'}
            vendedorName={cliente.vendedor_nome}
            validUntil={formatDate(cliente.data_validade)}
            status={getStatus(cliente)}
            memberSince={formatDate(cliente.data_ativacao)}
            veiculoMarca={cliente.veiculo_marca}
            veiculoModelo={cliente.veiculo_modelo}
            veiculoAno={cliente.veiculo_ano}
            veiculoPlaca={cliente.veiculo_placa}
              veiculosHistorico={cliente.veiculos_historico}
              qrCodeDigital={cliente.qr_code_digital}
              qrCodeFisico={cliente.qr_code_fisico}
            customBackground="#a41316"
          />
          </div>
        </motion.div>

        {/* Grid Principal - Benefícios e Avaliação lado a lado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Benefícios Disponíveis */}
        {beneficiosDisponiveis.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
              <Card className="shadow-lg h-full">
              <CardHeader>
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <Gift className="w-5 h-5 text-vip-gold" />
                  Benefícios Disponíveis
                </CardTitle>
                <CardDescription>
                  Você pode resgatar estes benefícios nos parceiros credenciados
                </CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {beneficiosDisponiveis.map((beneficio) => (
                    <div
                      key={beneficio.id}
                      className="p-4 rounded-xl border border-border bg-gradient-to-r from-card to-card/50 hover:border-primary/50 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Gift className="w-4 h-4 text-vip-gold" />
                            <h4 className="font-semibold text-sm">{beneficio.nome}</h4>
                            <Badge variant={beneficio.tipo === 'oficial' ? 'default' : 'outline'} className="text-xs">
                              {beneficio.tipo === 'oficial' ? 'Oficial' : 'Loja'}
                            </Badge>
                          </div>
                          {beneficio.descricao && (
                            <p className="text-sm text-muted-foreground mb-3">{beneficio.descricao}</p>
                          )}
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            {beneficio.parceiro_nome && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span className="font-medium">{beneficio.parceiro_nome}</span>
                              </div>
                            )}
                            {beneficio.loja_nome && (
                              <div className="flex items-center gap-1">
                                <Store className="w-3 h-3" />
                                <span>{beneficio.loja_nome}</span>
                              </div>
                            )}
                          </div>
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <p className="text-xs text-muted-foreground">
                                💡 <strong>Como resgatar:</strong> Apresente seu cartão VIP ao parceiro credenciado
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

          {/* Avaliação da Loja */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          >
            <Card className="shadow-lg h-full">
              <CardHeader>
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <Star className="w-5 h-5 text-vip-gold" />
                  Avaliar Atendimento
                </CardTitle>
                <CardDescription>
                  {jaAvaliouLoja && (jaAvaliouVendedor || !cliente.vendedor_id)
                    ? 'Sua avaliação foi enviada com sucesso!' 
                    : 'Sua opinião é importante! Avalie sua experiência.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {jaAvaliouLoja && (jaAvaliouVendedor || !cliente.vendedor_id) ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-6"
                  >
                    <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-success" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">
                      Sua avaliação já foi enviada!
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Obrigado por sua avaliação! Ela nos ajuda a melhorar.
                    </p>
                  </motion.div>
                ) : (
                    <div className="space-y-6">
                      
                      {!jaAvaliouLoja && (
                        <div className="space-y-4 pb-4 border-b border-border">
                          <h4 className="font-semibold text-sm">Loja: {cliente.loja_nome}</h4>
                          <div>
                            <label className="text-xs font-medium mb-2 block">
                              Nota da Loja (0 a 10)
                            </label>
                            <div className="flex items-center gap-2">
                              {[1, 2, 3, 4, 5].map((star) => {
                                const notaEstrela = star * 2;
                                return (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setAvaliacaoNotaLoja(notaEstrela)}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                  >
                                    <Star
                                      className={`w-8 h-8 transition-colors ${
                                        avaliacaoNotaLoja >= notaEstrela
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : avaliacaoNotaLoja >= notaEstrela - 1
                                          ? 'fill-yellow-200 text-yellow-200'
                                          : 'text-muted-foreground'
                                      }`}
                                    />
                                  </button>
                                );
                              })}
                              <span className="ml-2 text-sm font-medium text-muted-foreground">
                                {avaliacaoNotaLoja > 0 ? `${avaliacaoNotaLoja}/10` : 'Opcional'}
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <Textarea
                              placeholder="Comentário sobre a loja (opcional)"
                              value={avaliacaoComentarioLoja}
                              onChange={(e) => setAvaliacaoComentarioLoja(e.target.value)}
                              rows={2}
                            />
                          </div>
                        </div>
                      )}

                      {cliente.vendedor_id && !jaAvaliouVendedor && (
                        <div className="space-y-4 pb-2">
                          <h4 className="font-semibold text-sm">Vendedor: {cliente.vendedor_nome || 'Atendente'}</h4>
                          <div>
                            <label className="text-xs font-medium mb-2 block">
                              Nota do Vendedor (0 a 10)
                            </label>
                            <div className="flex items-center gap-2">
                              {[1, 2, 3, 4, 5].map((star) => {
                                const notaEstrela = star * 2;
                                return (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setAvaliacaoNotaVendedor(notaEstrela)}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                  >
                                    <Star
                                      className={`w-8 h-8 transition-colors ${
                                        avaliacaoNotaVendedor >= notaEstrela
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : avaliacaoNotaVendedor >= notaEstrela - 1
                                          ? 'fill-yellow-200 text-yellow-200'
                                          : 'text-muted-foreground'
                                      }`}
                                    />
                                  </button>
                                );
                              })}
                              <span className="ml-2 text-sm font-medium text-muted-foreground">
                                {avaliacaoNotaVendedor > 0 ? `${avaliacaoNotaVendedor}/10` : 'Opcional'}
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <Textarea
                              placeholder="Comentário sobre o vendedor (opcional)"
                              value={avaliacaoComentarioVendedor}
                              onChange={(e) => setAvaliacaoComentarioVendedor(e.target.value)}
                              rows={2}
                            />
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={handleEnviarAvaliacao}
                        variant="vip"
                        className="w-full"
                        disabled={(avaliacaoNotaLoja === 0 && avaliacaoNotaVendedor === 0) || avaliacaoEnviando}
                      >
                        {avaliacaoEnviando ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Star className="w-4 h-4 mr-2" />
                            Enviar Avaliação
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
        </div>

        {/* Histórico de Resgates - Largura completa */}
        {(beneficiosResgatados.length > 0 || historicoResgates.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <History className="w-5 h-5 text-vip-gold" />
                Histórico de Resgates
              </CardTitle>
              <CardDescription>
                Veja todos os benefícios que você já resgatou
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHistorico || loadingBeneficios ? (
                <div className="py-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Carregando histórico...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Benefícios resgatados pelo admin/lojista */}
                  {beneficiosResgatados.map((beneficio) => (
                    <div
                      key={beneficio.alocacao_id || beneficio.id}
                      className="p-4 rounded-xl border border-border bg-card/50 hover:border-success/50 transition-all opacity-75"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-success" />
                            <h4 className="font-semibold text-sm line-through text-muted-foreground">{beneficio.nome}</h4>
                            <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600">
                              Resgatado
                            </Badge>
                            {beneficio.tipo && (
                              <Badge variant={beneficio.tipo === 'oficial' ? 'default' : 'outline'} className="text-xs">
                                {beneficio.tipo === 'oficial' ? 'Oficial' : 'Loja'}
                              </Badge>
                            )}
                          </div>
                          {beneficio.descricao && (
                            <p className="text-sm text-muted-foreground mb-2 line-through">{beneficio.descricao}</p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            {beneficio.parceiro_nome && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span>Parceiro: <strong>{beneficio.parceiro_nome}</strong></span>
                              </div>
                            )}
                            {beneficio.loja_nome && (
                              <div className="flex items-center gap-1">
                                <Store className="w-3 h-3" />
                                <span>Loja: <strong>{beneficio.loja_nome}</strong></span>
                              </div>
                            )}
                          </div>
                          {beneficio.data_resgate && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              <span>
                                Resgatado em: <strong>
                                  {format(new Date(beneficio.data_resgate), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                                </strong>
                                {beneficio.resgatado_por_nome && (
                                  <span className="ml-1">por {beneficio.resgatado_por_nome}</span>
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Validações feitas pelos parceiros */}
                  {historicoResgates.map((resgate) => (
                    <div
                      key={resgate.id}
                      className="p-4 rounded-xl border border-border bg-card/50 hover:border-success/50 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-success" />
                            <h4 className="font-semibold text-sm">{resgate.beneficio_nome || 'Benefício Resgatado'}</h4>
                            <Badge variant="success" className="text-xs">
                              Validado
                            </Badge>
                          </div>
                          {resgate.parceiro_nome && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                              <MapPin className="w-3 h-3" />
                              <span>Validado em: <strong>{resgate.parceiro_nome}</strong></span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {format(new Date(resgate.data_validacao), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        )}

        {/* Atendimento Prioritário - Largura completa */}
        {cliente.status !== 'cancelado' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
        >
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-vip-gold" />
                Atendimento Prioritário
              </CardTitle>
              <CardDescription>
                Abra um chamado e receba resposta em até 24h
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!submitted ? (
                <>
                  {!selectedType ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {ticketTypes.map((type) => (
                        <button
                          key={type.id}
                          onClick={() => setSelectedType(type.id)}
                          className="p-4 rounded-xl border border-border bg-card hover:border-primary hover:bg-primary/5 transition-all text-left group"
                        >
                          <type.icon className="w-6 h-6 text-muted-foreground group-hover:text-primary mb-2" />
                          <p className="font-medium text-sm">{type.label}</p>
                          <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-4"
                    >
                      <button
                        onClick={() => setSelectedType(null)}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                      </button>
                      
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium">
                          {ticketTypes.find(t => t.id === selectedType)?.label}
                        </p>
                      </div>

                      <Input
                        placeholder="Título do chamado (opcional)"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                      />

                      {/* Campo de seleção de veículo - obrigatório para ajuste pós-venda, opcional para outros */}
                      {cliente?.veiculos_historico && cliente.veiculos_historico.length > 0 && (
                        <div className="space-y-2">
                          <Label htmlFor="veiculo" className="text-sm font-medium">
                            Selecione o Veículo {selectedType === 'ajuste_pos_venda' ? '*' : '(opcional)'}
                          </Label>
                          <Select
                            value={selectedVeiculo || undefined}
                            onValueChange={(value) => setSelectedVeiculo(value || '')}
                          >
                            <SelectTrigger id="veiculo">
                              <SelectValue placeholder={selectedType === 'ajuste_pos_venda' ? 'Selecione o veículo relacionado ao chamado *' : 'Selecione o veículo relacionado ao chamado (opcional)'} />
                            </SelectTrigger>
                            <SelectContent>
                              {cliente.veiculos_historico.map((veiculo) => (
                                <SelectItem key={veiculo.id} value={veiculo.id}>
                                  {veiculo.marca} {veiculo.modelo} ({veiculo.ano}) - {veiculo.placa?.toUpperCase()}
                                  {veiculo.data_compra && (
                                    <span className="text-xs text-muted-foreground ml-2">
                                      - Comprado em {format(new Date(veiculo.data_compra), 'MM/yyyy', { locale: ptBR })}
                                    </span>
                                  )}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            {selectedType === 'ajuste_pos_venda' 
                              ? 'Selecione o veículo relacionado ao problema de pós-venda (obrigatório)'
                              : 'Selecione o veículo relacionado ao chamado, se aplicável'
                            }
                          </p>
                        </div>
                      )}

                      <Textarea
                        placeholder="Descreva sua solicitação..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={4}
                      />

                      <Button 
                        onClick={handleSubmit}
                        variant="vip" 
                        className="w-full"
                        disabled={
                          !message.trim() || 
                          isSubmitting || 
                          (selectedType === 'ajuste_pos_venda' && (!selectedVeiculo || selectedVeiculo === ''))
                        }
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Enviar Chamado
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )}
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6"
                >
                  <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-success" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">
                    Chamado Enviado!
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Você receberá uma resposta em até 24h.
                  </p>
                  <Button onClick={handleReset} variant="outline" size="sm">
                    Abrir Novo Chamado
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        )}

        {/* Meus Chamados - Largura completa */}
        {cliente.status !== 'cancelado' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-vip-gold" />
                  Meus Chamados
                </CardTitle>
                <CardDescription>
                  Acompanhe o status dos seus chamados de atendimento prioritário
                </CardDescription>
              </CardHeader>
              <CardContent>
              {loadingChamados ? (
                <div className="py-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Carregando chamados...</p>
                </div>
              ) : meusChamados.length === 0 ? (
                <div className="py-8 text-center">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    Você ainda não possui chamados abertos.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use a seção "Atendimento Prioritário" acima para abrir um novo chamado.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {meusChamados.map((chamado) => {
                    const getStatusBadge = (status: string) => {
                      const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string, icon: any }> = {
                        aberto: { variant: 'destructive', label: 'Aberto', icon: AlertCircle },
                        em_andamento: { variant: 'default', label: 'Em Andamento', icon: Clock },
                        resolvido: { variant: 'secondary', label: 'Resolvido', icon: CheckCircle },
                        cancelado: { variant: 'outline', label: 'Cancelado', icon: AlertCircle },
                      };
                      const statusInfo = variants[status] || { variant: 'outline', label: status, icon: AlertCircle };
                      const StatusIcon = statusInfo.icon;
                      return (
                        <Badge variant={statusInfo.variant} className="flex items-center gap-1 w-fit">
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
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
                      return icons[tipo] || MessageCircle;
                    };

                    const TipoIcon = getTipoIcon(chamado.tipo);

                    return (
                      <div
                        key={chamado.id}
                        className="p-4 rounded-xl border border-border bg-card/50 hover:border-primary/50 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <TipoIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm">{chamado.titulo}</h4>
                                {getStatusBadge(chamado.status)}
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">
                                {getTipoLabel(chamado.tipo)}
                              </p>
                              {chamado.veiculo_marca && chamado.veiculo_modelo && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                                  <Car className="w-3 h-3" />
                                  <span>
                                    Veículo: {chamado.veiculo_marca} {chamado.veiculo_modelo}
                                    {chamado.veiculo_ano && ` (${chamado.veiculo_ano})`}
                                    {chamado.veiculo_placa && ` - ${chamado.veiculo_placa.toUpperCase()}`}
                                  </span>
                                </div>
                              )}
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {chamado.descricao}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t border-border/50">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              Criado em: {format(new Date(chamado.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                          {chamado.data_resolucao && (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>
                                Resolvido em: {format(new Date(chamado.data_resolucao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                          )}
                        </div>
                        {chamado.observacoes_resolucao && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-medium text-muted-foreground">Última Resposta:</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {chamado.responsavel_nome && (
                                  <>
                                    <User className="w-3 h-3" />
                                    <span>por {chamado.responsavel_nome}</span>
                                  </>
                                )}
                                {(chamado.data_resolucao || chamado.updated_at) && (
                                  <>
                                    {chamado.responsavel_nome && <span>•</span>}
                                    <Calendar className="w-3 h-3" />
                                    <span>
                                      {format(
                                        new Date(chamado.data_resolucao || chamado.updated_at!), 
                                        "dd/MM/yyyy 'às' HH:mm", 
                                        { locale: ptBR }
                                      )}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                              {chamado.observacoes_resolucao}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-3"
                              onClick={() => loadRespostasChamado(chamado.id, chamado)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Todas as Respostas
                            </Button>
                          </div>
                        )}
                        {!chamado.observacoes_resolucao && chamado.status !== 'aberto' && (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => loadRespostasChamado(chamado.id, chamado)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Histórico
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        )}
      </main>

      {/* Modal de Respostas do Chamado */}
      <Dialog open={respostasModalOpen} onOpenChange={setRespostasModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Respostas do Chamado
            </DialogTitle>
            {respostasChamadoSelecionado && (
              <DialogDescription className="text-left">
                <strong>{respostasChamadoSelecionado.titulo}</strong>
                <span className="block text-xs mt-1">
                  Criado em: {format(new Date(respostasChamadoSelecionado.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </DialogDescription>
            )}
          </DialogHeader>

          {loadingRespostas ? (
            <div className="py-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Carregando respostas...</p>
            </div>
          ) : respostas.length === 0 ? (
            <div className="py-8 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">
                Nenhuma resposta encontrada para este chamado.
              </p>
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              {respostas.map((resposta, index) => (
                <div
                  key={resposta.id || index}
                  className="p-4 rounded-xl border border-border bg-muted/30"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm">
                        {resposta.usuario_nome || 'Sistema'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {format(new Date(resposta.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {resposta.mensagem}
                  </p>
                  {resposta.status_novo && (
                    <div className="mt-2 pt-2 border-t border-border/50">
                      <Badge variant="outline" className="text-xs">
                        Status alterado para: {
                          resposta.status_novo === 'em_andamento' ? 'Em Andamento' : 
                          resposta.status_novo === 'aberto' ? 'Aberto' :
                          resposta.status_novo === 'resolvido' ? 'Resolvido' : 'Cancelado'
                        }
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientCard;
