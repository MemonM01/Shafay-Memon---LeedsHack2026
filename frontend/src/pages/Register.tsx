import AuthForm from '../components/AuthForm';

export default function Register() {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
            <div className="z-10 w-full flex flex-col items-center">
                <AuthForm mode="register" />
            </div>
        </div>
    );
}
