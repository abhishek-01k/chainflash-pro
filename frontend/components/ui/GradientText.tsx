import React from 'react';

interface GradientTextProps {
    children: React.ReactNode;
    className?: string;
    from?: string;
    to?: string;
}

const GradientText: React.FC<GradientTextProps> = ({
    children,
    className = '',
    from = 'from-primary-400',
    to = 'to-secondary-500'
}) => {
    return (
        <span
            className={`bg-gradient-to-r ${from} ${to} bg-clip-text text-transparent ${className}`}
        >
            {children}
        </span>
    );
};

export default GradientText;