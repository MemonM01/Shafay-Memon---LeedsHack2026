import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link, useNavigate } from 'react-router-dom';

interface AuthFormProps {
    mode: 'login' | 'register';
}

export default function AuthForm({ mode }: AuthFormProps) {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const navigate = useNavigate();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            if (mode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                navigate('/dashboard');
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            username: username,
                        },

                    },
                });
                if (error) throw error;
                setMessage({ type: 'success', text: 'Check your email for confirmation.' });
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                setMessage({ type: 'error', text: error.message });
            } else {
                setMessage({ type: 'error', text: 'An unexpected error occurred' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md p-8 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl">
            <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold tracking-tighter text-white uppercase">
                    {mode === 'login' ? 'Login' : 'Register'}
                </h2>
            </div>

            <form onSubmit={handleAuth} className="space-y-5">
                {mode === 'register' && (
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500 ml-1">Username</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/10 transition-all placeholder:text-zinc-700"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500 ml-1">Email</label>
                    <input
                        type="email"
                        required
                        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/10 transition-all placeholder:text-zinc-700"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-500 ml-1">Password</label>
                    <input
                        type="password"
                        required
                        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/10 transition-all placeholder:text-zinc-700"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-zinc-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                    {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Sign Up')}
                </button>
            </form>

            {message && (
                <div className={`mt-6 p-4 rounded-xl text-xs border font-medium ${message.type === 'success' ? 'bg-white/5 border-white/10 text-zinc-300' : 'bg-red-950/20 border-red-900/30 text-red-400'
                    }`}>
                    {message.text}
                </div>
            )}

            <div className="mt-8 pt-6 border-t border-zinc-900 text-center">
                <Link
                    to={mode === 'login' ? '/register' : '/login'}
                    className="text-zinc-500 hover:text-white text-[10px] uppercase tracking-widest font-bold transition-colors"
                >
                    {mode === 'login' ? "Register Account" : 'Back to Login'}
                </Link>
            </div>
        </div>
    );
}
