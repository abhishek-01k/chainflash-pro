import React from 'react';
import { Zap, ArrowRight } from 'lucide-react';

const CTA = () => {
    return (
        <section className="py-20 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950 pointer-events-none"></div>

            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-purple-500/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none"></div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="max-w-4xl mx-auto bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 md:p-12 border border-slate-700 shadow-2xl">
                    <div className="flex flex-col md:flex-row md:items-center">
                        <div className="md:flex-1 mb-8 md:mb-0">
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 mb-6">
                                <Zap size={14} className="text-purple-400 mr-2" />
                                <span className="text-sm font-medium">Start Trading Now</span>
                            </div>

                            <h2 className="text-3xl md:text-4xl font-bold mb-4">
                                Experience the Future of High-Frequency Trading
                            </h2>

                            <p className="text-gray-300 mb-6">
                                Join thousands of traders who are already using ChainFlash Pro to execute gas-free trades across multiple blockchains with sub-second settlement.
                            </p>

                            <ul className="space-y-2 mb-8">
                                <CTAFeature text="Zero gas fees with state channels" />
                                <CTAFeature text="Cross-chain atomic swaps" />
                                <CTAFeature text="Professional trading tools" />
                                <CTAFeature text="Real-time price oracles" />
                            </ul>
                        </div>

                        <div className="md:ml-8 md:flex-shrink-0 md:w-72">
                            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                                <h3 className="text-xl font-semibold mb-4">Get Started Today</h3>

                                <form className="space-y-4">
                                    <div>
                                        <label className="text-sm text-gray-400 block mb-1">Email Address</label>
                                        <input
                                            type="email"
                                            className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                            placeholder="you@example.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm text-gray-400 block mb-1">Trading Experience</label>
                                        <div className="relative">
                                            <select className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500">
                                                <option>Beginner</option>
                                                <option>Intermediate</option>
                                                <option>Advanced</option>
                                                <option>Professional</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    <button className="w-full py-3 rounded-lg bg-gradient-to-r from-teal-500 to-purple-600 text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center">
                                        Request Early Access <ArrowRight size={16} className="ml-2" />
                                    </button>
                                </form>

                                <div className="mt-4 text-center text-xs text-gray-400">
                                    By signing up, you agree to our Terms of Service and Privacy Policy
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

interface CTAFeatureProps {
    text: string;
}

const CTAFeature = ({ text }: CTAFeatureProps) => (
    <li className="flex items-center">
        <div className="w-5 h-5 rounded-full bg-teal-500/20 flex items-center justify-center mr-3">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 3L4.5 8.5L2 6" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>
        <span className="text-gray-300">{text}</span>
    </li>
);

export default CTA;