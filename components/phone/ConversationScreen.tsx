import React, { useState, useRef, useEffect } from 'react';
import { Player, Contact, Message } from '../../types';
import { useTranslations } from '../../hooks/useTranslations';
import { generateContactResponse, analyzeConversationForEvent } from '../../services/puterService';

interface ConversationScreenProps {
    player: Player;
    setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
    contact: Contact;
    onBack: () => void;
    onSendMessage: (contactId: string, message: Message) => void;
    onAiMessage: (contactId: string, message: Message) => void;
}

const ConversationScreen: React.FC<ConversationScreenProps> = ({ player, setPlayer, contact, onBack, onSendMessage, onAiMessage }) => {
    const { t, language } = useTranslations();
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [contact.conversation]);

    const handleSend = async () => {
        if (!inputValue.trim() || isTyping) return;
        const playerMessage: Message = {
            id: `msg-${Date.now()}`,
            sender: 'player',
            text: inputValue,
            timestamp: Date.now()
        };
        const tempInputValue = inputValue;
        onSendMessage(contact.id, playerMessage);
        setInputValue('');
        setIsTyping(true);

        const updatedHistory = [...contact.conversation, playerMessage];
        const aiResponse = (await generateContactResponse(player, contact, language, updatedHistory));
        const aiResponseText = aiResponse?.text || '';
        
        const aiMessage: Message = {
            id: `msg-${Date.now() + 1}`,
            sender: contact.name,
            text: aiResponseText,
            timestamp: Date.now()
        };

        onAiMessage(contact.id, aiMessage);

        const finalHistory = [...updatedHistory, aiMessage];
        // After a few messages, have a chance to trigger a narrative event
        if (finalHistory.length >= 4 && Math.random() < 0.25) {
            const event = await analyzeConversationForEvent(player, contact, language, finalHistory);
            if (event) {
                setPlayer(p => {
                    if (!p) return null;
                    return { ...p, currentEvent: event };
                });
            }
        }
        
        setIsTyping(false);
    };

    return (
        <div className="h-full flex flex-col bg-gray-800">
            <header className="bg-surface/80 backdrop-blur-sm px-3 pt-3 pb-3 flex items-center border-b border-gray-700/50">
                <button onClick={onBack} className="text-white text-lg mr-3">‹</button>
                <img src={contact.avatar} alt={contact.name} className="w-8 h-8 rounded-full mr-3" />
                <div>
                    <h1 className="font-bold text-md text-white">{contact.name}</h1>
                    <p className="text-xs text-gray-400">{contact.type}</p>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-3 space-y-4">
                {contact.conversation.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'player' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                        <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-2xl ${msg.sender === 'player' ? 'bg-nba-blue text-white' : 'bg-surface text-white'}`}>
                            <p className="text-sm">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start animate-fade-in">
                         <div className="max-w-xs lg:max-w-md px-3 py-2 rounded-2xl bg-surface text-white">
                            <p className="text-sm animate-pulse">...</p>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>
            <footer className="p-2 bg-surface">
                <div className="flex items-center bg-background rounded-full p-1">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type a message..."
                        className="flex-1 bg-transparent px-3 text-white outline-none"
                    />
                    <button onClick={handleSend} className="bg-nba-blue rounded-full w-8 h-8 text-white font-bold text-lg flex items-center justify-center transform active:scale-90 transition-transform">↑</button>
                </div>
            </footer>
        </div>
    );
}

export default ConversationScreen;