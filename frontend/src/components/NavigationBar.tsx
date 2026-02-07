import "../styles/navbar.css";
import { useAuth } from '../context/Userauth';


export default function NavigationBar(){
    const {user, signOut} = useAuth();
    const determineState = () => {
        if (user == null){
            return(
                <a href="/login">Sign Up</a>
            );
        }
        else{
            return (
                <>
                <a onClick={signOut} style={{ cursor: 'pointer' }}>Log Out</a>
                </>
            );
        }
    }

    return (
        <div className="navbar">
            <div className="navbar-content">
                <div className="navbar-left">
                    <a href="/">Home</a>
                    <a href="/event">Events</a>
                </div>
                <div className="navbar-right">
                    {determineState()}
                </div>
                
            </div>
        </div>
    );
}