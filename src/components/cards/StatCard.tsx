import { LucideIcon, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: 'primary' | 'success' | 'warning' | 'info' | 'danger';
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  className?: string;
}

const iconColorClasses = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  info: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  danger: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'primary',
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={cn('overflow-hidden transition-all duration-200 hover:shadow-md', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center shadow-xs',
              iconColorClasses[iconColor]
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium',
                trend.isPositive !== false
                  ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
              )}
            >
              {trend.isPositive !== false ? (
                <ArrowUp className="w-3 h-3" />
              ) : (
                <ArrowDown className="w-3 h-3" />
              )}
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <p className="text-[13px] font-medium text-muted-foreground tracking-tight">{title}</p>
          <p className="text-3xl font-bold tracking-[-0.04em]">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

