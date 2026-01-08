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
  StarOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para avaliação
  const [avaliacaoNota, setAvaliacaoNota] = useState<number>(0);
  const [avaliacaoComentario, setAvaliacaoComentario] = useState('');
  const [avaliacaoEnviada, setAvaliacaoEnviada] = useState(false);
  const [avaliacaoEnviando, setAvaliacaoEnviando] = useState(false);
  const [jaAvaliou, setJaAvaliou] = useState(false);

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

  // Verificar se já avaliou a loja
  const verificarAvaliacao = useCallback(async (qrCode: string) => {
    if (!qrCode) return;
    try {
      // Tentar buscar avaliação existente usando QR code (rota pública)
      const avaliacaoExistente = await api.get<any>(`/ranking/qr/${qrCode}/avaliacao`).catch(() => null);
      
      if (avaliacaoExistente) {
        setJaAvaliou(true);
        setAvaliacaoNota(avaliacaoExistente.nota);
        setAvaliacaoComentario(avaliacaoExistente.comentario || '');
        setAvaliacaoEnviada(true);
      }
    } catch (error) {
      console.error('Erro ao verificar avaliação:', error);
    }
  }, []);

  // Enviar avaliação
  const handleEnviarAvaliacao = async () => {
    if (!cliente || avaliacaoNota === 0) {
      toast({
        title: 'Avaliação incompleta',
        description: 'Por favor, selecione uma nota para a loja.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setAvaliacaoEnviando(true);
      
      // Usar QR code para rota pública ou ID para rota autenticada
      const qrCodeToUse = qrCode || cliente.qr_code_digital || cliente.qr_code_fisico || '';
      
      if (qrCodeToUse && (qrCodeToUse.startsWith('VIP-') || qrCodeToUse.startsWith('FISICO-'))) {
        // Usar rota pública com QR code
        await api.post('/ranking/avaliacoes/qr', {
          qr_code: qrCodeToUse,
          nota: avaliacaoNota,
          comentario: avaliacaoComentario || null,
          anonima: false, // Sempre enviar dados do cliente
        });
      } else {
        // Usar rota autenticada com ID
        await api.post('/ranking/avaliacoes', {
          cliente_vip_id: cliente.id,
          loja_id: cliente.loja_id,
          nota: avaliacaoNota,
          comentario: avaliacaoComentario || null,
          anonima: false, // Sempre enviar dados do cliente
        });
      }

      setAvaliacaoEnviada(true);
      setJaAvaliou(true);
      toast({
        title: 'Avaliação enviada!',
        description: 'Obrigado por avaliar nossa loja.',
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
  }, [qrCode, isAuthenticated, toast, loadBeneficios, loadHistoricoResgates, verificarAvaliacao]);

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
      await chamadosService.create({
        cliente_vip_id: cliente.id,
        tipo: selectedType as any,
        titulo: titulo.trim() || ticketTypes.find(t => t.id === selectedType)?.label || 'Chamado',
        descricao: message,
        prioridade: 2,
      });

      setSubmitted(true);
      setTitulo('');
      setMessage('');
      setSelectedType(null);
      
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
              validUntil={formatDate(cliente.data_validade)}
              status={getStatus(cliente)}
              memberSince={formatDate(cliente.data_ativacao)}
              veiculoMarca={cliente.veiculo_marca}
              veiculoModelo={cliente.veiculo_modelo}
              veiculoAno={cliente.veiculo_ano}
              veiculoPlaca={cliente.veiculo_placa}
              qrCodeDigital={cliente.qr_code_digital}
              qrCodeFisico={cliente.qr_code_fisico}
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
          {!jaAvaliou && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Card className="shadow-lg h-full">
                <CardHeader>
                  <CardTitle className="text-lg font-display flex items-center gap-2">
                    <Star className="w-5 h-5 text-vip-gold" />
                    Avaliar Loja
                  </CardTitle>
                  <CardDescription>
                    Sua opinião é importante! Avalie sua experiência com a loja.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {avaliacaoEnviada ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-6"
                    >
                      <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-success" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">
                        Avaliação Enviada!
                      </h3>
                      <div className="flex items-center justify-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-5 h-5 ${
                              star <= Math.ceil(avaliacaoNota / 2)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground'
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm font-medium">({avaliacaoNota}/10)</span>
                      </div>
                      {avaliacaoComentario && (
                        <p className="text-sm text-muted-foreground italic mb-4">
                          "{avaliacaoComentario}"
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Obrigado por sua avaliação!
                      </p>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Nota (0 a 10)
                        </label>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const notaEstrela = star * 2;
                            return (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setAvaliacaoNota(notaEstrela)}
                                className="focus:outline-none transition-transform hover:scale-110"
                              >
                                <Star
                                  className={`w-8 h-8 transition-colors ${
                                    avaliacaoNota >= notaEstrela
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : avaliacaoNota >= notaEstrela - 1
                                      ? 'fill-yellow-200 text-yellow-200'
                                      : 'text-muted-foreground'
                                  }`}
                                />
                              </button>
                            );
                          })}
                          <span className="ml-2 text-sm font-medium text-muted-foreground">
                            {avaliacaoNota > 0 ? `${avaliacaoNota}/10` : 'Selecione uma nota'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Comentário (opcional)
                        </label>
                        <Textarea
                          placeholder="Conte-nos sobre sua experiência..."
                          value={avaliacaoComentario}
                          onChange={(e) => setAvaliacaoComentario(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <Button
                        onClick={handleEnviarAvaliacao}
                        variant="vip"
                        className="w-full"
                        disabled={avaliacaoNota === 0 || avaliacaoEnviando}
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
          )}
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
                        disabled={!message.trim() || isSubmitting}
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
      </main>
    </div>
  );
};

export default ClientCard;
