import React, { useState } from 'react';
import { Player, Tweet } from '../../types';
import TweetCard from './TweetCard';
import { TEAMS } from '../../constants';

interface ProfileScreenProps {
    player: Player;
    setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
    onTweetSelect: (tweet: Tweet) => void;
}

const VerifiedBadge: React.FC = () => (
  <svg viewBox="0 0 22 22" aria-label="Verified account" className="w-5 h-5 text-blue-400 fill-current inline-block ml-1">
    <g><path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-1-.9-1.03l-.018-.018c-.055-.055-.11-.11-.165-.165l-.018-.018c-1.1-1.1-2.2-1.65-3.3-1.65s-2.2.55-3.3 1.65l-.018.018c-.055.055-.11.11-.165.165l-.018.018c-.046.03-.546-.49-.9 1.03-.355-.54-.552 1.17-.57 1.816.018.646.215 1.275.57 1.816.354.54.852 1 .9 1.03l.018.018c.055.055.11.11.165.165l.018.018c1.1 1.1 2.2 1.65 3.3 1.65s2.2-.55 3.3-1.65l.018-.018c.055-.055.11-.11.165-.165l.018-.018c.046-.03.546-.49.9-1.03.355-.54.552-1.17.57-1.816zm-5.215-2.12c.22.22.22.576 0 .796l-3.3 3.3c-.11.11-.254.165-.398.165s-.287-.055-.398-.165l-1.65-1.65c-.22-.22-.22-.576 0-.796.22-.22.576-.22.796 0l1.253 1.253 2.903-2.904c.22-.22.576-.22.796 0z"></path></g>
  </svg>
);

const ProfileScreen: React.FC<ProfileScreenProps> = ({ player, setPlayer, onTweetSelect }) => {
    const { socialProfile, socialFeed } = player.phone;
    const playerHandle = `@${player.name.replace(/\s/g, '')}`;
    const playerTweets = socialFeed.filter(t => t.handle === playerHandle || (t.retweetOf && t.author === player.name));
    
    const [isEditing, setIsEditing] = useState(false);
    const [editBio, setEditBio] = useState(socialProfile.bio);

    const handleSaveProfile = () => {
        setPlayer(p => {
            if (!p) return null;
            return {
                ...p,
                phone: {
                    ...p.phone,
                    socialProfile: {
                        ...p.phone.socialProfile,
                        bio: editBio,
                    }
                }
            }
        });
        setIsEditing(false);
    };
    
    const team = TEAMS[player.team];
    const headerStyle = team ? {
        background: `linear-gradient(135deg, ${team.primaryColor}, ${team.secondaryColor})`
    } : { backgroundColor: '#333' };

    return (
        <div className="h-full flex flex-col bg-gray-900 overflow-y-auto">
            {/* Edit Profile Modal */}
            {isEditing && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-surface rounded-xl p-4 w-full max-w-sm flex flex-col gap-4">
                        <h3 className="font-bold text-white text-lg text-center">Edit Profile</h3>
                        <div>
                            <label className="text-xs text-gray-400">Bio</label>
                            <textarea 
                                value={editBio}
                                onChange={e => setEditBio(e.target.value)}
                                className="w-full h-20 bg-background rounded-md p-2 text-white outline-none border border-gray-700 resize-none"
                            />
                        </div>
                        <div className="flex gap-2 mt-2">
                            <button onClick={() => setIsEditing(false)} className="flex-1 bg-gray-600 p-2 rounded-lg font-bold">Cancel</button>
                            <button onClick={handleSaveProfile} className="flex-1 bg-blue-500 p-2 rounded-lg font-bold">Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Header */}
            <div>
                <div style={headerStyle} className="h-28 relative">
                    <img src={player.phone.socialProfile.avatarUrl} alt="avatar" className="w-20 h-20 rounded-full absolute -bottom-10 left-4 border-4 border-gray-900 bg-gray-700" />
                </div>
                <div className="text-right p-3 border-b border-gray-700/50">
                    <button onClick={() => setIsEditing(true)} className="border border-gray-500 text-white font-bold px-3 py-1 rounded-full text-sm">
                        Edit Profile
                    </button>
                </div>
                <div className="p-3">
                    <div className="flex items-center">
                        <h2 className="font-bold text-xl text-white">{player.name}</h2>
                        <VerifiedBadge />
                    </div>
                    <p className="text-sm text-gray-400">{playerHandle}</p>
                    <p className="text-white mt-2 text-sm whitespace-pre-wrap">{socialProfile.bio}</p>
                </div>
            </div>

            {/* Player's Tweets */}
            <div className="border-t border-gray-700/50">
                <h3 className="p-3 font-bold text-white">My Tweets</h3>
                {playerTweets.map(tweet => (
                    <TweetCard key={tweet.id} tweet={tweet} player={player} setPlayer={setPlayer} onCommentClick={onTweetSelect} onRetweetClick={() => {}} />
                ))}
                {playerTweets.length === 0 && <p className="text-center text-gray-400 p-4">You haven't posted anything yet.</p>}
            </div>
        </div>
    );
};

export default ProfileScreen;