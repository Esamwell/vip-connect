import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { Crown, Calendar, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface VipCardProps {
  clientName: string;
  clientId: string;
  storeName: string;
  validUntil: string;
  status: 'active' | 'expiring' | 'expired' | 'renewed';
  memberSince: string;
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
  memberSince 
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
              <p className="text-sm text-primary-foreground/70">
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
          <p className="text-2xl font-bold text-primary-foreground tracking-wide">
            {clientName}
          </p>
          <p className="text-sm text-primary-foreground/60 mt-1">
            Loja: {storeName}
          </p>
        </div>

        {/* QR Code Section */}
        <div className="relative z-10 flex items-end justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 text-primary-foreground/70">
              <Calendar className="w-4 h-4" />
              <span className="text-xs">Membro desde</span>
            </div>
            <p className="text-sm text-primary-foreground font-medium">
              {memberSince}
            </p>
            
            <div className="flex items-center gap-2 text-primary-foreground/70 mt-4">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Válido até</span>
            </div>
            <p className="text-lg text-vip-gold font-bold">
              {validUntil}
            </p>
          </div>

          <div className="bg-primary-foreground p-2 rounded-xl shadow-lg">
            <QRCodeSVG
              value={qrValue}
              size={100}
              level="H"
              bgColor="transparent"
              fgColor="hsl(222, 47%, 15%)"
            />
          </div>
        </div>

        {/* Card ID */}
        <div className="relative z-10 mt-6 pt-4 border-t border-primary-foreground/10">
          <p className="text-xs text-primary-foreground/40 font-mono tracking-widest">
            ID: {clientId}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
