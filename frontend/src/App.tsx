import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/Userauth';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import Grid from './pages/Grid';
import Navbar from "./components/NavigationBar";
import About from "./pages/About";


import EventDetails from './pages/EventDetails';

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <div className="h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 min-h-0">
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
            <Route path="/event" element={<Grid />} />
            <Route path="/about" element={<About />} />
            <Route path="/events/:id" element={<EventDetails />} />
            <Route
              path="/"
              element={
                <Landing />
              }
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
