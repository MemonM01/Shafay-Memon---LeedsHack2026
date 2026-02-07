import { useAuth } from '../context/Userauth';


export default function NavigationBar(){
    const {user, signOut} = useAuth();
    const determineState = () => {
        if (user == null){
            return (
                <a href="/login" className="text-sky-200 no-underline text-lg hover:text-white">Sign Up</a>
            );
        }
        else{
            return (
                <>
                <button onClick={signOut} className="text-sky-200 text-lg hover:text-white cursor-pointer bg-transparent border-0 p-0">Log Out</button>
                </>
            );
        }
    }

    return (
        <div className="w-full bg-slate-950 border-b border-slate-700">
            <div className="max-w-[1100px] mx-auto px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-5">
                    <a href="/" className="text-sky-200 no-underline text-lg hover:text-white">Home</a>
                    <a href="/event" className="text-sky-200 no-underline text-lg hover:text-white">Events</a>
                    <a href="/about" className="text-sky-200 no-underline text-lg hover:text-white">About</a>
                </div>
                <div className="flex items-center gap-5">
                    {determineState()}
                </div>
            </div>
        </div>
    );
}