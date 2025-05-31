import React, { useState, useEffect } from 'react';
import { LineChart, BarChart4, Activity, Shield } from 'lucide-react';

const PricingOracle = () => {
    const [animationProgress, setAnimationProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setAnimationProgress((prev) => {
                if (prev >= 100) return 0;
                return prev + 1;
            });
        }, 50);

        return () => clearInterval(interval);
    }, []);

    return (
        <section className="py-20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-slate-900 pointer-events-none"></div>

            {/* Background elements */}
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-purple-500/5 rounded-full blur-3xl"></div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Real-Time Price Oracle
                    </h2>
                    <p className="text-gray-400 text-lg">
                        Get accurate, manipulation-resistant price feeds with MEV protection
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="bg-slate-900/30 backdrop-blur-sm border border-slate-700 rounded-xl p-6 shadow-xl">
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center">
                                    <LineChart className="h-5 w-5 text-purple-400 mr-2" />
                                    <h3 className="text-xl font-semibold">Pyth Network Integration</h3>
                                </div>
                                <div className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">
                                    Live Feed
                                </div>
                            </div>

                            <p className="text-gray-400 mb-4">
                                ChainFlash Pro leverages Pyth Network's high-fidelity price oracle to ensure traders always have access to accurate, real-time market data.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="text-sm font-medium">BTC/USD</div>
                                    <div className="flex items-center text-green-500 text-sm">
                                        <Activity className="h-3 w-3 mr-1" />
                                        +1.2%
                                    </div>
                                </div>

                                <div className="relative h-12 bg-slate-800 rounded-lg overflow-hidden">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500/40 to-teal-500/40"
                                        style={{ width: `${animationProgress}%` }}
                                    ></div>

                                    <div className="absolute inset-0 flex items-center justify-between px-4">
                                        <div className="text-2xl font-mono">$63,245.78</div>
                                        <div className="bg-slate-900/60 px-2 py-1 rounded text-xs">
                                            Confidence: 99.7%
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="text-sm font-medium">ETH/USD</div>
                                    <div className="flex items-center text-red-500 text-sm">
                                        <Activity className="h-3 w-3 mr-1" />
                                        -0.5%
                                    </div>
                                </div>

                                <div className="relative h-12 bg-slate-800 rounded-lg overflow-hidden">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500/40 to-teal-500/40"
                                        style={{ width: `${(animationProgress + 30) % 100}%` }}
                                    ></div>

                                    <div className="absolute inset-0 flex items-center justify-between px-4">
                                        <div className="text-2xl font-mono">$3,128.45</div>
                                        <div className="bg-slate-900/60 px-2 py-1 rounded text-xs">
                                            Confidence: 99.5%
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="text-sm font-medium">ARB/USD</div>
                                    <div className="flex items-center text-green-500 text-sm">
                                        <Activity className="h-3 w-3 mr-1" />
                                        +3.8%
                                    </div>
                                </div>

                                <div className="relative h-12 bg-slate-800 rounded-lg overflow-hidden">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500/40 to-teal-500/40"
                                        style={{ width: `${(animationProgress + 60) % 100}%` }}
                                    ></div>

                                    <div className="absolute inset-0 flex items-center justify-between px-4">
                                        <div className="text-2xl font-mono">$1.24</div>
                                        <div className="bg-slate-900/60 px-2 py-1 rounded text-xs">
                                            Confidence: 98.9%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-slate-900/30 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center mr-4">
                                    <Shield className="h-5 w-5 text-teal-400" />
                                </div>
                                <h3 className="text-xl font-semibold">MEV Protection</h3>
                            </div>

                            <p className="text-gray-300 mb-4">
                                ChainFlash Pro implements advanced mechanisms to protect your trades from front-running and other malicious MEV attacks.
                            </p>

                            <div className="space-y-3">
                                <ProtectionFeature
                                    title="Confidence Intervals"
                                    description="Transactions only execute when price confidence meets your threshold"
                                />

                                <ProtectionFeature
                                    title="Private Order Routing"
                                    description="Orders are submitted through protected channels to prevent front-running"
                                />

                                <ProtectionFeature
                                    title="Slippage Protection"
                                    description="Automatic cancellation if price moves beyond your tolerance level"
                                />
                            </div>
                        </div>

                        <div className="bg-slate-900/30 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
                            <div className="flex items-center mb-4">
                                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-4">
                                    <BarChart4 className="h-5 w-5 text-purple-400" />
                                </div>
                                <h3 className="text-xl font-semibold">Multi-Chain Aggregation</h3>
                            </div>

                            <p className="text-gray-300 mb-4">
                                Our system compares prices across multiple blockchains to ensure you always get the best execution rate.
                            </p>

                            <div className="bg-slate-800 rounded-lg p-4">
                                <div className="flex justify-between text-sm mb-2">
                                    <span>Chain</span>
                                    <span>ETH Price</span>
                                    <span>Difference</span>
                                </div>

                                <div className="space-y-2">
                                    <PriceRow chain="Ethereum" price="$3,128.45" difference="Base" highlight={false} />
                                    <PriceRow chain="Arbitrum" price="$3,127.85" difference="-0.02%" highlight={false} />
                                    <PriceRow chain="Optimism" price="$3,130.12" difference="+0.05%" highlight={false} />
                                    <PriceRow chain="Polygon" price="$3,134.87" difference="+0.21%" highlight={true} />
                                </div>

                                <div className="mt-4 text-xs text-gray-400 flex items-center">
                                    <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                                    Arbitrage opportunity detected
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

interface ProtectionFeatureProps {
    title: string;
    description: string;
}

const ProtectionFeature = ({ title, description }: ProtectionFeatureProps) => (
    <div className="flex items-start">
        <div className="w-4 h-4 rounded-full bg-slate-800 border border-teal-500/50 flex items-center justify-center mt-1 mr-3 flex-shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>
        </div>
        <div>
            <div className="font-medium text-gray-200">{title}</div>
            <div className="text-sm text-gray-400">{description}</div>
        </div>
    </div>
);

interface PriceRowProps {
    chain: string;
    price: string;
    difference: string;
    highlight: boolean;
}

const PriceRow = ({ chain, price, difference, highlight }: PriceRowProps) => (
    <div className={`flex justify-between py-2 text-sm border-b border-slate-700 ${highlight ? 'bg-green-500/10 rounded px-2' : ''}`}>
        <span>{chain}</span>
        <span className="font-mono">{price}</span>
        <span className={difference.startsWith('+') ? 'text-green-500' : difference === 'Base' ? 'text-gray-400' : 'text-red-400'}>
            {difference}
        </span>
    </div>
);

export default PricingOracle;