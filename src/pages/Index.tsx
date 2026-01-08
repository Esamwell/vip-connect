import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { BenefitsSection } from '@/components/BenefitsSection';
import { RankingSection } from '@/components/RankingSection';
import { CtaSection } from '@/components/CtaSection';
import { Footer } from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <BenefitsSection />
        <RankingSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
