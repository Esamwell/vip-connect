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
  Store
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

  // Buscar benefícios disponíveis
  const loadBeneficios = useCallback(async (clienteId: string) => {
    try {
      setLoadingBeneficios(true);
      const data = await api.get<any[]>(`/clientes-vip/${clienteId}/beneficios`).catch(() => []);
      setBeneficiosDisponiveis(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar benefícios:', error);
      setBeneficiosDisponiveis([]);
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
            loadBeneficios(data.id);
            // Buscar histórico usando QR code para rota pública
            const qrCodeToUse = qrCode || data.qr_code_digital || data.qr_code_fisico || '';
            if (qrCodeToUse && (qrCodeToUse.startsWith('VIP-') || qrCodeToUse.startsWith('FISICO-'))) {
              loadHistoricoResgates(qrCodeToUse);
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
  }, [qrCode, isAuthenticated, toast, loadBeneficios, loadHistoricoResgates]);

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

      <main className="container mx-auto px-4 py-8 max-w-lg pb-20">
        {/* VIP Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <VipCard
            clientName={cliente.nome}
            clientId={cliente.qr_code_digital}
            storeName={cliente.loja_nome || 'Loja'}
            validUntil={formatDate(cliente.data_validade)}
            status={getStatus(cliente)}
            memberSince={formatDate(cliente.data_ativacao)}
            veiculoMarca={cliente.veiculo_marca}
            veiculoModelo={cliente.veiculo_modelo}
            veiculoAno={cliente.veiculo_ano}
            veiculoPlaca={cliente.veiculo_placa}
          />
        </motion.div>

        {/* Benefícios Disponíveis */}
        {beneficiosDisponiveis.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <Card className="shadow-lg">
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
                <div className="space-y-3">
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
                              💡 <strong>Como resgatar:</strong> Apresente seu cartão VIP (digital ou físico) ao parceiro credenciado para validação do benefício
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

        {/* Histórico de Resgates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
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
              {loadingHistorico ? (
                <div className="py-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Carregando histórico...</p>
                </div>
              ) : historicoResgates.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Nenhum benefício resgatado ainda.</p>
                  <p className="text-xs mt-1">Seus resgates aparecerão aqui após a validação nos parceiros.</p>
                </div>
              ) : (
                <div className="space-y-3">
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
                              Resgatado
                            </Badge>
                          </div>
                          {resgate.parceiro_nome && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                              <MapPin className="w-3 h-3" />
                              <span>Resgatado em: <strong>{resgate.parceiro_nome}</strong></span>
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

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
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
                    <div className="grid grid-cols-2 gap-3">
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
