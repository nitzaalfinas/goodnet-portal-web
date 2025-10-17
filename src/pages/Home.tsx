import BridgeSection from "@/components/home/BridgeSection";
import FeatureSection from "@/components/home/FeatureSection";

const HomePage = () => {
  return (
    <div className="py-20 bg-gradient-to-b from-main-bg to-gray-900">
      <BridgeSection />
      <FeatureSection />
    </div>
  );
};

export default HomePage;
