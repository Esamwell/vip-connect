import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyticsCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  footer?: ReactNode;
}

export function AnalyticsCard({
  title,
  subtitle,
  children,
  action,
  className,
  footer,
}: AnalyticsCardProps) {
  return (
    <Card className={cn('transition-all duration-200 hover:shadow-md', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold tracking-tight">{title}</CardTitle>
          {subtitle && <p className="text-sm text-muted-foreground leading-relaxed">{subtitle}</p>}
        </div>
        {action || (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Atualizar</DropdownMenuItem>
              <DropdownMenuItem>Compartilhar</DropdownMenuItem>
              <DropdownMenuItem>Exportar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer && <div className="px-6 pb-6">{footer}</div>}
    </Card>
  );
}

