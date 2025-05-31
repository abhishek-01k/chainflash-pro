import React, { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, Zap, LineChart, BarChart4, RefreshCw } from 'lucide-react';
import Link from 'next/link';

const LandingPage = () => {
    const [animationStep, setAnimationStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setAnimationStep((prev) => (prev + 1) % 4);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <>
            <section className="pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden relative">
                {/* Background Elements */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute -top-10 -right-10 w-64 h-64 bg-purple-500/10 dark:bg-purple-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 -left-20 w-80 h-80 bg-teal-500/10 dark:bg-teal-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-1/2 bg-gradient-radial from-slate-200/50 dark:from-slate-800/50 to-transparent"></div>
                </div>

                <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 mb-6">
                            <Zap size={14} className="text-yellow-500 dark:text-yellow-400 mr-2" />
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Revolutionary Cross-Chain Trading</span>
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-white dark:via-gray-100 dark:to-gray-300">
                            High-Frequency Trading at the Speed of Light
                        </h1>

                        <p className="text-lg md:text-xl text-slate-600 dark:text-gray-400 mb-8 max-w-2xl">
                            ChainFlash Pro combines cutting-edge DeFi protocols with state channels for instant, gas-free trades across multiple blockchains.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 mb-16">
                            <Link href='/channels'>
                                <button className="px-8 py-3 rounded-lg bg-gradient-to-r from-teal-500 to-purple-600 text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center">
                                    Get Started <ArrowRight size={18} className="ml-2" />
                                </button>
                            </Link>
                            <button className="px-8 py-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center">
                                View Demo <ArrowUpRight size={18} className="ml-2" />
                            </button>
                        </div>

                        {/* Trading Animation */}
                        <div className="relative w-full max-w-4xl mx-auto bg-slate-100/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-2xl">
                            <div className="absolute -top-3 left-4 flex space-x-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center">
                                            <LineChart size={20} className="text-teal-500 dark:text-teal-400 mr-2" />
                                            <span className="font-semibold text-slate-900 dark:text-slate-100">Trade Execution</span>
                                        </div>
                                        <div className="px-2 py-1 bg-teal-500/20 text-teal-600 dark:text-teal-400 text-xs rounded-md flex items-center">
                                            <span className="relative flex h-2 w-2 mr-1">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-500 dark:bg-teal-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600 dark:bg-teal-500"></span>
                                            </span>
                                            Live
                                        </div>
                                    </div>

                                    <div className="flex-1 bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                                        <div className="space-y-3">
                                            <TradeStep
                                                active={animationStep >= 0}
                                                label="Nitrolite Channel Open"
                                                detail="Gas-free state channel activated"
                                            />
                                            <TradeStep
                                                active={animationStep >= 1}
                                                label="Price Oracle Confirmation"
                                                detail="Pyth Network price verified"
                                            />
                                            <TradeStep
                                                active={animationStep >= 2}
                                                label="Cross-Chain Execution"
                                                detail="ETH → BTC atomic swap initiated"
                                            />
                                            <TradeStep
                                                active={animationStep >= 3}
                                                label="Trade Settlement"
                                                detail="Confirmed in 0.3 seconds"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center">
                                            <BarChart4 size={20} className="text-purple-500 dark:text-purple-400 mr-2" />
                                            <span className="font-semibold text-slate-900 dark:text-slate-100">Market Data</span>
                                        </div>
                                        <div className="flex items-center text-slate-600 dark:text-gray-400 text-sm">
                                            <RefreshCw size={14} className="mr-1" />
                                            Real-time
                                        </div>
                                    </div>

                                    <div className="flex-1 bg-white dark:bg-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-800">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-slate-600 dark:text-gray-400">Asset</span>
                                            <span className="text-slate-600 dark:text-gray-400">Price</span>
                                        </div>

                                        <div className="space-y-3">
                                            <PriceRow symbol="BTC/USD" price="63,245.78" change="+2.4%" positive />
                                            <PriceRow symbol="ETH/USD" price="3,128.45" change="-0.8%" positive={false} />
                                            <PriceRow symbol="SOL/USD" price="142.87" change="+5.6%" positive />
                                            <PriceRow symbol="ARB/USD" price="1.24" change="+1.2%" positive />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </>
    );
};

const TradeStep = ({ active, label, detail }: { active: boolean; label: string; detail: string }) => (
    <div className={`flex items-center ${active ? 'opacity-100' : 'opacity-40'} transition-opacity duration-500`}>
        <div className={`w-4 h-4 rounded-full ${active ? 'bg-teal-500' : 'bg-slate-300 dark:bg-gray-600'} mr-3 flex-shrink-0`}></div>
        <div className="flex-1">
            <div className="font-medium text-slate-900 dark:text-slate-100">{label}</div>
            <div className="text-sm text-slate-600 dark:text-gray-400">{detail}</div>
        </div>
    </div>
);

const PriceRow = ({ symbol, price, change, positive }: { symbol: string; price: string; change: string; positive: boolean }) => (
    <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-800">
        <div className="font-mono text-slate-900 dark:text-slate-100">{symbol}</div>
        <div className="flex items-center">
            <div className="font-mono mr-2 text-slate-900 dark:text-slate-100">${price}</div>
            <div className={`text-xs ${positive ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                {change}
            </div>
        </div>
    </div>
);

export default LandingPage;