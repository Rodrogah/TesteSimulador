import React, { useState, useEffect } from 'react';
import { Player, Tweet, SocialNotification, Message, DatingProfile, Contact } from '../../types';
import { useTranslations } from '../../hooks/useTranslations';
import { analyzePlayerTweet, generateSocialMediaFeed, generateTweetComments, generateCelebrityTweetResponse } from '../../services/puterService';
import { DATING_PROFILES } from '../../constants';
import ComposeTweetModal from './ComposeTweetModal';
import TweetCard from './TweetCard';
import TweetDetailView from './TweetDetailView';
import ProfileScreen from './ProfileScreen';
import NotificationsScreen from './NotificationsScreen';
import { findAndModifyTweet } from './utils';

interface SocialAppProps {
    player: Player;
    setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
}

type SocialTab = 'feed' | 'notifications' | 'profile';

type ComposeState = {
    isOpen: boolean;
    tweetToQuote: Tweet | null;
}

const SocialApp: React.FC<SocialAppProps> = ({ player, setPlayer }) => {
    const { t, language } = useTranslations();
    const [composeState, setComposeState] = useState<ComposeState>({ isOpen: false, tweetToQuote: null });
    const [isPosting, setIsPosting] = useState(false);
    const [activeTab, setActiveTab] = useState<SocialTab>('feed');
    const [selectedTweet, setSelectedTweet] = useState<Tweet | null>(null);
    const [isFeedLoading, setIsFeedLoading] = useState(false);

    useEffect(() => {
        const gamesSinceUpdate = player.seasonStats.gamesPlayed - (player.phone.lastSocialUpdateGamesPlayed || 0);

        if (gamesSinceUpdate > 0) {
            const fetchTweets = async () => {
                setIsFeedLoading(true);
                const tweets = await generateSocialMediaFeed(player, language, gamesSinceUpdate);
                
                if (tweets) {
                    const playerHandle = `@${player.name.replace(/\s/g, '')}`;
                    const newNotifications: SocialNotification[] = [];

                    // Generate mention notifications
                    tweets.forEach(tweet => {
                        if (tweet.content.includes(playerHandle)) {
                            newNotifications.push({
                                id: `notif-mention-${tweet.id}`,
                                type: 'mention',
                                tweetId: tweet.id,
                                fromUser: { author: tweet.author, handle: tweet.handle, avatar: tweet.avatar },
                                textPreview: tweet.content.substring(0, 70),
                            });
                        }
                    });
                    
                    // Randomly generate a "like" notification
                    if (Math.random() < 0.3) {
                        const playerTweets = player.phone.socialFeed.filter(t => t.author === player.name);
                        if (playerTweets.length > 0 && tweets.length > 0) {
                            const likedTweet = playerTweets[Math.floor(Math.random() * playerTweets.length)];
                            const likingUserTweet = tweets[Math.floor(Math.random() * tweets.length)];
                            newNotifications.push({
                                id: `notif-like-${Date.now()}`,
                                type: 'like',
                                tweetId: likedTweet.id,
                                fromUser: { author: likingUserTweet.author, handle: likingUserTweet.handle, avatar: likingUserTweet.avatar },
                                textPreview: likedTweet.content.substring(0, 70),
                            });
                        }
                    }

                    setPlayer(p => {
                        if (!p) return p;
                        return { 
                            ...p, 
                            phone: { 
                                ...p.phone, 
                                socialFeed: [...tweets, ...p.phone.socialFeed].slice(0, 50),
                                socialNotifications: [...newNotifications, ...p.phone.socialNotifications].slice(0, 50),
                                lastSocialUpdateGamesPlayed: p.seasonStats.gamesPlayed
                            }
                        };
                    });
                }
                setIsFeedLoading(false);
            };

            fetchTweets();
        }
    }, []); // Run only on mount

    const handlePost = async (tweetText: string) => {
        setIsPosting(true);
        const playerHandle = `@${player.name.replace(/\s/g, '')}`;
        const { tweetToQuote } = composeState;

        const generateInteractions = async (contentForComments: string) => {
            const comments = await generateTweetComments(contentForComments, player, language);
            const hypeFactor = 0.7 + (player.overall / 150) + (player.seasonStats.momentum / 50);
            const baseLikes = 200 + (player.overall * 50);
            const baseRetweets = 20 + (player.overall * 5);
            const calculatedLikes = Math.floor((baseLikes + (Math.random() * 500)) * hypeFactor);
            const calculatedRetweets = Math.floor((baseRetweets + (Math.random() * 50)) * hypeFactor);
            return { comments, likes: calculatedLikes, retweets: calculatedRetweets };
        };

        if (tweetToQuote) {
            const isSimpleRetweet = tweetText.trim() === '';

            if (isSimpleRetweet) {
                // Simple Retweet: No content, no interactions on the retweet itself.
                setPlayer(p => {
                    if (!p) return null;
                    const { modifiedTweets: feedWithUpdatedCount } = findAndModifyTweet(p.phone.socialFeed, tweetToQuote.id, (t) => ({ retweets: t.retweets + 1 }), p);
                    const newTweet: Tweet = {
                        id: `rt-${tweetToQuote.id}-${Date.now()}`,
                        author: p.name,
                        handle: playerHandle,
                        avatar: p.phone.socialProfile.avatarUrl,
                        content: tweetText,
                        likes: 0,
                        retweets: 0,
                        isVerified: true,
                        comments: [],
                        retweetOf: { ...tweetToQuote, retweets: tweetToQuote.retweets + 1 },
                    };
                    const newRetweetedIds = [...p.phone.retweetedTweetIds, tweetToQuote.id];
                    return { ...p, phone: { ...p.phone, retweetedTweetIds: newRetweetedIds, socialFeed: [newTweet, ...feedWithUpdatedCount] } };
                });
            } else {
                // Quote Retweet: Has content and should get its own interactions.
                const fullQuoteTweetContent = `In response to ${tweetToQuote.author} (${tweetToQuote.handle}) tweeting "${tweetToQuote.content}", ${player.name} added: "${tweetText}"`;
                const { comments, likes, retweets } = await generateInteractions(fullQuoteTweetContent);
                
                setPlayer(p => {
                    if (!p) return null;
                    const { modifiedTweets: feedWithUpdatedCount } = findAndModifyTweet(p.phone.socialFeed, tweetToQuote.id, (t) => ({ retweets: t.retweets + 1 }), p);
                    const newTweet: Tweet = {
                        id: `qt-${tweetToQuote.id}-${Date.now()}`,
                        author: p.name,
                        handle: playerHandle,
                        avatar: p.phone.socialProfile.avatarUrl,
                        content: tweetText,
                        likes,
                        retweets,
                        isVerified: true,
                        comments: comments || [],
                        retweetOf: { ...tweetToQuote, retweets: tweetToQuote.retweets + 1 },
                    };
                    const newRetweetedIds = [...p.phone.retweetedTweetIds, tweetToQuote.id];
                    return { ...p, phone: { ...p.phone, retweetedTweetIds: newRetweetedIds, socialFeed: [newTweet, ...feedWithUpdatedCount] } };
                });
            }
        } else {
            // Original Tweet
            const allCelebrityNames = DATING_PROFILES.map(p => p.name);
            const analysisPromise = analyzePlayerTweet(tweetText, player, language);
            const interactionsPromise = generateInteractions(tweetText);

            let celebResponse: Awaited<ReturnType<typeof generateCelebrityTweetResponse>> = null;
            let mentionedCelebrityProfile: DatingProfile | null = null;
            
            const [analysis, interactions] = await Promise.all([analysisPromise, interactionsPromise]);

            if (analysis.effects?.celebrityMention) {
                const mentionedCelebrityName = analysis.effects.celebrityMention;
                mentionedCelebrityProfile = DATING_PROFILES.find(p => p.name.toLowerCase() === mentionedCelebrityName.toLowerCase()) || null;
                if (mentionedCelebrityProfile) {
                    const tempNewTweet: Tweet = {
                        id: `tweet-${Date.now()}`,
                        author: player.name,
                        handle: playerHandle,
                        avatar: player.phone.socialProfile.avatarUrl,
                        content: tweetText,
                        likes: 0,
                        retweets: 0,
                        isVerified: true,
                        comments: [],
                    };
                    celebResponse = await generateCelebrityTweetResponse(tempNewTweet, player, language);
                }
            }

            setPlayer(p => {
                if (!p) return null;
                
                const newTweet: Tweet = {
                    id: `tweet-${Date.now()}`,
                    author: p.name,
                    handle: playerHandle,
                    avatar: p.phone.socialProfile.avatarUrl,
                    content: tweetText,
                    likes: interactions.likes,
                    retweets: interactions.retweets,
                    isVerified: true,
                    comments: interactions.comments || [],
                };
                
                let updatedContacts = [...p.phone.contacts];

                if (celebResponse && mentionedCelebrityProfile) {
                    const celebTweet: Tweet = {
                        id: `comment-${Date.now()}`,
                        author: mentionedCelebrityProfile.name,
                        handle: `@${mentionedCelebrityProfile.name.toLowerCase().replace(/\s/g, '')}`,
                        avatar: mentionedCelebrityProfile.avatar,
                        content: celebResponse.content,
                        likes: Math.floor(Math.random() * 5000) + 1000,
                        retweets: Math.floor(Math.random() * 500) + 100,
                        isVerified: true,
                        comments: []
                    };
                    newTweet.comments.unshift(celebTweet);

                    // Removed specialAction and firstMessage logic as it's no longer part of the Tweet type.
                        const contactExists = p.phone.contacts.some(c => c.id === mentionedCelebrityProfile.id);
                        if (!contactExists) {
                            const newContact: Contact = {
                                id: mentionedCelebrityProfile.id,
                                name: mentionedCelebrityProfile.name,
                                type: 'Date',
                                avatar: mentionedCelebrityProfile.avatar,
                                personality: mentionedCelebrityProfile.personality,
                                conversation: [
                                    {
                                        id: `msg-celeb-${Date.now()}`,
                                        sender: mentionedCelebrityProfile.name,
                                        text: "(Auto-generated first message)",
                                        timestamp: Date.now()
                                    }
                                ]
                            };
                            updatedContacts.push(newContact);
                        }
                }

                const newFeed = [newTweet, ...p.phone.socialFeed].slice(0, 50);
                const newRelationships = { ...p.relationships };
                if (analysis.effects?.relationships) {
                    analysis.effects?.relationships?.forEach(rel => {
                        newRelationships[rel.person] = (newRelationships[rel.person] || 0) + rel.change;
                    });
                }
                
                return {
                    ...p,
                    teamChemistry: Math.max(0, Math.min(100, p.teamChemistry + (analysis.effects?.teamChemistry || 0))),
                    relationships: newRelationships,
                    phone: {
                        ...p.phone,
                        socialFeed: newFeed,
                        contacts: updatedContacts,
                        lastSocialUpdateGamesPlayed: p.seasonStats.gamesPlayed,
                    },
                };
            });
        }
        
        setIsPosting(false);
        setComposeState({ isOpen: false, tweetToQuote: null });
    };

    const handleOpenRetweet = (tweet: Tweet) => {
        if (player.phone.retweetedTweetIds.includes(tweet.id)) {
            // Un-retweet
            setPlayer(p => {
                if (!p) return null;
                const newRetweetedIds = p.phone.retweetedTweetIds.filter(id => id !== tweet.id);
                // Remove the player's retweet/quote tweet of this specific tweet from the feed
                const newFeed = p.phone.socialFeed.filter(t => !(t.retweetOf?.id === tweet.id && t.author === p.name));
                // Decrement the original tweet's retweet count
                const { modifiedTweets } = findAndModifyTweet(newFeed, tweet.id, (t) => ({ retweets: Math.max(0, t.retweets - 1) }), p);
                return { ...p, phone: { ...p.phone, retweetedTweetIds: newRetweetedIds, socialFeed: modifiedTweets } };
            });
        } else {
            // Open modal to choose between retweet and quote tweet
            setComposeState({ isOpen: true, tweetToQuote: tweet });
        }
    };
    
    const renderContent = () => {
        if (selectedTweet) {
            return <TweetDetailView player={player} setPlayer={setPlayer} tweet={selectedTweet} onBack={() => setSelectedTweet(null)} />;
        }

        switch(activeTab) {
            case 'notifications':
                return <NotificationsScreen player={player} onTweetSelect={setSelectedTweet} />;
            case 'profile':
                return <ProfileScreen player={player} setPlayer={setPlayer} onTweetSelect={setSelectedTweet} />;
            case 'feed':
            default:
                return (
                    <main className="flex-1 overflow-y-auto">
                        {isFeedLoading && (
                            <div className="flex justify-center items-center p-4 border-b border-gray-700/50">
                                <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                        {player.phone.socialFeed.length === 0 && !isFeedLoading ? (
                             <div className="p-4 text-center text-gray-400 mt-10">{t('phone.social.noTweets') as string}</div>
                        ) : (
                            player.phone.socialFeed.map(tweet => <TweetCard key={tweet.id} tweet={tweet} player={player} setPlayer={setPlayer} onCommentClick={setSelectedTweet} onRetweetClick={handleOpenRetweet} />)
                        )}
                    </main>
                )
        }
    }

    return (
        <div className="h-full flex flex-col bg-gray-900 relative">
            {composeState.isOpen && <ComposeTweetModal onClose={() => setComposeState({ isOpen: false, tweetToQuote: null })} onPost={handlePost} isPosting={isPosting} tweetToQuote={composeState.tweetToQuote} />}
            
            {/* Main Header (only when not viewing a tweet detail) */}
            {!selectedTweet && (
                <header className="bg-surface/80 backdrop-blur-sm px-3 pt-3 pb-3 text-center border-b border-gray-700/50 flex justify-between items-center">
                    <div className="w-8"></div>
                    <h1 className="font-bold text-lg text-white">{t('phone.social.title') as string}</h1>
                    <button onClick={() => setComposeState({ isOpen: true, tweetToQuote: null })} className="text-3xl text-blue-400 font-light w-8" aria-label="Compose Tweet">+</button>
                </header>
            )}

            {renderContent()}

            {/* Tab Bar (only when not viewing a tweet detail) */}
            {!selectedTweet && (
                <footer className="grid grid-cols-3 bg-surface/80 backdrop-blur-sm border-t border-gray-700/50">
                    <button onClick={() => setActiveTab('feed')} className={`py-3 text-2xl ${activeTab === 'feed' ? 'text-blue-400' : 'text-gray-500'}`}>🏠</button>
                    <button onClick={() => setActiveTab('notifications')} className={`py-3 text-2xl relative ${activeTab === 'notifications' ? 'text-blue-400' : 'text-gray-500'}`}>
                        🔔
                        {player.phone.socialNotifications.length > 0 && <span className="absolute top-2 right-[calc(50%-1.25rem)] w-2 h-2 bg-blue-400 rounded-full"></span>}
                    </button>
                    <button onClick={() => setActiveTab('profile')} className={`py-3 text-2xl ${activeTab === 'profile' ? 'text-blue-400' : 'text-gray-500'}`}>👤</button>
                </footer>
            )}
        </div>
    );
};

export default SocialApp;