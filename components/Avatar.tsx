import React from 'react';
import { SovereignConfig } from '../types';
import { CanvasAvatar } from './CanvasAvatar';

interface SovereignProps {
  sovereignConfig?: SovereignConfig;
  className?: string;
}

export const Sovereign: React.FC<SovereignProps> = ({ sovereignConfig, className = '' }) => {
    return (
        <CanvasAvatar 
            sovereignConfig={sovereignConfig} 
            className={`w-full h-full object-contain ${className}`}
            width={300}
            height={300}
        />
    );
};
