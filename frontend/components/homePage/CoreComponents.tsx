import React, { useState } from 'react';
import { Target, Zap, Globe, LineChart } from 'lucide-react';

const CoreComponents = () => {
    const [activeTab, setActiveTab] = useState('trading');

    return (
        <section className="py-20 bg-slate-950 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/0 to-slate-950 pointer-events-none"></div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Core Components
                    </h2>
                    <p className="text-gray-400 text-lg">
                        ChainFlash Pro is built on four powerful pillars that work together to deliver exceptional trading performance
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="bg-slate-900/50 rounded-xl p-1 mb-8">
                            <div className="grid grid-cols-4 gap-1">
                                <TabButton
                                    icon={<Target size={18} />}
                                    label="Trading Engine"
                                    active={activeTab === 'trading'}
                                    onClick={() => setActiveTab('trading')}
                                />
                                <TabButton
                                    icon={<Zap size={18} />}
                                    label="State Channels"
                                    active={activeTab === 'state'}
                                    onClick={() => setActiveTab('state')}
                                />
                                <TabButton
                                    icon={<Globe size={18} />}
                                    label="Cross-Chain"
                                    active={activeTab === 'cross'}
                                    onClick={() => setActiveTab('cross')}
                                />
                                <TabButton
                                    icon={<LineChart size={18} />}
                                    label="Price Oracle"
                                    active={activeTab === 'oracle'}
                                    onClick={() => setActiveTab('oracle')}
                                />
                            </div>
                        </div>

                        <div className="bg-slate-900/30 backdrop-blur-sm border border-slate-800 rounded-xl p-6 shadow-xl">
                            {activeTab === 'trading' && (
                                <ComponentContent
                                    title="Trading Engine"
                                    description="A high-performance execution system that handles various order types with lightning-fast processing."
                                    features={[
                                        "Market Orders via 1inch API",
                                        "Limit Orders with 1inch Protocol",
                                        "TWAP Order Execution",
                                        "Options Trading with Automated Settlement"
                                    ]}
                                    color="from-blue-500/20 to-blue-500/5"
                                />
                            )}

                            {activeTab === 'state' && (
                                <ComponentContent
                                    title="State Channel Manager"
                                    description="Gas-free trading environment based on Nitrolite (ERC-7824) state channels for instant execution."
                                    features={[
                                        "Multi-party Channel Creation",
                                        "Gas-free Execution Within Channels",
                                        "Real-time WebSocket State Updates",
                                        "On-chain Settlement When Required"
                                    ]}
                                    color="from-yellow-500/20 to-yellow-500/5"
                                />
                            )}

                            {activeTab === 'cross' && (
                                <ComponentContent
                                    title="Cross-Chain Bridge"
                                    description="Seamless trading between different blockchains through secure atomic swap mechanisms."
                                    features={[
                                        "Bitcoin-Ethereum Atomic Swaps via HTLCs",
                                        "Multi-Chain Support (ETH, ARB, Polygon)",
                                        "Time-locked Security Mechanisms",
                                        "Cryptographic Proof Verification"
                                    ]}
                                    color="from-teal-500/20 to-teal-500/5"
                                />
                            )}

                            {activeTab === 'oracle' && (
                                <ComponentContent
                                    title="Price Oracle System"
                                    description="Accurate and manipulation-resistant price feeds for reliable trading decisions."
                                    features={[
                                        "Real-time Pyth Network Feeds",
                                        "MEV Protection Mechanisms",
                                        "Cross-chain Price Aggregation",
                                        "Automated Arbitrage Detection"
                                    ]}
                                    color="from-purple-500/20 to-purple-500/5"
                                />
                            )}
                        </div>
                    </div>

                    <div className="relative bg-slate-900/30 backdrop-blur-sm border border-slate-800 rounded-xl p-8 shadow-xl">
                        {activeTab === 'trading' && <TradingEngineVisual />}
                        {activeTab === 'state' && <StateChannelVisual />}
                        {activeTab === 'cross' && <CrossChainVisual />}
                        {activeTab === 'oracle' && <PriceOracleVisual />}
                    </div>
                </div>
            </div>
        </section>
    );
};

interface TabButtonProps {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
}

const TabButton = ({ icon, label, active, onClick }: TabButtonProps) => (
    <button
        className={`flex flex-col items-center justify-center py-3 rounded-lg transition-colors ${active ? 'bg-slate-800' : 'hover:bg-slate-800/50'
            }`}
        onClick={onClick}
    >
        <div className={`mb-1 ${active ? 'text-teal-400' : 'text-gray-400'}`}>{icon}</div>
        <span className={`text-xs ${active ? 'text-white' : 'text-gray-400'}`}>{label}</span>
    </button>
);

