import React from "react";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const features: Feature[] = [
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    ),
    title: "Secure",
    description:
      "Protected by battle-tested smart contracts and comprehensive security audits",
    color: "blue",
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
    title: "Lightning Fast",
    description:
      "Near-instant transfers with optimized gas fees and quick confirmations",
    color: "green",
  },
  {
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
        />
      </svg>
    ),
    title: "Reliable",
    description:
      "Built on proven infrastructure with 99.9% uptime and continuous monitoring",
    color: "purple",
  },
];

const FeatureCard = ({ feature }: { feature: Feature }) => {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-400",
    green: "bg-green-500/10 text-green-400",
    purple: "bg-purple-500/10 text-purple-400",
  };

  return (
    <div className="group text-center p-6 bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 hover:border-gray-600/70 transition-all duration-300">
      <div
        className={`w-14 h-14 ${colorClasses[feature.color as keyof typeof colorClasses]} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}
      >
        {feature.icon}
      </div>
      <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">
        {feature.description}
      </p>
    </div>
  );
};

const FeatureSection = () => {
  return (
    <section className="py-20 border-t border-gray-800">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-wider">
            Why Choose GoodNet?
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Experience the next generation of cross-chain infrastructure
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
