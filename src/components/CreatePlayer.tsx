import React, { useState, useMemo, useCallback } from 'react';
import { Position, PlayerStats } from '../types';
import { ATTRIBUTES, TOTAL_ATTRIBUTE_POINTS, MIN_ATTRIBUTE_POINTS, MAX_ATTRIBUTE_POINTS, QUICK_BUILDS, CLUTCH_TRAIT_COST } from '../constants';
import { useTranslations } from '../hooks/useTranslations';
import { generatePlayerBio } from '../services/geminiService';

interface CreatePlayerProps {
    onPlayerCreate: (name: string, position: Position, stats: PlayerStats, bio: string, isClutch: boolean) => void;
    onBack: () => void;
}

const CreatePlayer: React.FC<CreatePlayerProps> = ({ onPlayerCreate, onBack }) => {
    const { t, language } = useTranslations();
    const [name, setName] = useState('');
    const [position, setPosition] = useState<Position>(Position.PG);
    const [bio, setBio] = useState('');
    const [isGeneratingBio, setIsGeneratingBio] = useState(false);
    const [isClutch, setIsClutch] = useState(false);
    const [stats, setStats] = useState<PlayerStats>(
        ATTRIBUTES.reduce((acc, attr) => ({ ...acc, [attr.id]: MIN_ATTRIBUTE_POINTS }), {} as PlayerStats)
    );

    const totalPoints = useMemo(() => {
        return TOTAL_ATTRIBUTE_POINTS - (isClutch ? CLUTCH_TRAIT_COST : 0);
    }, [isClutch]);

    const pointsUsed = useMemo(() => {
        return ATTRIBUTES.reduce((sum, attr) => sum + (stats[attr.id] - MIN_ATTRIBUTE_POINTS), 0);
    }, [stats]);

    const pointsLeft = totalPoints - pointsUsed;

    const handleStatChange = (statId: string, value: number) => {
        const oldValue = stats[statId];
        const pointDifference = value - oldValue;

        if (pointDifference <= pointsLeft) {
            setStats(prevStats => ({ ...prevStats, [statId]: value }));
        } else {
            setStats(prevStats => ({ ...prevStats, [statId]: oldValue + pointsLeft }));
        }
    };
    
    const applyBuild = (buildId: string) => {
        const build = QUICK_BUILDS[buildId];
        if (build) {
            const newStats = ATTRIBUTES.reduce((acc, attr) => {
                acc[attr.id] = build.stats[attr.id] ?? MIN_ATTRIBUTE_POINTS;
                return acc;
            }, {} as PlayerStats);
            setStats(newStats);
        }
    };

    const handleGenerateBio = async () => {
        setIsGeneratingBio(true);
        const generatedBio = await generatePlayerBio(name, position, language);
        setBio(generatedBio);
        setIsGeneratingBio(false);
    };

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (pointsLeft === 0) {
            onPlayerCreate(name, position, stats, bio, isClutch);
        }
    }, [onPlayerCreate, name, position, stats, bio, isClutch, pointsLeft]);
    
    const createButtonText = () => {
        // FIX: Cast results of `t` function to `string` to resolve TypeScript type errors.
        if (pointsLeft === 0) return t('createButton') as string;
        // FIX: Cast results of `t` function to `string` to resolve TypeScript type errors.
        if (pointsLeft > 0) return t('createButtonDisabled', { points: pointsLeft }) as string;
        // FIX: Cast results of `t` function to `string` to resolve TypeScript type errors.
        return t('createButtonDisabledTooMany', { points: Math.abs(pointsLeft) }) as string;
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in relative">
             <button onClick={onBack} title="Back to Dashboard" className="absolute top-0 left-0 text-gray-400 hover:text-white transition-colors p-2 z-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                </svg>
            </button>
            <header className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-nba-blue via-white to-nba-red mb-2">
                    {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                    {t('appTitle') as string}
                </h1>
                {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                <p className="text-lg text-secondary">{t('appSubtitle') as string}</p>
            </header>

            <form onSubmit={handleSubmit} className="bg-surface p-6 md:p-8 rounded-xl shadow-2xl space-y-8 border border-white/10">
                <section>
                    {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                    <h2 className="text-2xl font-bold border-b-2 border-nba-red pb-2 mb-4">{t('basicInfo') as string}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="form-group">
                            {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                            <label htmlFor="player-name" className="block text-sm font-medium text-secondary mb-1">{t('playerName') as string}</label>
                            <input
                                type="text"
                                id="player-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                // FIX: Cast results of `t` function to `string` to resolve TypeScript type errors.
                                placeholder={t('playerNamePlaceholder') as string}
                                className="w-full bg-background border border-gray-700 rounded-md p-2 focus:ring-2 focus:ring-nba-blue focus:border-nba-blue outline-none"
                            />
                        </div>
                        <div className="form-group">
                            {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                            <label htmlFor="player-position" className="block text-sm font-medium text-secondary mb-1">{t('position') as string}</label>
                            <select
                                id="player-position"
                                value={position}
                                onChange={(e) => setPosition(e.target.value as Position)}
                                className="w-full bg-background border border-gray-700 rounded-md p-2 focus:ring-2 focus:ring-nba-blue focus:border-nba-blue outline-none appearance-none"
                            >
                                {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                                <option value={Position.PG}>{t('positions.PG') as string}</option>
                                {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                                <option value={Position.SG}>{t('positions.SG') as string}</option>
                                {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                                <option value={Position.SF}>{t('positions.SF') as string}</option>
                                {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                                <option value={Position.PF}>{t('positions.PF') as string}</option>
                                {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                                <option value={Position.C}>{t('positions.C') as string}</option>
                            </select>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold border-b-2 border-nba-red pb-2 mb-4">{t('playerBio') as string}</h2>
                     <div className="form-group">
                        <div className="flex justify-between items-center mb-1">
                            <label htmlFor="player-bio" className="block text-sm font-medium text-secondary">{t('playerBioDescription') as string}</label>
                             <button
                                type="button"
                                onClick={handleGenerateBio}
                                disabled={isGeneratingBio}
                                className="text-xs bg-nba-blue/20 hover:bg-nba-blue/40 text-nba-blue-300 font-semibold py-1 px-2 rounded-md transition-colors disabled:opacity-50 flex items-center"
                            >
                                <span className="mr-1">✨</span>
                                {isGeneratingBio ? t('generatingBio') as string : t('generateWithAI') as string}
                            </button>
                        </div>
                        <textarea
                            id="player-bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder={t('playerBioPlaceholder') as string}
                            className="w-full bg-background border border-gray-700 rounded-md p-2 h-24 focus:ring-2 focus:ring-nba-blue focus:border-nba-blue outline-none resize-y"
                            aria-label={t('playerBio') as string}
                        />
                    </div>
                </section>
                
                 <section>
                    <h2 className="text-2xl font-bold border-b-2 border-nba-blue pb-2 mb-4">{t('playerTraits') as string}</h2>
                    <label htmlFor="clutch-trait" className="flex items-center p-4 bg-background rounded-lg border border-white/10 cursor-pointer hover:bg-nba-blue/10 transition-colors">
                        <input
                            type="checkbox"
                            id="clutch-trait"
                            checked={isClutch}
                            onChange={(e) => setIsClutch(e.target.checked)}
                            className="h-5 w-5 rounded border-gray-300 text-nba-blue focus:ring-nba-blue"
                        />
                        <div className="ml-4">
                            <span className="font-bold text-primary">⚡️ {t('clutchTrait') as string}</span>
                            <p className="text-sm text-secondary">{t('clutchTraitDescription') as string}</p>
                        </div>
                    </label>
                </section>
                
                <section>
                    {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                    <h2 className="text-2xl font-bold border-b-2 border-nba-blue pb-2 mb-4">{t('quickBuilds') as string}</h2>
                     <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                        {Object.keys(QUICK_BUILDS).map((id) => (
                            <button 
                                type="button" 
                                key={id} 
                                onClick={() => applyBuild(id)}
                                className="bg-surface border border-white/10 hover:bg-nba-blue/50 hover:border-nba-blue text-sm font-semibold py-2 px-2 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
                            >
                                {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                                {t(`builds.${id}`) as string}
                            </button>
                        ))}
                    </div>
                </section>

                <section>
                    {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                    <h2 className="text-2xl font-bold border-b-2 border-nba-blue pb-2 mb-4">{t('attributes') as string}</h2>
                    <div className="bg-background/50 backdrop-blur-sm p-4 rounded-lg mb-6 text-center sticky top-4 z-10 border border-white/10">
                        {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                        <p className="text-lg font-semibold">{t('pointsRemaining') as string}: 
                            <span className={`ml-2 text-2xl font-bold ${pointsLeft < 0 ? 'text-red-500' : pointsLeft > 0 ? 'text-blue-400' : 'text-green-500'}`}>
                                {pointsLeft}
                            </span>
                        </p>
                        <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                            <div className="bg-gradient-to-r from-nba-blue to-nba-red h-2.5 rounded-full" style={{ width: `${(pointsUsed / totalPoints) * 100}%` }}></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        {ATTRIBUTES.map(attr => {
                            const currentVal = stats[attr.id] || MIN_ATTRIBUTE_POINTS;
                            return (
                                <div key={attr.id} className="form-group">
                                    <label htmlFor={attr.id} className="flex justify-between text-sm font-medium text-secondary mb-1">
                                        {/* FIX: Cast results of `t` function to `string` to resolve TypeScript type errors. */}
                                        <span>{t(`attributesList.${attr.id}`) as string}</span>
                                        <span className="font-bold text-primary">{currentVal}</span>
                                    </label>
                                    <input
                                        type="range"
                                        id={attr.id}
                                        min={MIN_ATTRIBUTE_POINTS}
                                        max={MAX_ATTRIBUTE_POINTS}
                                        value={currentVal}
                                        onChange={(e) => handleStatChange(attr.id, parseInt(e.target.value, 10))}
                                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg accent-nba-red"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </section>

                <div className="pt-4 text-center">
                    <button 
                        type="submit" 
                        disabled={pointsLeft !== 0}
                        className="w-full md:w-1/2 bg-nba-blue text-white font-bold py-3 px-4 rounded-lg hover:bg-nba-red focus:outline-none focus:ring-2 ring-offset-background focus:ring-offset-2 focus:ring-nba-red disabled:bg-nba-gray disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-100 disabled:transform-none"
                    >
                        {/* FIX: `createButtonText` is now guaranteed to return a string. */}
                        {createButtonText()}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreatePlayer;