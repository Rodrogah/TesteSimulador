import React from 'react';
import { Player, Tweet } from '../../types';
import { findAndModifyTweet } from './utils';

interface TweetCardProps {
    tweet: Tweet;
    player: Player;
    setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
    onCommentClick: (tweet: Tweet) => void;
    onRetweetClick: (tweet: Tweet) => void;
    depth?: number;
}

const VerifiedBadge: React.FC = () => (
  <svg viewBox="0 0 22 22" aria-label="Verified account" className="w-4 h-4 text-blue-400 fill-current inline-block ml-1 self-center">
    <g><path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-1-.9-1.03l-.018-.018c-.055-.055-.11-.11-.165-.165l-.018-.018c-1.1-1.1-2.2-1.65-3.3-1.65s-2.2.55-3.3 1.65l-.018.018c-.055.055-.11.11-.165.165l-.018.018c-.046.03-.546-.49-.9 1.03-.355-.54-.552 1.17-.57 1.816.018.646.215 1.275.57 1.816.354.54.852 1 .9 1.03l.018.018c.055.055.11.11.165.165l.018.018c1.1 1.1 2.2 1.65 3.3 1.65s2.2-.55 3.3-1.65l.018-.018c.055-.055.11-.11.165-.165l.018-.018c.046-.03.546-.49.9-1.03.355-.54.552-1.17.57-1.816zm-5.215-2.12c.22.22.22.576 0 .796l-3.3 3.3c-.11.11-.254.165-.398.165s-.287-.055-.398-.165l-1.65-1.65c-.22-.22-.22-.576 0-.796.22-.22.576-.22.796 0l1.253 1.253 2.903-2.904c.22-.22.576-.22.796 0z"></path></g>
  </svg>
);

const TweetCard: React.FC<TweetCardProps> = ({ tweet, player, setPlayer, onCommentClick, onRetweetClick, depth = 0 }) => {
    const isLiked = player.phone.likedTweetIds.includes(tweet.id);
    const isRetweeted = player.phone.retweetedTweetIds.includes(tweet.id);

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPlayer(p => {
            if (!p) return null;
            const liked = p.phone.likedTweetIds.includes(tweet.id);
            const newLikedIds = liked
                ? p.phone.likedTweetIds.filter(id => id !== tweet.id)
                : [...p.phone.likedTweetIds, tweet.id];

            const { modifiedTweets } = findAndModifyTweet(p.phone.socialFeed, tweet.id, (t) => ({ likes: t.likes + (liked ? -1 : 1) }), p);

            return { ...p, phone: { ...p.phone, likedTweetIds: newLikedIds, socialFeed: modifiedTweets } };
        });
    };

    return (
        <React.Fragment>
            <div className="border-b border-gray-700/50">
                <div 
                    className="p-2 flex space-x-2 cursor-pointer hover:bg-gray-800/50" 
                    style={{ paddingLeft: `${0.5 + depth * 1.25}rem` }}
                    onClick={(e) => { e.stopPropagation(); onCommentClick(tweet); }}
                >
                    <div className="flex-shrink-0 w-10 relative">
                         {depth > 0 && <div className="absolute top-0 -left-2 w-0.5 h-full bg-gray-700/50 -translate-x-full"></div>}
                        <img src={tweet.avatar} alt="avatar" className="w-10 h-10 rounded-full bg-gray-700" />
                    </div>
                    <div className="flex-1">
                        {(!tweet.content && tweet.retweetOf) && (
                            <div className="text-xs text-gray-400 mb-1 flex items-center">
                                <span className="mr-1">🔁</span> {tweet.author} Retweeted
                            </div>
                        )}
                        <div className="flex items-center space-x-1">
                            <span className="font-bold text-white truncate text-sm">{tweet.author}</span>
                            {tweet.isVerified && <VerifiedBadge />}
                            <span className="text-gray-400 text-xs truncate">{tweet.handle}</span>
                        </div>
                        {tweet.content && (
                            <p className="text-white whitespace-pre-wrap text-sm my-1 break-words">{tweet.content}</p>
                        )}
                        
                        {tweet.retweetOf && (
                            <div className="mt-2 p-2 border border-gray-700 rounded-lg cursor-pointer hover:bg-gray-800">
                                <div className="flex space-x-2">
                                    <img src={tweet.retweetOf.avatar} alt={`${tweet.retweetOf.author}'s avatar`} className="w-8 h-8 rounded-full bg-gray-700" />
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-1">
                                            <span className="font-bold text-white truncate text-sm">{tweet.retweetOf.author}</span>
                                            {tweet.retweetOf.isVerified && <VerifiedBadge />}
                                            <span className="text-gray-400 text-xs truncate">{tweet.retweetOf.handle}</span>
                                        </div>
                                        <p className="text-white whitespace-pre-wrap text-sm my-1 break-words">{tweet.retweetOf.content}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between text-gray-500 mt-2 text-xs max-w-[200px]">
                            <button onClick={(e) => { e.stopPropagation(); onCommentClick(tweet); }} className="flex items-center gap-1 hover:text-blue-400 transition-colors">
                                <span>💬</span>
                                <span>{tweet.comments.length > 0 ? tweet.comments.length : ''}</span>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onRetweetClick(tweet); }} className={`flex items-center gap-1 hover:text-green-400 transition-colors ${isRetweeted ? 'text-green-400 font-bold' : ''}`}>
                                <span>🔁</span>
                                <span>{tweet.retweets > 0 ? tweet.retweets : ''}</span>
                            </button>
                            <button onClick={handleLike} className={`flex items-center gap-1 hover:text-pink-500 transition-colors ${isLiked ? 'text-pink-500 font-bold' : ''}`}>
                                <span>❤️</span>
                                <span>{tweet.likes > 0 ? tweet.likes : ''}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {tweet.comments && tweet.comments.length > 0 && (
                <div>
                    {tweet.comments.map(comment => (
                        <TweetCard
                            key={comment.id}
                            tweet={comment}
                            player={player}
                            setPlayer={setPlayer}
                            onCommentClick={onCommentClick}
                            onRetweetClick={onRetweetClick}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </React.Fragment>
    );
};

export default TweetCard;