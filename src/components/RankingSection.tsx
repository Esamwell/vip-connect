import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Loader2 } from 'lucide-react';
import { StoreRankingCard } from './StoreRankingCard';
import { api } from '@/services/api';

interface LojaRanking {
  id: string;
  nome: string;
  nota_media: number | null;
  quantidade_avaliacoes: number;
  posicao_ranking: number;
}

export function RankingSection() {
  const [ranking, setRanking] = useState<LojaRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadRanking();
  }, []);

  const loadRanking = async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await api.get<LojaRanking[]>('/ranking/lojas');
      
      // Limitar a 5 primeiras lojas e formatar dados
      const rankingFormatado = (data || [])
        .slice(0, 5)
        .map((loja) => ({
          ...loja,
          nota_media: loja.nota_media != null ? Number(loja.nota_media) : 0,
          quantidade_avaliacoes: Number(loja.quantidade_avaliacoes) || 0,
          posicao_ranking: Number(loja.posicao_ranking) || 0,
        }));
      
      setRanking(rankingFormatado);
    } catch (error) {
      console.error('Erro ao carregar ranking:', error);
      setError(true);
      setRanking([]);
    } finally {
      setLoading(false);
    }
  };
  return (
    <section id="ranking" className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4 border" style={{ 
            backgroundColor: 'rgba(164, 19, 22, 0.1)',
            color: '#a41316',
            borderColor: 'rgba(164, 19, 22, 0.2)'
          }}>
            <Trophy className="w-4 h-4" />
            Ranking de Lojas
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            As Melhores Lojas do Shopping
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Ranking baseado nas avaliações dos clientes VIP. Transparência total 
            para você escolher sempre as melhores opções.
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#a41316' }} />
            </div>
          ) : error || ranking.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Nenhum ranking disponível no momento. Aguarde as primeiras avaliações dos clientes VIP.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {ranking.map((loja, index) => {
                // Determinar trend baseado na posição (pode ser melhorado com histórico)
                const getTrend = (position: number): 'up' | 'down' | 'stable' => {
                  // Por enquanto, vamos usar 'stable' como padrão
                  // Pode ser melhorado no futuro com dados históricos
                  return 'stable';
                };

                return (
                  <motion.div
                    key={loja.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <StoreRankingCard
                      position={loja.posicao_ranking}
                      storeName={loja.nome}
                      rating={loja.nota_media || 0} // Nota de 0-10 (será exibida como está)
                      totalReviews={loja.quantidade_avaliacoes}
                      trend={getTrend(loja.posicao_ranking)}
                    />
                  </motion.div>
                );
              })}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Star className="w-4 h-4 fill-[#a41316]" style={{ color: '#a41316' }} />
              Avaliações verificadas de clientes VIP reais
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
