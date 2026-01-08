import { LucideIcon, ArrowUp, ArrowDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatVerticalCardProps {
  title: string;
  stats: string | number;
  subtitle?: string;
  avatarIcon: LucideIcon;
  avatarColor?: 'primary' | 'success' | 'warning' | 'info' | 'danger' | 'accent';
  trend?: {
    value: number;
    isPositive?: boolean;
  };
  className?: string;
}

const avatarColorClasses = {
  primary: 'bg-primary/10 text-primary shadow-sm',
  success: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 shadow-sm',
  warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 shadow-sm',
  info: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm',
  danger: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 shadow-sm',
  accent: 'bg-accent/10 text-accent shadow-sm',
};

export function StatVerticalCard({
  title,
  stats,
  subtitle,
  avatarIcon: AvatarIcon,
  avatarColor = 'primary',
  trend,
  className,
}: StatVerticalCardProps) {
  return (
    <Card className={cn('h-full transition-all duration-200 hover:shadow-md', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              avatarColorClasses[avatarColor]
            )}
          >
            <AvatarIcon className="w-6 h-6" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Atualizar</DropdownMenuItem>
              <DropdownMenuItem>Compartilhar</DropdownMenuItem>
              <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="space-y-2">
          <p className="text-[13px] font-medium text-muted-foreground tracking-tight">{title}</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold tracking-[-0.04em]">{stats}</p>
            {trend && (
              <div
                className={cn(
                  'flex items-center gap-0.5 mb-1 text-sm font-medium',
                  trend.isPositive !== false ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
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
          {subtitle && (
            <p className="text-sm text-muted-foreground leading-relaxed">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

