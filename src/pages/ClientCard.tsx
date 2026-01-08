import { useState, useEffect } from 'react';
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
  Loader2
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

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
  const [isLoading, setIsLoading] = useState(true);
  const [qrCode, setQrCode] = useState(searchParams.get('qr') || '');
  const [showQRInput, setShowQRInput] = useState(!isAuthenticated && !qrCode);
  
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        }
      } catch (error: any) {
        toast({
          title: 'Erro ao buscar cartão',
          description: error.message || 'Cliente VIP não encontrado',
          variant: 'destructive',
        });
        setShowQRInput(true);
      } finally {
        setIsLoading(false);
      }
    };

    buscarCliente();
  }, [qrCode, isAuthenticated, toast]);

  const handleQRSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (qrCode.trim()) {
      navigate(`/meu-cartao?qr=${qrCode.trim()}`);
      window.location.reload(); // Recarregar para buscar dados
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
            <CardDescription>
              Digite o código do seu cartão ou escaneie o QR Code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleQRSubmit} className="space-y-4">
              <div>
                <Input
                  placeholder="Digite o código do cartão (ex: VIP-XXXXXXXX)"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  className="text-center font-mono"
                />
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
          />
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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
