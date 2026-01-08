import { useState } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Search, CheckCircle, AlertCircle, Crown, User, Calendar, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ClientData {
  name: string;
  status: 'active' | 'expired';
  validUntil: string;
  store: string;
  benefit: {
    name: string;
    description: string;
    available: boolean;
  };
}

const ValidatePartner = () => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [validated, setValidated] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = () => {
    setIsLoading(true);
    setError('');
    
    // Simulated search
    setTimeout(() => {
      if (code.startsWith('VIP')) {
        setClientData({
          name: 'João Silva',
          status: 'active',
          validUntil: '15/01/2026',
          store: 'Premium Motors',
          benefit: {
            name: 'Lavagem Completa',
            description: 'Uma lavagem completa mensal',
            available: true,
          },
        });
      } else {
        setError('Cliente não encontrado. Verifique o código e tente novamente.');
        setClientData(null);
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleValidate = () => {
    setIsLoading(true);
    setTimeout(() => {
      setValidated(true);
      setIsLoading(false);
    }, 800);
  };

  const handleReset = () => {
    setCode('');
    setClientData(null);
    setValidated(false);
    setError('');
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
              Cliente VIP
            </span>
            <p className="text-xs text-primary-foreground/60">
              Painel do Parceiro
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-md">
        {!validated ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="shadow-lg">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="font-display">Validar Benefício</CardTitle>
                <CardDescription>
                  Escaneie o QR Code ou digite o código do cliente VIP
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: VIP-2024-00847"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="font-mono"
                  />
                  <Button 
                    onClick={handleSearch} 
                    disabled={!code || isLoading}
                    className="px-6"
                  >
                    <Search className="w-4 h-4" />
                  </Button>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </motion.div>
                )}

                {clientData && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 pt-4 border-t"
                  >
                    {/* Client Info */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="w-4 h-4" />
                          <span className="text-sm">Cliente</span>
                        </div>
                        <span className="font-semibold">{clientData.name}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Store className="w-4 h-4" />
                          <span className="text-sm">Loja</span>
                        </div>
                        <span className="text-sm">{clientData.store}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">Validade</span>
                        </div>
                        <span className="text-sm">{clientData.validUntil}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <Badge variant={clientData.status === 'active' ? 'success' : 'destructive'}>
                          {clientData.status === 'active' ? 'Ativo' : 'Vencido'}
                        </Badge>
                      </div>
                    </div>

                    {/* Benefit */}
                    <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Benefício disponível</p>
                      <p className="font-semibold text-success">{clientData.benefit.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">{clientData.benefit.description}</p>
                    </div>

                    {/* Validate Button */}
                    <Button 
                      onClick={handleValidate}
                      variant="vip" 
                      size="lg" 
                      className="w-full"
                      disabled={isLoading || !clientData.benefit.available}
                    >
                      <CheckCircle className="w-5 h-5" />
                      Confirmar Uso do Benefício
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-success" />
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">
              Benefício Validado!
            </h2>
            <p className="text-muted-foreground mb-8">
              O uso foi registrado com sucesso para {clientData?.name}.
            </p>
            <Button onClick={handleReset} variant="outline" size="lg">
              Validar Outro Cliente
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default ValidatePartner;
