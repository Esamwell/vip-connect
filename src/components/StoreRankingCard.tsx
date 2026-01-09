import { motion } from 'framer-motion';
import { Star, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StoreRankingCardProps {
  position: number;
  storeName: string;
  rating: number;
  totalReviews: number;
  trend?: 'up' | 'down' | 'stable';
  isCurrentStore?: boolean;
}

export function StoreRankingCard({
  position,
  storeName,
  rating,
  totalReviews,
  trend = 'stable',
  isCurrentStore = false,
}: StoreRankingCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground';

  const positionStyles = {
    1: 'gradient-vip text-primary shadow-vip',
    2: 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700',
    3: 'bg-gradient-to-br from-amber-600 to-amber-700 text-amber-100',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative rounded-xl p-4 transition-all duration-300 ${
        isCurrentStore 
          ? 'bg-primary/5 border-2 border-primary shadow-lg' 
          : 'bg-card border border-border hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Position Badge */}
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 ${
            positionStyles[position as keyof typeof positionStyles] || 'bg-secondary text-secondary-foreground'
          }`}
        >
          {position}º
        </div>

        {/* Store Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground truncate">
            {storeName}
            {isCurrentStore && (
              <span className="ml-2 text-xs text-primary font-normal">(Sua loja)</span>
            )}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => {
                // Converter nota de 0-10 para 0-5 para as estrelas
                const ratingInStars = (rating / 2);
                return (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(ratingInStars)
                        ? 'text-vip-gold fill-vip-gold'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                );
              })}
            </div>
            <span className="text-sm font-semibold text-foreground">
              {rating.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">
              ({totalReviews} avaliações)
            </span>
          </div>
        </div>

        {/* Trend Indicator */}
        <div className={`flex items-center gap-1 ${trendColor}`}>
          <TrendIcon className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  );
}
