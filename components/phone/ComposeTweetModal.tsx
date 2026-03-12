import React, { useState } from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import { Tweet } from '../../types';

interface ComposeTweetModalProps {
    onClose: () => void;
    onPost: (tweetText: string) => void;
    isPosting: boolean;
    tweetToQuote?: Tweet | null;
}

const ComposeTweetModal: React.FC<ComposeTweetModalProps> = ({ onClose, onPost, isPosting, tweetToQuote }) => {
    const { t } = useTranslations();
    const [tweetText, setTweetText] = useState('');
    const charLimit = 280;

    const handlePost = () => {
        if (!isPosting) {
            onPost(tweetText);
        }
    };
    
    const postButtonText = () => {
        if (isPosting) return 'Posting...';
        if (tweetToQuote) {
            return tweetText.trim() === '' ? 'Retweet' : 'Post';
        }
        return 'Post';
    }

    return (
        <div className="absolute inset-0 bg-gray-900 z-30 flex flex-col animate-slide-up">
            <header className="flex justify-between items-center px-3 pt-3 pb-3 border-b border-gray-700/50">
                <button onClick={onClose} className="text-blue-400">Cancel</button>
                <button onClick={handlePost} disabled={!tweetToQuote && !tweetText.trim() || isPosting} className="bg-blue-500 text-white font-bold px-4 py-1.5 rounded-full disabled:opacity-50">
                    {postButtonText()}
                </button>
            </header>
            <div className="p-3 flex-1 flex flex-col">
                <textarea
                    value={tweetText}
                    onChange={(e) => setTweetText(e.target.value.slice(0, charLimit))}
                    placeholder={tweetToQuote ? "Add a comment..." : "What's happening?"}
                    className="w-full bg-transparent text-white text-lg outline-none resize-none"
                    autoFocus
                />
                {tweetToQuote && (
                    <div className="mt-2 p-2 border border-gray-700 rounded-lg">
                        <div className="flex space-x-2">
                            <img src={tweetToQuote.avatar} alt="avatar" className="w-8 h-8 rounded-full bg-gray-700" />
                            <div className="flex-1">
                                <div className="flex items-center space-x-1">
                                    <span className="font-bold text-white truncate text-sm">{tweetToQuote.author}</span>
                                    <span className="text-gray-400 text-xs truncate">{tweetToQuote.handle}</span>
                                </div>
                                <p className="text-white whitespace-pre-wrap text-sm my-1 break-words max-h-20 overflow-hidden">{tweetToQuote.content}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="p-3 mt-auto border-t border-gray-700/50 flex justify-end items-center">
                <span className="text-sm text-gray-400">
                    {charLimit - tweetText.length}
                </span>
            </div>
        </div>
    );
};

export default ComposeTweetModal;