import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { Crown, Calendar, CheckCircle2, AlertCircle, Clock, Car } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

interface VeiculoHistorico {
  id: string;
  marca: string;
  modelo: string;
  ano: number;
  placa: string;
  data_compra: string;
  created_at?: string;
}

interface VipCardProps {
  clientName: string;
  clientId: string;
  storeName: string;
  validUntil: string;
  status: 'active' | 'expiring' | 'expired' | 'renewed' | 'cancelled';
  memberSince: string;
  veiculoMarca?: string;
  veiculoModelo?: string;
  veiculoAno?: number;
  veiculoPlaca?: string;
  veiculosHistorico?: VeiculoHistorico[];
  qrCodeDigital?: string;
  qrCodeFisico?: string;
  customBackground?: string;
}

const statusConfig = {
  active: {
    label: 'Ativo',
    variant: 'success' as const,
    icon: CheckCircle2,
  },
  expiring: {
    label: 'Expirando',
    variant: 'warning' as const,
    icon: Clock,
  },
  expired: {
    label: 'Vencido',
    variant: 'destructive' as const,
    icon: AlertCircle,
  },
  renewed: {
    label: 'Renovado',
    variant: 'vip' as const,
    icon: Crown,
  },
  cancelled: {
    label: 'Cancelado',
    variant: 'destructive' as const,
    icon: AlertCircle,
  },
};

export function VipCard({ 
  clientName, 
  clientId, 
  storeName, 
  validUntil, 
  status,
  memberSince,
  veiculoMarca,
  veiculoModelo,
  veiculoAno,
  veiculoPlaca,
  veiculosHistorico,
  qrCodeDigital,
  qrCodeFisico,
  customBackground
}: VipCardProps) {
  const statusInfo = statusConfig[status];
  const StatusIcon = statusInfo.icon;

  const qrValue = `https://clientevip.autoshopping.com.br/validate/${clientId}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto perspective-1000"
      style={{ perspective: '1000px' }}
    >
      <motion.div
        className="relative rounded-2xl p-6 shadow-card overflow-hidden transform-gpu transition-all duration-500 group cursor-pointer"
        whileHover={{ 
          scale: 1.05,
          rotateY: 8,
          rotateX: -8,
          y: -15,
          z: 20,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20
        }}
        style={{
          transformStyle: 'preserve-3d',
          ...(customBackground ? { backgroundColor: customBackground } : {}),
        }}
      >
        {/* Shine effect overlay */}
        <div className="absolute inset-0 shine-effect pointer-events-none" />
        
        {/* Gold accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 gradient-vip" />
        
        {/* Decorative car icon - red and transparent */}
        <div className="absolute top-4 right-4 opacity-15 pointer-events-none">
          <Car className="w-32 h-32" style={{ color: '#ffffff', strokeWidth: 1.5 }} />
        </div>
        
        {/* Header */}
        <div className="relative z-10 flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full gradient-vip flex items-center justify-center shadow-vip">
              <Crown className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-vip-gold">
                Cliente VIP
              </h3>
              <p className="text-sm text-white/90">
                Auto Shopping Itapoan
              </p>
            </div>
          </div>
          <Badge variant={statusInfo.variant} className="flex items-center gap-1">
            <StatusIcon className="w-3 h-3" />
            {statusInfo.label}
          </Badge>
        </div>

        {/* Client Info */}
        <div className="relative z-10 mb-6">
          <p className="text-2xl font-bold text-white tracking-wide">
            {clientName}
          </p>
          <p className="text-sm text-white/90 mt-1">
            Loja: {storeName}
          </p>
          {/* Histórico de Veículos */}
          {veiculosHistorico && veiculosHistorico.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/20">
              <div className="flex items-center gap-2 text-white/90 mb-2">
                <Car className="w-4 h-4" />
                <span className="text-xs font-medium">Veículos Comprados</span>
              </div>
              <div className="space-y-2">
                {veiculosHistorico.map((veiculo, index) => (
                  <div key={veiculo.id || index} className="bg-white/10 rounded-lg p-2 border border-white/20">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-white mb-1">
                      <span className="font-semibold">{veiculo.marca}</span>
                      <span>{veiculo.modelo}</span>
                      <span>({veiculo.ano})</span>
                      <span className="ml-auto px-2 py-0.5 bg-white/20 rounded font-mono text-[10px]">
                        {veiculo.placa?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-white/80">
                      <Calendar className="w-2.5 h-2.5" />
                      <span>Comprado em: {format(new Date(veiculo.data_compra || veiculo.created_at || ''), 'dd/MM/yyyy', { locale: ptBR })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* QR Code Section */}
        <div className="relative z-10 flex items-end justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 text-white/90">
              <Calendar className="w-4 h-4" />
              <span className="text-xs">Membro desde</span>
            </div>
            <p className="text-sm text-white font-medium">
              {memberSince}
            </p>
            
            <div className="flex items-center gap-2 text-white/90 mt-4">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Válido até</span>
            </div>
            <p className="text-lg text-vip-gold font-bold">
              {validUntil}
            </p>
          </div>

          <div className="bg-white p-2 rounded-xl shadow-lg">
            <QRCodeSVG
              value={qrValue}
              size={100}
              level="H"
              bgColor="transparent"
              fgColor="hsl(222, 47%, 15%)"
            />
          </div>
        </div>

        {/* QR Codes */}
        <div className="relative z-10 mt-6 pt-4 border-t border-white/20 space-y-2">
          {qrCodeDigital && (
            <p className="text-xs text-white/90 font-mono tracking-widest">
              QR Code Digital: {qrCodeDigital}
            </p>
          )}
          {qrCodeFisico && (
            <p className="text-xs text-white/90 font-mono tracking-widest">
              QR Code Físico: {qrCodeFisico}
            </p>
          )}
          {!qrCodeDigital && !qrCodeFisico && (
            <p className="text-xs text-white/90 font-mono tracking-widest">
              QR Code: {clientId}
            </p>
          )}
        </div>
        
        {/* Efeito de brilho no hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-2xl" />
        </div>
      </motion.div>
    </motion.div>
  );
}
