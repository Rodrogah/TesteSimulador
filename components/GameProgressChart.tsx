import React, { useState, useMemo } from 'react';
import { Game } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface GameProgressChartProps {
    games: Game[];
}

const GameProgressChart: React.FC<GameProgressChartProps> = ({ games }) => {
    const { t } = useTranslations();
    const [tooltip, setTooltip] = useState<{ x: number; game: Game } | null>(null);

    const chartData = useMemo(() => {
        // Take the last 10 games and reverse them so the latest is on the right
        const reversedGames = [...games].reverse().slice(-10);
        const width = 300;
        const height = 150;
        const padding = { top: 10, bottom: 10, left: 0, right: 0 };
        
        if (reversedGames.length === 0) {
            return null;
        }

        const maxStat = Math.max(10, ...reversedGames.flatMap(g => [g.points, g.rebounds, g.assists]));

        const chartHeight = height - padding.top - padding.bottom;
        const groupWidth = (width - padding.left - padding.right) / reversedGames.length;
        const barWidth = Math.max(2, groupWidth / 4);

        const bars = reversedGames.map((game, i) => {
            const groupX = padding.left + i * groupWidth;
            
            // Function to calculate bar Y position and height
            const y = (stat: number) => padding.top + chartHeight - (stat / maxStat) * chartHeight;
            const h = (stat: number) => (stat / maxStat) * chartHeight;

            return {
                game,
                groupX,
                points: { x: groupX + groupWidth / 2 - barWidth * 1.5 - 1, y: y(game.points), width: barWidth, height: h(game.points) },
                rebounds: { x: groupX + groupWidth / 2 - barWidth / 2, y: y(game.rebounds), width: barWidth, height: h(game.rebounds) },
                assists: { x: groupX + groupWidth / 2 + barWidth / 2 + 1, y: y(game.assists), width: barWidth, height: h(game.assists) },
            };
        });

        return { width, height, bars, groupWidth };
    }, [games]);

    if (!chartData || games.length < 2) {
        return <div className="text-center text-sm text-secondary h-[190px] flex items-center justify-center">{t('noGamesPlayed') as string}</div>;
    }

    const handleMouseOver = (groupX: number, game: Game) => {
        setTooltip({ x: groupX + chartData.groupWidth / 2, game });
    };

    const handleMouseOut = () => {
        setTooltip(null);
    };

    return (
        <div className="relative">
            <svg viewBox={`0 0 ${chartData.width} ${chartData.height}`} className="w-full h-auto">
                <g>
                    {/* Add a subtle background grid line for the max stat */}
                    <line x1="0" y1={chartData.height / 2} x2={chartData.width} y2={chartData.height / 2} stroke="rgba(255,255,255,0.05)" />
                    <line x1="0" y1={chartData.height - 1} x2={chartData.width} y2={chartData.height - 1} stroke="rgba(255,255,255,0.1)" />
                </g>
                {chartData.bars.map(({ game, groupX, points, rebounds, assists }, index) => (
                    <g key={game.id || index} onMouseOver={() => handleMouseOver(groupX, game)} onMouseOut={handleMouseOut} className="cursor-pointer">
                        {/* Transparent rectangle for easier hovering */}
                        <rect x={groupX} y="0" width={chartData.groupWidth} height={chartData.height} fill="transparent" />
                        <rect {...points} fill="#c8102e" rx="1" className="transition-opacity duration-200" opacity={tooltip && tooltip.game.id === game.id ? 1 : 0.85} />
                        <rect {...rebounds} fill="#6c757d" rx="1" className="transition-opacity duration-200" opacity={tooltip && tooltip.game.id === game.id ? 1 : 0.85} />
                        <rect {...assists} fill="#1d428a" rx="1" className="transition-opacity duration-200" opacity={tooltip && tooltip.game.id === game.id ? 1 : 0.85} />
                    </g>
                ))}
            </svg>
            {tooltip && (
                <div 
                    className="absolute bg-background border border-white/20 p-2 rounded-md text-xs shadow-lg pointer-events-none z-10 transition-opacity duration-200"
                    style={{ 
                        left: `${(tooltip.x / chartData.width) * 100}%`, 
                        top: `0px`,
                        transform: 'translate(-50%, -110%)'
                    }}
                >
                    <p><strong className="text-nba-red">{tooltip.game.points}</strong> {t('points') as string}</p>
                    <p><strong className="text-nba-gray">{tooltip.game.rebounds}</strong> {t('rebounds') as string}</p>
                    <p><strong className="text-nba-blue">{tooltip.game.assists}</strong> {t('assists') as string}</p>
                    <p className="text-secondary mt-1 border-t border-white/10 pt-1">{t('vs') as string} {tooltip.game.opponent}</p>
                </div>
            )}
             <div className="flex justify-center gap-4 text-xs mt-2">
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-nba-red mr-1"></span>{t('points') as string}</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-nba-gray mr-1"></span>{t('rebounds') as string}</span>
                <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-nba-blue mr-1"></span>{t('assists') as string}</span>
            </div>
        </div>
    );
};

export default GameProgressChart;
