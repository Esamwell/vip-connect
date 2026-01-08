import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/services/api';
import { Trophy, Star, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LojaRanking {
  loja_id: string;
  loja_nome: string;
  nota_media: number;
  total_avaliacoes: number;
  posicao: number;
}

export default function Ranking() {
  const [ranking, setRanking] = useState<LojaRanking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRanking();
  }, []);

  const loadRanking = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ranking/lojas');
      setRanking(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar ranking:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (posicao: number) => {
    if (posicao === 1) return '🥇';
    if (posicao === 2) return '🥈';
    if (posicao === 3) return '🥉';
    return posicao;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-[-0.03em]">Ranking de Lojas</h1>
        <p className="text-muted-foreground text-[15px] leading-relaxed">
          Ranking público baseado nas avaliações dos clientes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Top Lojas
          </CardTitle>
          <CardDescription>
            Lojas com melhor avaliação pelos clientes VIP
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ranking.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum ranking disponível ainda
            </p>
          ) : (
            <div className="space-y-4">
              {ranking.map((loja) => (
                <div
                  key={loja.loja_id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl font-bold w-12 text-center">
                      {getMedalIcon(loja.posicao)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{loja.loja_nome}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">
                          {loja.nota_media.toFixed(1)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({loja.total_avaliacoes} avaliações)
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    #{loja.posicao}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

