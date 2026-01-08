import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Crown, 
  MessageCircle, 
  FileText, 
  Wrench, 
  HelpCircle,
  Send,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VipCard } from '@/components/VipCard';

const ticketTypes = [
  { id: 'documents', icon: FileText, label: 'Documentação', description: 'Dúvidas sobre documentos do veículo' },
  { id: 'adjustment', icon: Wrench, label: 'Ajuste Pós-venda', description: 'Problemas ou ajustes após a compra' },
  { id: 'store', icon: MessageCircle, label: 'Problema com Loja', description: 'Reclamação ou sugestão sobre atendimento' },
  { id: 'general', icon: HelpCircle, label: 'Dúvidas Gerais', description: 'Outras dúvidas sobre o programa VIP' },
];

const ClientCard = () => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleReset = () => {
    setSelectedType(null);
    setMessage('');
    setSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-primary py-4">
        <div className="container mx-auto px-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg gradient-vip flex items-center justify-center shadow-vip">
            <Crown className="w-5 h-5 text-primary" />
          </div>
          <div>
            <span className="font-display font-bold text-lg text-primary-foreground">
              Meu Cartão VIP
            </span>
            <p className="text-xs text-primary-foreground/60">
              Olá, João!
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
            clientName="João Silva"
            clientId="VIP-2024-00847"
            storeName="Premium Motors"
            validUntil="15/01/2026"
            status="active"
            memberSince="15/01/2025"
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
                        disabled={!message.trim()}
                      >
                        <Send className="w-4 h-4" />
                        Enviar Chamado
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
