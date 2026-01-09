import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function ParceiroConfiguracoes() {
  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-[-0.03em]">Configurações</h1>
        <p className="text-muted-foreground text-[15px] leading-relaxed">
          Configure as opções da sua conta de parceiro
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações da Conta
          </CardTitle>
          <CardDescription>
            Em breve: configurações da sua conta de parceiro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Esta seção estará disponível em breve.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}



