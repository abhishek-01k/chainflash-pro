import React from 'react';
import { ArrowRightCircle, Repeat, ShieldCheck, Clock } from 'lucide-react';

const CrossChain = () => {
    return (
        <section className="py-20 bg-slate-950 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/0 to-slate-950 pointer-events-none"></div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Cross-Chain Capabilities
                    </h2>
                    <p className="text-gray-400 text-lg">
                        Trade seamlessly across multiple blockchains with atomic swaps and trustless bridges
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
                    <div className="lg:col-span-2 space-y-8">
                        <CrossChainFeature
                            icon={<Repeat size={20} />}
                            title="Bitcoin-Ethereum Bridge"
                            description="Swap assets between the two largest blockchain ecosystems without intermediaries"
                            details={[
                                "Atomic Swaps via HTLC contracts",
                                "Timelock safety mechanisms",
                                "Multi-signature security"
                            ]}
                        />

                        <CrossChainFeature
                            icon={<ShieldCheck size={20} />}
                            title="Multi-Chain Arbitrage"
                            description="Automatically capture price differences across different blockchains"
                            details={[
                                "Real-time price monitoring",
                                "Automated execution via smart contracts",
                                "MEV protection"
                            ]}
                        />
                    </div>

                    <div className="lg:col-span-3 relative">
                        <div className="bg-slate-900/30 backdrop-blur-sm border border-slate-700 rounded-xl p-6 shadow-xl">
                            <div className="mb-4 text-center">
                                <h3 className="text-xl font-semibold">Cross-Chain Swap Simulator</h3>
                                <p className="text-gray-400 text-sm">Experience the seamless flow of assets between chains</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="col-span-1 bg-slate-800 rounded-lg p-4">
                                    <div className="text-sm font-medium mb-3">Source Chain</div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs text-gray-400 block mb-1">Blockchain</label>
                                            <div className="relative">
                                                <select className="w-full bg-slate-700 rounded p-2 text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-teal-500">
                                                    <option>Bitcoin</option>
                                                    <option>Ethereum</option>
                                                    <option>Arbitrum</option>
                                                    <option>Polygon</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs text-gray-400 block mb-1">Asset</label>
                                            <div className="relative">
                                                <select className="w-full bg-slate-700 rounded p-2 text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-teal-500">
                                                    <option>BTC</option>
                                                    <option>WBTC</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs text-gray-400 block mb-1">Amount</label>
                                            <div className="flex">
                                                <input
                                                    type="text"
                                                    className="bg-slate-700 border-none rounded-l p-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-teal-500"
                                                    placeholder="0.00"
                                                    defaultValue="0.25"
                                                />
                                                <div className="bg-slate-600 rounded-r px-3 flex items-center text-sm">
                                                    BTC
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-span-1 flex items-center justify-center">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                                            <ArrowRightCircle className="h-6 w-6 text-purple-400" />
                                        </div>
                                        <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-slate-800 rounded text-xs border border-slate-700">
                                            HTLC
                                        </div>
                                    </div>
                                </div>

                                <div className="col-span-1 bg-slate-800 rounded-lg p-4">
                                    <div className="text-sm font-medium mb-3">Destination Chain</div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs text-gray-400 block mb-1">Blockchain</label>
                                            <div className="relative">
                                                <select className="w-full bg-slate-700 rounded p-2 text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-teal-500">
                                                    <option>Ethereum</option>
                                                    <option>Bitcoin</option>
                                                    <option>Arbitrum</option>
                                                    <option>Polygon</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs text-gray-400 block mb-1">Asset</label>
                                            <div className="relative">
                                                <select className="w-full bg-slate-700 rounded p-2 text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-teal-500">
                                                    <option>ETH</option>
                                                    <option>WETH</option>
                                                    <option>USDC</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs text-gray-400 block mb-1">You Receive</label>
                                            <div className="flex">
                                                <input
                                                    type="text"
                                                    className="bg-slate-700 border-none rounded-l p-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-teal-500"
                                                    placeholder="0.00"
                                                    defaultValue="4.32"
                                                    readOnly
                                                />
                                                <div className="bg-slate-600 rounded-r px-3 flex items-center text-sm">
                                                    ETH
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="col-span-1 bg-slate-800 rounded-lg p-3 flex items-center">
                                    <Clock className="h-5 w-5 text-blue-400 mr-3" />
                                    <div>
                                        <div className="text-xs text-gray-400">Estimated Time</div>
                                        <div className="font-medium">~2 minutes</div>
                                    </div>
                                </div>

                                <div className="col-span-1 bg-slate-800 rounded-lg p-3 flex items-center">
                                    <ShieldCheck className="h-5 w-5 text-green-400 mr-3" />
                                    <div>
                                        <div className="text-xs text-gray-400">Security</div>
                                        <div className="font-medium">Cryptographic Proof</div>
                                    </div>
                                </div>

                                <div className="col-span-1 bg-slate-800 rounded-lg p-3 flex items-center">
                                    <Repeat className="h-5 w-5 text-purple-400 mr-3" />
                                    <div>
                                        <div className="text-xs text-gray-400">Swap Rate</div>
                                        <div className="font-medium">1 BTC = 17.28 ETH</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

interface CrossChainFeatureProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    details: string[];
}

const CrossChainFeature = ({ icon, title, description, details }: CrossChainFeatureProps) => (
    <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
        <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-4">
                <div className="text-purple-400">{icon}</div>
            </div>
            <h3 className="text-xl font-semibold">{title}</h3>
        </div>

        <p className="text-gray-300 mb-4 pl-14">{description}</p>

        <div className="space-y-2 pl-14">
            {details.map((detail, index) => (
                <div key={index} className="flex items-start">
                    <div className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                    </div>
                    <span className="text-gray-400">{detail}</span>
                </div>
            ))}
        </div>
    </div>
);

export default CrossChain;