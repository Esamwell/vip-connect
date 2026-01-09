import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/services/api';
import { Trophy, Star, Eye, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

interface LojaRanking {
  id: string;
  nome: string;
  nota_media: number | null;
  quantidade_avaliacoes: number;
  posicao_ranking: number;
}

interface Avaliacao {
  id: string;
  nota: number;
  comentario: string | null;
  nome_exibido: string;
  cliente_nome: string;
  created_at: string;
}

export default function Ranking() {
  const [ranking, setRanking] = useState<LojaRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [avaliacoesModalOpen, setAvaliacoesModalOpen] = useState(false);
  const [lojaSelecionada, setLojaSelecionada] = useState<LojaRanking | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loadingAvaliacoes, setLoadingAvaliacoes] = useState(false);

  useEffect(() => {
    loadRanking();
  }, []);

  const loadRanking = async () => {
    try {
      setLoading(true);
      const data = await api.get<LojaRanking[]>('/ranking/lojas');
      console.log('[Ranking Frontend] Dados recebidos:', data);
      console.log('[Ranking Frontend] Total de lojas:', data?.length || 0);
      
      // Garantir que os dados estejam no formato correto
      const rankingFormatado = (data || []).map((loja) => ({
        ...loja,
        nota_media: loja.nota_media != null ? Number(loja.nota_media) : null,
        quantidade_avaliacoes: Number(loja.quantidade_avaliacoes) || 0,
        posicao_ranking: Number(loja.posicao_ranking) || 0,
      }));
      
      setRanking(rankingFormatado);
    } catch (error: any) {
      console.error('Erro ao carregar ranking:', error);
      console.error('Detalhes do erro:', error.response?.data || error.message);
      setRanking([]);
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

  const handleVerAvaliacoes = async (loja: LojaRanking) => {
    setLojaSelecionada(loja);
    setAvaliacoesModalOpen(true);
    setLoadingAvaliacoes(true);
    
    try {
      const data = await api.get<Avaliacao[]>(`/ranking/lojas/${loja.id}/avaliacoes`);
      setAvaliacoes(data || []);
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
      setAvaliacoes([]);
    } finally {
      setLoadingAvaliacoes(false);
    }
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
              Nenhum ranking disponível ainda. Aguarde as primeiras avaliações dos clientes VIP.
            </p>
          ) : (
            <div className="space-y-4">
              {ranking.map((loja) => (
                <div
                  key={loja.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-3xl font-bold w-12 text-center">
                      {getMedalIcon(loja.posicao_ranking)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{loja.nome}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">
                          {loja.nota_media != null ? Number(loja.nota_media).toFixed(1) : '0.0'}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({loja.quantidade_avaliacoes || 0} avaliações)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {loja.quantidade_avaliacoes > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerAvaliacoes(loja)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Ver Avaliações
                      </Button>
                    )}
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      #{loja.posicao_ranking}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Avaliações */}
      <Dialog open={avaliacoesModalOpen} onOpenChange={setAvaliacoesModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Avaliações - {lojaSelecionada?.nome}
            </DialogTitle>
            <DialogDescription>
              {lojaSelecionada?.quantidade_avaliacoes || 0} avaliações recebidas
            </DialogDescription>
          </DialogHeader>
          
          {loadingAvaliacoes ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : avaliacoes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma avaliação encontrada para esta loja.</p>
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              {avaliacoes.map((avaliacao) => (
                <Card key={avaliacao.id} className="border-l-4 border-l-primary">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-sm">
                            {avaliacao.nome_exibido}
                          </span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= Math.ceil(avaliacao.nota / 2)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            ))}
                            <span className="ml-1 text-sm font-medium">
                              ({avaliacao.nota}/10)
                            </span>
                          </div>
                        </div>
                        {avaliacao.comentario && (
                          <p className="text-sm text-foreground mb-2 whitespace-pre-wrap">
                            {avaliacao.comentario}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(avaliacao.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

