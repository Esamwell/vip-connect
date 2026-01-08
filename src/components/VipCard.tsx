import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { Crown, Calendar, CheckCircle2, AlertCircle, Clock, Car } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface VipCardProps {
  clientName: string;
  clientId: string;
  storeName: string;
  validUntil: string;
  status: 'active' | 'expiring' | 'expired' | 'renewed';
  memberSince: string;
  veiculoMarca?: string;
  veiculoModelo?: string;
  veiculoAno?: number;
  veiculoPlaca?: string;
  qrCodeDigital?: string;
  qrCodeFisico?: string;
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
  qrCodeDigital,
  qrCodeFisico
}: VipCardProps) {
  const statusInfo = statusConfig[status];
  const StatusIcon = statusInfo.icon;

  const qrValue = `https://clientevip.autoshopping.com.br/validate/${clientId}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="relative gradient-card rounded-2xl p-6 shadow-card overflow-hidden">
        {/* Shine effect overlay */}
        <div className="absolute inset-0 shine-effect pointer-events-none" />
        
        {/* Gold accent line */}
        <div className="absolute top-0 left-0 right-0 h-1 gradient-vip" />
        
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
          {/* Veículo Info */}
          {(veiculoMarca || veiculoModelo || veiculoAno || veiculoPlaca) && (
            <div className="mt-3 pt-3 border-t border-white/20">
              <div className="flex items-center gap-2 text-white/90 mb-2">
                <Car className="w-4 h-4" />
                <span className="text-xs font-medium">Veículo</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-white">
                {veiculoMarca && <span className="font-semibold">{veiculoMarca}</span>}
                {veiculoModelo && <span>{veiculoModelo}</span>}
                {veiculoAno && <span>({veiculoAno})</span>}
                {veiculoPlaca && (
                  <span className="ml-2 px-2 py-0.5 bg-white/20 rounded font-mono">
                    {veiculoPlaca.toUpperCase()}
                  </span>
                )}
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
      </div>
    </motion.div>
  );
}
