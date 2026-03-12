import React, { useState } from 'react';
import { Player, Contact, Message } from '../../types';
import { useTranslations } from '../../hooks/useTranslations';
import ConversationScreen from './ConversationScreen';

interface ContactsAppProps {
    player: Player;
    setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
}

const ContactsApp: React.FC<ContactsAppProps> = ({ player, setPlayer }) => {
    const { t } = useTranslations();
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

    const handleSendMessage = (contactId: string, message: Message) => {
        setPlayer(p => {
            if (!p) return null;
            const updatedContacts = p.phone.contacts.map(c => 
                c.id === contactId ? { ...c, conversation: [...c.conversation, message] } : c
            );
            return { ...p, phone: { ...p.phone, contacts: updatedContacts } };
        });
    };
    
    const handleAiMessage = (contactId: string, message: Message) => {
        setPlayer(p => {
            if (!p) return null;
            const updatedContacts = p.phone.contacts.map(c => 
                c.id === contactId ? { ...c, conversation: [...c.conversation, message] } : c
            );
            return { ...p, phone: { ...p.phone, contacts: updatedContacts } };
        });
    };

    const selectedContact = player.phone.contacts.find(c => c.id === selectedContactId);

    if (selectedContact) {
        return <ConversationScreen 
            player={player} 
            contact={selectedContact} 
            onBack={() => setSelectedContactId(null)}
            onSendMessage={handleSendMessage}
            onAiMessage={handleAiMessage}
        />
    }

    return (
         <div className="h-full flex flex-col bg-gray-900">
            <header className="bg-surface/80 backdrop-blur-sm px-3 pt-3 pb-3 text-center border-b border-gray-700/50">
                <h1 className="font-bold text-lg text-white">{t('phone.contacts.title') as string}</h1>
            </header>
            <main className="flex-1 overflow-y-auto">
                {player.phone.contacts.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 mt-10">{t('phone.contacts.noContacts') as string}</div>
                ) : (
                    <div>
                        {player.phone.contacts.map(contact => (
                            <button key={contact.id} onClick={() => setSelectedContactId(contact.id)} className="w-full flex items-center p-3 border-b border-gray-700/50 hover:bg-gray-800 transition-colors">
                                <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-full mr-4" />
                                <div>
                                    <p className="font-semibold text-white text-left">{contact.name}</p>
                                    <p className="text-sm text-gray-400 text-left">{contact.type}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default ContactsApp;