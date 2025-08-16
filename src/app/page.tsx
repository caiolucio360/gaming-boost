import FeaturedServicesSection from "@/components/layout/featuredServicesSection";
import FeaturesSection from "@/components/layout/featuresSection";
import GamesSection from "@/components/layout/gamesSection";
import HeroSection from "@/components/layout/heroSection";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <GamesSection />
      <FeaturedServicesSection />
      <FeaturesSection />
    </div>
  )
}