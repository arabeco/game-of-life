
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Text } from 'recharts';
import { Asset } from '../types';

interface AssetDecagonProps {
    assets: Asset[];
    tempLevels?: Record<string, number>; // Optional for MasteryView preview
    size?: number | string;
    showCentralLevel?: boolean;
}

const CustomDot = (props: any) => {
    const { cx, cy, payload, value } = props;
    if (!cx || !cy) return null;

    const goldMetallic = "#705E43";
    const goldBright = "#C5A021";

    return (
        <g>
            <circle 
                cx={cx} 
                cy={cy} 
                r={7} 
                fill="#000" 
                stroke={goldMetallic} 
                strokeWidth={1} 
                className="drop-shadow-[0_0_3px_rgba(112,94,67,0.4)]"
            />
            <text 
                x={cx} 
                y={cy} 
                dy={3} 
                textAnchor="middle" 
                fill={goldBright} 
                fontSize="7px" 
                fontWeight="900"
                className="pointer-events-none"
            >
                {value}
            </text>
        </g>
    );
};

export const AssetDecagon: React.FC<AssetDecagonProps> = ({ 
    assets, 
    tempLevels, 
    size = 280,
    showCentralLevel = true 
}) => {
    // Filter out 'geral' and map to data format
    const filteredAssets = assets.filter(a => a.id !== 'geral');
    
    const radarData = filteredAssets.map(asset => {
        const level = tempLevels ? (tempLevels[asset.id] || 1) : asset.level;
        return {
            subject: asset.name.toUpperCase(),
            level: level,
            fullMark: 10,
            displayName: asset.name.toUpperCase()
        };
    });

    const totalLevel = tempLevels 
        ? Object.entries(tempLevels)
            .filter(([id]) => id !== 'geral')
            .reduce((sum, [, level]) => sum + (level as number), 0)
        : filteredAssets.reduce((sum, asset) => sum + asset.level, 0);

    const goldMetallic = "#705E43"; // Bronze/Ouro envelhecido escuro
    const goldBright = "#C5A021";   // Dourado metálico principal
    const goldHighlight = "#E5C158"; // Brilho de ouro

    return (
        <div className="relative flex flex-col items-center justify-center w-full overflow-visible" style={{ height: size }}>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="rgba(255, 255, 255, 0.05)" />
                    <PolarAngleAxis 
                        dataKey="displayName" 
                        tick={(props) => {
                            const { x, y, payload, textAnchor, index } = props;
                            // Custom labels to avoid truncation and improve spacing
                            let label = payload.value;
                            if (label === 'TRABALHO/ESTUDOS') label = 'TRABALHO';
                            if (label === 'ESPAÇO MENTAL') label = 'MENTAL';
                            if (label === 'ESPIRITUALIDADE') label = 'ESPIRIT.';
                            
                            return (
                                <g transform={`translate(${x},${y})`}>
                                    <text
                                        x={0}
                                        y={0}
                                        dy={index > 2 && index < 8 ? 10 : -5}
                                        textAnchor={textAnchor}
                                        fill="rgba(255, 255, 255, 0.3)"
                                        fontSize="7px"
                                        fontWeight="900"
                                        letterSpacing="0.05em"
                                    >
                                        {label}
                                    </text>
                                </g>
                            );
                        }}
                    />
                    <PolarRadiusAxis 
                        angle={30} 
                        domain={[0, 10]} 
                        tick={false} 
                        axisLine={false} 
                    />
                    <Radar
                        name="Nível"
                        dataKey="level"
                        stroke={goldBright}
                        strokeWidth={1.5}
                        fill={goldBright}
                        fillOpacity={0.15}
                        dot={<CustomDot />}
                    />
                </RadarChart>
            </ResponsiveContainer>
            
            {showCentralLevel && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[6px] uppercase tracking-[0.5em] text-white/10 font-black mb-[-2px] translate-y-[-14px]">TOTAL</span>
                    <span 
                        className="text-2xl font-black drop-shadow-[0_0_8px_rgba(197,160,33,0.4)]"
                        style={{ color: goldBright }}
                    >
                        {totalLevel}
                    </span>
                </div>
            )}
        </div>
    );
};
