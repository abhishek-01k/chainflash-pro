import React from 'react';
import { Zap, Repeat, Shield, Clock, Activity, Cpu, Coins } from 'lucide-react';

const Features = () => {
  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Revolutionary Features
          </h2>
          <p className="text-gray-400 text-lg">
            ChainFlash Pro combines the latest DeFi innovations to create a trading experience unlike any other
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Zap className="h-8 w-8 text-yellow-400" />}
            title="Gas-Free Trading"
            description="Execute trades instantly using Nitrolite state channels without paying any gas fees"
            highlight="yellow"
          />

          <FeatureCard
            icon={<Repeat className="h-8 w-8 text-teal-400" />}
            title="Cross-Chain Swaps"
            description="Seamlessly trade between Bitcoin and Ethereum using atomic swaps via 1inch Fusion+"
            highlight="teal"
          />

          <FeatureCard
            icon={<Shield className="h-8 w-8 text-purple-400" />}
            title="MEV Protection"
            description="Advanced front-running resistance with Pyth Network oracle integration"
            highlight="purple"
          />

          <FeatureCard
            icon={<Clock className="h-8 w-8 text-blue-400" />}
            title="Instant Settlement"
            description="Sub-second trade confirmation and settlement through state channels"
            highlight="blue"
          />

          <FeatureCard
            icon={<Activity className="h-8 w-8 text-red-400" />}
            title="Advanced Order Types"
            description="TWAP, Limit Orders, Options and Concentrated Liquidity strategies"
            highlight="red"
          />

          <FeatureCard
            icon={<Cpu className="h-8 w-8 text-green-400" />}
            title="Professional UX"
            description="TradFi-level trading experience designed for serious DeFi traders"
            highlight="green"
          />
        </div>
      </div>
    </section>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight: 'yellow' | 'teal' | 'purple' | 'blue' | 'red' | 'green';
}

const getHighlightColor = (color: string) => {
  const colors = {
    yellow: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/20',
    teal: 'from-teal-500/20 to-teal-500/5 border-teal-500/20',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/20',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/20',
    red: 'from-red-500/20 to-red-500/5 border-red-500/20',
    green: 'from-green-500/20 to-green-500/5 border-green-500/20',
  };
  return colors[color as keyof typeof colors] || colors.teal;
};

const FeatureCard = ({ icon, title, description, highlight }: FeatureCardProps) => {
  const highlightColor = getHighlightColor(highlight);

  return (
    <div className={`relative bg-gradient-to-b ${highlightColor} p-6 rounded-xl border backdrop-blur-sm group hover:scale-[1.02] transition-transform duration-300`}>
      <div className="absolute inset-0 bg-slate-900/50 rounded-xl -z-10"></div>
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
};

export default Features;