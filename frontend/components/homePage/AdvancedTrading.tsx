import React from 'react';
import { Rocket, BarChart4, Clock, Shield, Target, LineChart } from 'lucide-react';

const AdvancedTrading = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-slate-900 pointer-events-none"></div>

      {/* Background elements */}
      <div className="absolute -right-32 top-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -left-32 bottom-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Advanced Trading Features
          </h2>
          <p className="text-gray-400 text-lg">
            ChainFlash Pro offers sophisticated trading tools for both novice and professional traders
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <TradingFeature
              icon={<Rocket size={20} />}
              title="Market Trading"
              features={[
                "Real-time quotes via 1inch API",
                "Configurable slippage tolerance",
                "Automatic route optimization",
                "Support for 500+ token pairs"
              ]}
            />

            <TradingFeature
              icon={<BarChart4 size={20} />}
              title="State Channel Trading"
              features={[
                "Zero gas fees for all in-channel trades",
                "Sub-100ms trade execution",
                "Multiple trades in single update",
                "Instant settlement without delays"
              ]}
            />

            <TradingFeature
              icon={<Clock size={20} />}
              title="Professional Order Types"
              features={[
                "Limit Orders with price triggers",
                "TWAP orders for large trades",
                "Call/Put options with strike prices",
                "Stop-Loss and Take-Profit automation"
              ]}
            />
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl overflow-hidden shadow-xl">
            <div className="px-4 py-3 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-sm font-medium ml-2">Trading Terminal</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                <span className="text-xs text-gray-400">Connected</span>
              </div>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="col-span-2">
                  <div className="bg-slate-900 rounded-lg p-4 h-48 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg viewBox="0 0 400 100" width="100%" height="100%" preserveAspectRatio="none">
                        <path
                          d="M 0,50 Q 40,30 80,50 T 160,50 T 240,50 T 320,50 T 400,50"
                          fill="none"
                          stroke="#14B8A6"
                          strokeWidth="2"
                        />
                        <path
                          d="M 0,50 Q 40,70 80,40 T 160,30 T 240,60 T 320,40 T 400,50"
                          fill="none"
                          stroke="#7C3AED"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>

                    <div className="absolute top-2 left-2">
                      <div className="text-xs text-gray-400">ETH/BTC</div>
                      <div className="font-medium">0.06482</div>
                    </div>

                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-teal-500/20 rounded text-xs text-teal-400">
                      +2.4%
                    </div>
                  </div>
                </div>

                <div className="col-span-1">
                  <div className="bg-slate-900 rounded-lg p-4 h-48">
                    <div className="text-xs text-gray-400 mb-2">Order Book</div>

                    <div className="space-y-1 mb-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-red-400">0.06485</span>
                        <span>2.45</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-red-400">0.06484</span>
                        <span>1.21</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-red-400">0.06483</span>
                        <span>0.87</span>
                      </div>
                    </div>

                    <div className="text-center text-xs py-1 border-t border-b border-slate-800">
                      <span className="font-medium">0.06482</span>
                    </div>

                    <div className="space-y-1 mt-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-green-400">0.06481</span>
                        <span>0.54</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-green-400">0.06480</span>
                        <span>1.32</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-green-400">0.06479</span>
                        <span>2.67</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-2">Buy ETH</div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-xs text-gray-400">Amount</label>
                        <span className="text-xs text-gray-400">Balance: 0.284 BTC</span>
                      </div>
                      <div className="flex">
                        <input
                          type="text"
                          className="bg-slate-800 border border-slate-700 rounded-l p-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-teal-500"
                          placeholder="0.00"
                          defaultValue="0.05"
                        />
                        <div className="bg-slate-700 rounded-r px-3 flex items-center text-sm">
                          BTC
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-xs text-gray-400">Price</label>
                        <span className="text-xs text-purple-400">Market</span>
                      </div>
                      <div className="flex">
                        <input
                          type="text"
                          className="bg-slate-800 border border-slate-700 rounded-l p-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-teal-500"
                          placeholder="0.00"
                          defaultValue="0.06482"
                        />
                        <div className="bg-slate-700 rounded-r px-3 flex items-center text-sm">
                          BTC
                        </div>
                      </div>
                    </div>

                    <button className="w-full py-2 rounded bg-green-500 text-white font-medium">
                      Buy ETH
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="text-xs text-gray-400 mb-2">Sell ETH</div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-xs text-gray-400">Amount</label>
                        <span className="text-xs text-gray-400">Balance: 4.32 ETH</span>
                      </div>
                      <div className="flex">
                        <input
                          type="text"
                          className="bg-slate-800 border border-slate-700 rounded-l p-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-teal-500"
                          placeholder="0.00"
                        />
                        <div className="bg-slate-700 rounded-r px-3 flex items-center text-sm">
                          ETH
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-xs text-gray-400">Order Type</label>
                        <span className="text-xs text-teal-400">Limit</span>
                      </div>
                      <div className="flex">
                        <input
                          type="text"
                          className="bg-slate-800 border border-slate-700 rounded-l p-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-teal-500"
                          placeholder="0.00"
                          defaultValue="0.06490"
                        />
                        <div className="bg-slate-700 rounded-r px-3 flex items-center text-sm">
                          BTC
                        </div>
                      </div>
                    </div>

                    <button className="w-full py-2 rounded bg-red-500 text-white font-medium">
                      Sell ETH
                    </button>
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

interface TradingFeatureProps {
  icon: React.ReactNode;
  title: string;
  features: string[];
}

const TradingFeature = ({ icon, title, features }: TradingFeatureProps) => (
  <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
    <div className="flex items-center mb-4">
      <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center mr-4">
        <div className="text-teal-400">{icon}</div>
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
    </div>

    <div className="space-y-3 pl-14">
      {features.map((feature, index) => (
        <div key={index} className="flex items-start">
          <div className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center mt-0.5 mr-3 flex-shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-400"></div>
          </div>
          <span className="text-gray-400">{feature}</span>
        </div>
      ))}
    </div>
  </div>
);

export default AdvancedTrading;