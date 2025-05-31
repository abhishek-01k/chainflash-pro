"use client";

import React from 'react';
import LandingPage from './LandingPage';
import Features from './Features';
import CoreComponents from './CoreComponents';
import AdvancedTrading from './AdvancedTrading';
import CrossChain from './CrossChain';
import PricingOracle from './PricingOracle';
import CTA from './CTA';

const HomePage = () => {
    return (
        <>
            <LandingPage />
            <Features />
            <CoreComponents />
            <AdvancedTrading />
            <CrossChain />
            <PricingOracle />
            <CTA />
        </>
    );
};

export default HomePage;