import { motion } from 'framer-motion';
import { LucideIcon, Check, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BenefitCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  source: 'shopping' | 'store';
  used?: boolean;
  expiresIn?: string;
}

export function BenefitCard({ 
  icon: Icon, 
  title, 
  description, 
  source,
  used = false,
  expiresIn
}: BenefitCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`relative rounded-xl p-4 transition-all duration-300 ${
        used 
          ? 'bg-muted opacity-60' 
          : 'bg-card hover:shadow-lg hover:-translate-y-0.5 border border-border'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
          used 
            ? 'bg-muted-foreground/20' 
            : source === 'shopping' 
              ? 'gradient-vip shadow-vip' 
              : 'bg-primary/10'
        }`}>
          <Icon className={`w-6 h-6 ${
            used 
              ? 'text-muted-foreground' 
              : source === 'shopping' 
                ? 'text-primary' 
                : 'text-primary'
          }`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-semibold ${used ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
              {title}
            </h4>
            <Badge 
              variant={source === 'shopping' ? 'vip' : 'secondary'} 
              className="text-[10px] px-2 py-0"
            >
              {source === 'shopping' ? 'Shopping' : 'Loja'}
            </Badge>
          </div>
          
          <p className={`text-sm ${used ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
            {description}
          </p>

          {expiresIn && !used && (
            <div className="flex items-center gap-1 mt-2 text-xs text-warning">
              <Clock className="w-3 h-3" />
              Expira em {expiresIn}
            </div>
          )}
        </div>

        {used && (
          <div className="absolute top-4 right-4">
            <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
              <Check className="w-4 h-4 text-success" />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
