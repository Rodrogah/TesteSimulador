import React, { useState, useEffect } from 'react';
import { Player, Tweet, SocialNotification } from '../../types';
import TweetCard from './TweetCard';
import { useTranslations } from '../../hooks/useTranslations';
import { generateSocialMediaReactionToPlayerComment, generateTweetComments } from '../../services/puterService';
import { findAndModifyTweet } from './utils';

interface TweetDetailViewProps {
    player: Player;
    setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
    tweet: Tweet;
    onBack: () => void;
}

const TweetDetailView: React.FC<TweetDetailViewProps> = ({ player, setPlayer, tweet, onBack }) => {
    const { t, language } = useTranslations();
    const [commentText, setCommentText] = useState('');
    const [isCommentsLoading, setIsCommentsLoading] = useState(false);
    const [isGeneratingReaction, setIsGeneratingReaction] = useState(false);
    
    // Find the latest version of the tweet from the player state
    const findTweetInState = (tweets: Tweet[], tweetId: string): Tweet | null => {
        for (const t of tweets) {
            if (t.id === tweetId) return t;
            if (t.retweetOf?.id === tweetId) return t.retweetOf;
            const foundInComments = findTweetInState(t.comments, tweetId);
            if (foundInComments) return foundInComments;
        }
        return null;
    }
    const currentTweetState = findTweetInState(player.phone.socialFeed, tweet.id) || tweet;

    useEffect(() => {
        // Only fetch if comments are empty, it's not the player's tweet, and not already loading.
        if (currentTweetState.comments.length === 0 && currentTweetState.author !== player.name && !isCommentsLoading) {
            const fetchComments = async () => {
                setIsCommentsLoading(true);
                const newComments = await generateTweetComments(currentTweetState.content, player, language);
                if (newComments && newComments.length > 0) {
                    setPlayer(p => {
                        if (!p) return null;
                        const { modifiedTweets } = findAndModifyTweet(
                            p.phone.socialFeed,
                            currentTweetState.id,
                            () => ({ comments: newComments }),
                            p
                        );
                        return { ...p, phone: { ...p.phone, socialFeed: modifiedTweets } };
                    });
                }
                setIsCommentsLoading(false);
            };
            fetchComments();
        }
    }, [currentTweetState.id]);
    
    const isLiked = player.phone.likedTweetIds.includes(currentTweetState.id);
    const isRetweeted = player.phone.retweetedTweetIds.includes(currentTweetState.id);

    const handlePostComment = async () => {
        if (!commentText.trim() || isGeneratingReaction) return;

        const playerCommentId = `comment-${Date.now()}`;
        const playerComment: Tweet = {
            id: playerCommentId,
            author: player.name,
            handle: `@${player.name.replace(/\s/g, '')}`,
            avatar: player.phone.socialProfile.avatarUrl,
            content: commentText,
            likes: 0,
            retweets: 0,
            isVerified: true,
            comments: [],
        };
        
        // Optimistically update UI with player's comment
        setPlayer(p => {
            if (!p) return null;
            const { modifiedTweets } = findAndModifyTweet(p.phone.socialFeed, currentTweetState.id, () => ({ newComment: playerComment }), p);
            return { ...p, phone: { ...p.phone, socialFeed: modifiedTweets } };
        });

        setCommentText('');
        setIsGeneratingReaction(true);

        const reaction = await generateSocialMediaReactionToPlayerComment(currentTweetState, playerComment, player, language);

        if (reaction) {
            const cleanHandle = (handle: string) => `@${handle.replace(/@/g, '')}`;
            const baseAiTweet = {
                id: `tweet-${Date.now()}-${Math.random()}`,
                ...reaction.tweet,
                handle: cleanHandle(reaction.tweet.handle),
                avatar: `https://i.pravatar.cc/48?u=${reaction.tweet.handle}`,
                likes: Math.floor(Math.random() * 100),
                retweets: Math.floor(Math.random() * 20),
                comments: [],
            };

            setPlayer(p => {
                if (!p) return null;

                let newNotifications = p.phone.socialNotifications;
                let finalSocialFeed = p.phone.socialFeed;

                switch (reaction.reactionType) {
                    case 'reply': {
                        const { modifiedTweets } = findAndModifyTweet(
                            p.phone.socialFeed,
                            playerCommentId, // Target the player's comment, not the original tweet
                            () => ({ newComment: baseAiTweet }),
                            p
                        );
                        finalSocialFeed = modifiedTweets;

                        // Create a notification for the reply
                        const replyNotification: SocialNotification = {
                            id: `notif-reply-${baseAiTweet.id}`,
                            type: 'reply',
                            tweetId: playerComment.id,
                            fromUser: { author: baseAiTweet.author, handle: baseAiTweet.handle, avatar: baseAiTweet.avatar },
                            textPreview: baseAiTweet.content.substring(0, 70),
                        };
                        newNotifications = [replyNotification, ...newNotifications];
                        break;
                    }
                    case 'quote_retweet': {
                        const quoteRetweet: Tweet = { ...baseAiTweet, retweetOf: currentTweetState };
                        finalSocialFeed = [quoteRetweet, ...p.phone.socialFeed];
                        break;
                    }
                    case 'new_tweet': {
                        finalSocialFeed = [baseAiTweet, ...p.phone.socialFeed];
                        break;
                    }
                }
                return { ...p, phone: { ...p.phone, socialFeed: finalSocialFeed, socialNotifications: newNotifications.slice(0, 50) } };
            });
        }
        setIsGeneratingReaction(false);
    };

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPlayer(p => {
            if (!p) return null;
            const liked = p.phone.likedTweetIds.includes(currentTweetState.id);
            const newLikedIds = liked 
                ? p.phone.likedTweetIds.filter(id => id !== currentTweetState.id)
                : [...p.phone.likedTweetIds, currentTweetState.id];
            
            const { modifiedTweets } = findAndModifyTweet(p.phone.socialFeed, currentTweetState.id, (t) => ({ likes: t.likes + (liked ? -1 : 1) }), p);

            return { ...p, phone: { ...p.phone, likedTweetIds: newLikedIds, socialFeed: modifiedTweets } };
        });
    };
    
    // NOTE: Simple retweet is now handled in SocialApp, this is just for consistency in detail view if needed later
    const handleRetweet = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div className="h-full flex flex-col bg-gray-900">
            <header className="bg-surface/80 backdrop-blur-sm px-3 pt-3 pb-3 flex items-center border-b border-gray-700/50">
                <button onClick={onBack} className="text-white text-xl mr-4 font-bold">‹</button>
                <h1 className="font-bold text-lg text-white">Tweet</h1>
            </header>
            <main className="flex-1 overflow-y-auto">
                <div className="p-3 border-b border-gray-700/50">
                    <div className="flex space-x-3">
                         <img src={currentTweetState.avatar} alt={`${currentTweetState.author}'s avatar`} className="w-12 h-12 rounded-full" />
                         <div>
                            <span className="font-bold text-white">{currentTweetState.author}</span>
                            <span className="text-gray-400 text-sm block">{currentTweetState.handle}</span>
                         </div>
                    </div>
                     <p className="text-white whitespace-pre-wrap text-lg my-3">{currentTweetState.content}</p>
                    <div className="flex space-x-6 text-gray-400 text-sm py-2 border-y border-gray-700/50">
                        <span><span className="font-bold text-white">{currentTweetState.retweets}</span> Retweets</span>
                        <span><span className="font-bold text-white">{currentTweetState.likes}</span> Likes</span>
                    </div>
                     <div className="flex justify-around text-gray-500 py-1 text-2xl">
                        <button onClick={() => {}} className="flex items-center gap-1 hover:text-blue-400 transition-colors">
                            <span>💬</span>
                        </button>
                        <button onClick={handleRetweet} className={`flex items-center gap-1 hover:text-green-400 transition-colors ${isRetweeted ? 'text-green-400' : ''}`}>
                            <span>🔁</span>
                        </button>
                        <button onClick={handleLike} className={`flex items-center gap-1 hover:text-pink-500 transition-colors ${isLiked ? 'text-pink-500' : ''}`}>
                            <span>❤️</span>
                        </button>
                    </div>
                </div>

                <div>
                    {isCommentsLoading && (
                        <div className="flex justify-center p-4 border-b border-gray-700/50">
                            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                    {currentTweetState.comments.map(comment => (
                        <TweetCard key={comment.id} tweet={comment} player={player} setPlayer={setPlayer} onCommentClick={(clickedTweet) => { /* maybe nested detail view later */}} onRetweetClick={() => {}} />
                    ))}
                </div>
            </main>
             <footer className="p-2 bg-surface mt-auto border-t border-gray-700/50">
                <div className="flex items-center bg-background rounded-full p-1">
                    <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handlePostComment()}
                        placeholder="Post your reply"
                        disabled={isGeneratingReaction}
                        className="flex-1 bg-transparent px-3 text-white outline-none disabled:opacity-50"
                    />
                    <button onClick={handlePostComment} disabled={!commentText.trim() || isGeneratingReaction} className="bg-nba-blue rounded-full w-20 h-8 text-white font-bold text-sm flex items-center justify-center disabled:opacity-50">
                        {isGeneratingReaction ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Reply"}
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default TweetDetailView;