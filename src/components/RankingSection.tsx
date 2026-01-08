import { motion } from 'framer-motion';
import { Trophy, Star } from 'lucide-react';
import { StoreRankingCard } from './StoreRankingCard';

const rankingData = [
  { position: 1, storeName: 'Premium Motors', rating: 9.8, totalReviews: 234, trend: 'up' as const },
  { position: 2, storeName: 'Auto Elite', rating: 9.6, totalReviews: 189, trend: 'stable' as const },
  { position: 3, storeName: 'Veículos Luxo', rating: 9.5, totalReviews: 156, trend: 'up' as const },
  { position: 4, storeName: 'Car Express', rating: 9.3, totalReviews: 201, trend: 'down' as const },
  { position: 5, storeName: 'Auto Shopping Prime', rating: 9.2, totalReviews: 178, trend: 'stable' as const },
];

export function RankingSection() {
  return (
    <section id="ranking" className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-vip-gold/10 text-vip-gold-dark text-sm font-medium mb-4">
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
          <div className="space-y-3">
            {rankingData.map((store, index) => (
              <motion.div
                key={store.storeName}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <StoreRankingCard {...store} />
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Star className="w-4 h-4 text-vip-gold fill-vip-gold" />
              Avaliações verificadas de clientes VIP reais
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
