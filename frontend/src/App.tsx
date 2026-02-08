import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/Userauth';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import Grid from './pages/Grid';
import Navbar from "./components/NavigationBar";
import About from "./pages/About";
import MyEvents from "./pages/MyEvents";
import ProtectedRoute from './components/ProtectedRoute';
import Profile from "./pages/Profile"
import ProfileViewer from "./pages/ProfileViewer"
import CreateButton from './components/CreateButton';


import EventDetails from './pages/EventDetails';

import { EventsProvider } from './context/EventsContext';

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <EventsProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <div className="flex-1 pt-[57px]">
            <Routes>
              <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
              <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/profile/:username" element={<ProfileViewer />} />
              <Route path="/event" element={<Grid />} />
              <Route path="/about" element={<About />} />
              <Route path="/events/:id" element={<EventDetails />} />
              <Route path="/my-events" element={<ProtectedRoute><MyEvents /></ProtectedRoute>} />
              <Route path="/" element={<Landing />} />
            </Routes>
          </div>
          <CreateButton />
        </div>
      </EventsProvider>
    </Router>
  );
}

export default App;
