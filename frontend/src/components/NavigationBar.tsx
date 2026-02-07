import { useState } from 'react';
import { useAuth } from '../context/Userauth';
import LinkUpLogo from '../assets/LinkUpLogo.png';


export default function NavigationBar(){
    const {user, signOut} = useAuth();
    const [open, setOpen] = useState(false);

    const AuthActions = () => {
        if (!user) {
            return (
                <a href="/login" className="text-sky-200 no-underline text-sm md:text-base hover:text-white font-medium">Sign In</a>
            );
        }

        return (
            <div className="flex items-center gap-3">
                <button onClick={signOut} className="text-sky-200 text-sm md:text-base hover:text-white font-medium bg-transparent border-0 p-0 cursor-pointer">Sign Out</button>
                <a href="/create" className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-3 py-1.5 rounded-md text-sm font-semibold transition">Create</a>
            </div>
        );
    }

    return (
        <nav className="sticky top-0 z-50 bg-transparent border-b border-zinc-800 shadow-sm">
            <div className="max-w-[1100px] mx-auto px-4 py-3 flex items-center justify-between">
                <a href="/" className="flex items-center gap-3">
                    <img src={LinkUpLogo} alt="LinkUp" className="h-8 w-auto rounded-md" />
                    <span className="text-white font-semibold tracking-wide">LinkUp</span>
                </a>

                <div className="hidden md:flex items-center gap-8">
                    <a href="/" className="text-zinc-300 text-sm uppercase tracking-wide hover:text-white transition">Home</a>
                    <a href="/event" className="text-zinc-300 text-sm uppercase tracking-wide hover:text-white transition">Events</a>
                    <a href="/about" className="text-zinc-300 text-sm uppercase tracking-wide hover:text-white transition">About</a>
                </div>

                <div className="hidden md:flex items-center gap-4">
                    <AuthActions />
                </div>

                {/* Mobile menu button */}
                <div className="md:hidden flex items-center">
                    <button onClick={() => setOpen(!open)} aria-label="Toggle menu" className="p-2 rounded-md text-sky-200 hover:bg-zinc-900 transition">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {open ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile dropdown */}
            {open && (
                <div className="md:hidden px-4 pb-4">
                    <div className="flex flex-col gap-3">
                        <a href="/" className="text-sky-200 text-base hover:text-white">Home</a>
                        <a href="/event" className="text-sky-200 text-base hover:text-white">Events</a>
                        <a href="/about" className="text-sky-200 text-base hover:text-white">About</a>
                        <div className="pt-2 border-t border-zinc-800">
                            <AuthActions />
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}