interface ComponentContentProps {
    title: string;
    description: string;
    features: string[];
    color: string;
}

const ComponentContent = ({ title, description, features, color }: ComponentContentProps) => (
    <div>
        <div className={`inline-block px-4 py-1 rounded-full bg-gradient-to-r ${color} mb-4`}>
            <span className="text-sm font-semibold">{title}</span>
        </div>
        <p className="text-gray-300 mb-6">{description}</p>
        <ul className="space-y-3">
            {features.map((feature, index) => (
                <li key={index} className="flex items-start">
                    <div className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center mt-0.5 mr-3">
                        <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                    </div>
                    <span className="text-gray-400">{feature}</span>
                </li>
            ))}
        </ul>
    </div>
);

// Visual components for each tab
const TradingEngineVisual = () => (
    <div className="h-full flex flex-col">
        <div className="text-xl font-semibold mb-4 text-center">Trading Engine Flow</div>
        <div className="flex-1 flex flex-col justify-center items-center">
            <div className="w-full max-w-sm space-y-4">
                <div className="relative">
                    <div className="absolute left-6 top-1/2 w-0.5 h-16 bg-blue-500/50 -translate-y-1/2"></div>
                    <div className="relative z-10 flex items-center">
                        <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/50">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        </div>
                        <div className="ml-4 bg-slate-800 p-3 rounded-lg flex-1">
                            <div className="font-medium">Order Submission</div>
                            <div className="text-sm text-gray-400">Trade parameters received</div>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <div className="absolute left-6 top-1/2 w-0.5 h-16 bg-blue-500/50 -translate-y-1/2"></div>
                    <div className="relative z-10 flex items-center">
                        <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/50">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        </div>
                        <div className="ml-4 bg-slate-800 p-3 rounded-lg flex-1">
                            <div className="font-medium">Route Optimization</div>
                            <div className="text-sm text-gray-400">Best execution path determined</div>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <div className="absolute left-6 top-1/2 w-0.5 h-16 bg-blue-500/50 -translate-y-1/2"></div>
                    <div className="relative z-10 flex items-center">
                        <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/50">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        </div>
                        <div className="ml-4 bg-slate-800 p-3 rounded-lg flex-1">
                            <div className="font-medium">Trade Execution</div>
                            <div className="text-sm text-gray-400">Order filled via optimal protocol</div>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <div className="relative z-10 flex items-center">
                        <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/50">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        </div>
                        <div className="ml-4 bg-slate-800 p-3 rounded-lg flex-1">
                            <div className="font-medium">Settlement</div>
                            <div className="text-sm text-gray-400">Trade finalized and assets transferred</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const StateChannelVisual = () => (
    <div className="h-full flex flex-col">
        <div className="text-xl font-semibold mb-6 text-center">State Channel Operation</div>

        <div className="relative p-6 bg-slate-800 rounded-xl mb-6">
            <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-500/20 rounded-full">
                <span className="text-xs text-yellow-400">Channel Active</span>
            </div>

            <div className="flex flex-col">
                <div className="font-medium mb-2">Channel Details</div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex flex-col">
                        <span className="text-gray-400">Channel ID</span>
                        <span className="font-mono">0x7fc3...e912</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-400">Participants</span>
                        <span className="font-mono">3</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-400">Balance</span>
                        <span className="font-mono">12.45 ETH</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-gray-400">State Nonce</span>
                        <span className="font-mono">278</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="flex-1 relative">
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-64 h-64">
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-yellow-500/30 animate-[spin_20s_linear_infinite]"></div>

                    <div className="absolute w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center border border-yellow-500/50 left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                        <span className="text-xs font-medium">User A</span>
                    </div>

                    <div className="absolute w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center border border-yellow-500/50 right-0 top-1/2 translate-x-1/2 -translate-y-1/2">
                        <span className="text-xs font-medium">User B</span>
                    </div>

                    <div className="absolute w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center border border-yellow-500/50 left-0 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <span className="text-xs font-medium">User C</span>
                    </div>

                    <div className="absolute w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border border-yellow-500/50">
                        <span className="text-sm font-medium text-center">State<br />Channel</span>
                    </div>

                    <div className="absolute inset-0 rounded-full border-4 border-yellow-500/10"></div>
                </div>
            </div>
        </div>
    </div>
);

const CrossChainVisual = () => (
    <div className="h-full flex flex-col">
        <div className="text-xl font-semibold mb-6 text-center">Cross-Chain Bridge</div>

        <div className="flex-1 relative py-6">
            <div className="grid grid-cols-2 gap-8 h-full">
                <div className="flex flex-col items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-slate-800 border-4 border-orange-500/50 flex items-center justify-center mb-4">
                        <div className="text-3xl font-bold text-orange-500">₿</div>
                    </div>
                    <div className="text-lg font-medium">Bitcoin</div>
                    <div className="text-sm text-gray-400 mb-4">HTLC Contract</div>

                    <div className="px-4 py-2 bg-slate-800 rounded-lg border border-slate-700 w-full max-w-xs text-sm">
                        <div className="font-mono overflow-hidden text-ellipsis text-xs text-gray-400">
                            Hash: x8a72f...e29d1
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-slate-800 border-4 border-teal-500/50 flex items-center justify-center mb-4">
                        <div className="text-3xl font-bold text-teal-500">Ξ</div>
                    </div>
                    <div className="text-lg font-medium">Ethereum</div>
                    <div className="text-sm text-gray-400 mb-4">HTLC Contract</div>

                    <div className="px-4 py-2 bg-slate-800 rounded-lg border border-slate-700 w-full max-w-xs text-sm">
                        <div className="font-mono overflow-hidden text-ellipsis text-xs text-gray-400">
                            Hash: x8a72f...e29d1
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-px bg-gradient-to-r from-orange-500 to-teal-500">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center border border-slate-600">
                    <div className="animate-ping absolute w-2 h-2 rounded-full bg-teal-500"></div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-slate-800 rounded-lg">
                <div className="font-medium mb-1">Lock Time</div>
                <div className="text-gray-400">6 hours</div>
            </div>
            <div className="p-3 bg-slate-800 rounded-lg">
                <div className="font-medium mb-1">Security</div>
                <div className="text-gray-400">Time-locked refunds</div>
            </div>
        </div>
    </div>
);

const PriceOracleVisual = () => (
    <div className="h-full flex flex-col">
        <div className="text-xl font-semibold mb-6 text-center">Price Oracle System</div>

        <div className="flex-1 relative">
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-64 h-64">
                    <div className="absolute inset-0 rounded-full border-2 border-purple-500/30"></div>

                    <div className="absolute w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center border border-purple-500/50 left-0 top-1/4 -translate-x-1/2 -translate-y-1/2">
                        <span className="text-xs font-medium">Source 1</span>
                    </div>

                    <div className="absolute w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center border border-purple-500/50 left-1/4 top-0 -translate-x-1/2 -translate-y-1/2">
                        <span className="text-xs font-medium">Source 2</span>
                    </div>

                    <div className="absolute w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center border border-purple-500/50 right-1/4 top-0 translate-x-1/2 -translate-y-1/2">
                        <span className="text-xs font-medium">Source 3</span>
                    </div>

                    <div className="absolute w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center border border-purple-500/50 right-0 top-1/4 translate-x-1/2 -translate-y-1/2">
                        <span className="text-xs font-medium">Source 4</span>
                    </div>

                    <div className="absolute w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center border border-purple-500/50 right-0 bottom-1/4 translate-x-1/2 translate-y-1/2">
                        <span className="text-xs font-medium">Source 5</span>
                    </div>

                    <div className="absolute w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center border border-purple-500/50 right-1/4 bottom-0 translate-x-1/2 translate-y-1/2">
                        <span className="text-xs font-medium">Source 6</span>
                    </div>

                    <div className="absolute w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center border border-purple-500/50 left-1/4 bottom-0 -translate-x-1/2 translate-y-1/2">
                        <span className="text-xs font-medium">Source 7</span>
                    </div>

                    <div className="absolute w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center border border-purple-500/50 left-0 bottom-1/4 -translate-x-1/2 translate-y-1/2">
                        <span className="text-xs font-medium">Source 8</span>
                    </div>

                    <div className="absolute w-24 h-24 bg-purple-500/20 rounded-full flex items-center justify-center left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border border-purple-500/50">
                        <span className="text-sm font-medium text-center">Pyth<br />Network</span>
                    </div>

                    <div className="absolute inset-0 rounded-full border-4 border-purple-500/10"></div>
                </div>
            </div>
        </div>

        <div className="p-4 bg-slate-800 rounded-lg">
            <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Aggregated Price</span>
                <span className="text-sm text-purple-400">Confidence: 99.7%</span>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-2xl font-mono">$63,245.78</span>
                <span className="text-green-500 text-sm">+2.4%</span>
            </div>
        </div>
    </div>
);

export default CoreComponents;