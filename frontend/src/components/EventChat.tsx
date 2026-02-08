import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/Userauth';

interface Message {
    id: number;
    content: string;
    created_at: string;
    profile_id: string;
    profiles: {
        username: string | null;
        profile_picture_url: string | null;
    } | null;
}

export default function EventChat({ eventId }: { eventId: string }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (!eventId) return;

        // Fetch messages function
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('event_messages')
                .select(`
                    *,
                    profiles (
                        username,
                        profile_picture_url
                    )
                `)
                .eq('event_id', eventId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching messages:', error);
            } else {
                setMessages(data || []);
            }
            setLoading(false);
        };

        // Initial fetch
        fetchMessages();

        // Poll every 1 second for fast updates
        const pollingInterval = setInterval(fetchMessages, 1000);

        return () => {
            clearInterval(pollingInterval);
        };
    }, [eventId]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newMessage.trim()) return;

        const messageContent = newMessage.trim();
        setNewMessage(''); // Clear input early for better UX

        const { error } = await supabase
            .from('event_messages')
            .insert({
                event_id: parseInt(eventId),
                profile_id: user.id,
                content: messageContent
            });

        if (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col h-[500px] bg-zinc-900/50 border border-zinc-800 rounded-3xl items-center justify-center">
                <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-zinc-500 text-sm">Loading chat...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[500px] bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 bg-black/20 flex items-center justify-between">
                <h3 className="font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Event Chat
                </h3>
                <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">
                    {messages.length} Messages
                </span>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth custom-scrollbar"
            >
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center mb-4 text-2xl">💬</div>
                        <p className="text-zinc-400 font-medium">No messages yet</p>
                        <p className="text-zinc-600 text-sm">Be the first to start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isOwnMessage = msg.profile_id === user?.id;
                        return (
                            <div
                                key={msg.id}
                                className={`flex items-start gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                            >
                                <img
                                    src={msg.profiles?.profile_picture_url || 'https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg'}
                                    alt={msg.profiles?.username || 'User'}
                                    className="w-8 h-8 rounded-full border border-zinc-700 object-cover mt-1"
                                />
                                <div className={`flex flex-col space-y-1 max-w-[75%] ${isOwnMessage ? 'items-end' : ''}`}>
                                    <div className="flex items-center gap-2 px-1">
                                        <span className="text-xs font-bold text-zinc-400">
                                            {isOwnMessage ? 'You' : (msg.profiles?.username || 'Anonymous')}
                                        </span>
                                        <span className="text-[10px] text-zinc-600">
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div
                                        className={`px-4 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${isOwnMessage
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-zinc-800 text-zinc-200 rounded-tl-none border border-zinc-700'
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 bg-black/20 border-t border-zinc-800">
                {user ? (
                    <div className="relative flex items-center gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-zinc-800 border border-zinc-700 text-white px-4 py-3 rounded-2xl focus:outline-none focus:border-blue-500 transition-all text-sm pr-12"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="absolute right-2 px-3 py-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
                        >
                            <svg className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-2">
                        <p className="text-xs text-zinc-500">
                            Please <a href="/login" className="text-blue-400 hover:underline">sign in</a> to participate in the chat.
                        </p>
                    </div>
                )}
            </form>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #27272a;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #3f3f46;
                }
            `}</style>
        </div>
    );
}
