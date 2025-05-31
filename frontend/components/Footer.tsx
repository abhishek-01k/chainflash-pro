import React from 'react';
import { Zap, Twitter, Github, Linkedin, MessageCircle } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-slate-950 pt-16 pb-8 relative">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center space-x-2 mb-4">
                            <Zap className="h-6 w-6 text-teal-400" />
                            <span className="text-xl font-bold tracking-tight">
                                <span className="text-white">Chain</span>
                                <span className="text-teal-400">Flash</span>
                                <span className="text-purple-500 font-light">Pro</span>
                            </span>
                        </div>

                        <p className="text-gray-400 mb-4">
                            Revolutionary cross-chain high-frequency trading platform with instant settlement and professional tools.
                        </p>

                    </div>
                </div>

                <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
                    <div className="text-gray-500 text-sm mb-4 md:mb-0">
                        © 2025 ChainFlash Pro. All rights reserved.
                    </div>

                    <div className="flex space-x-6">
                        <span className="text-gray-500 text-sm hover:text-gray-300 transition-colors cursor-pointer">
                            Terms of Service
                        </span>
                        <span className="text-gray-500 text-sm hover:text-gray-300 transition-colors cursor-pointer">
                            Privacy Policy
                        </span>
                        <span className="text-gray-500 text-sm hover:text-gray-300 transition-colors cursor-pointer">
                            Cookie Policy
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

interface SocialLinkProps {
    icon: React.ReactNode;
}

const SocialLink = ({ icon }: SocialLinkProps) => (
    <a href="#" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-gray-400 hover:bg-slate-700 hover:text-white transition-colors">
        {icon}
    </a>
);

interface FooterLinkProps {
    text: string;
}

const FooterLink = ({ text }: FooterLinkProps) => (
    <li>
        <a href="#" className="text-gray-400 hover:text-teal-400 transition-colors">
            {text}
        </a>
    </li>
);

export default Footer;