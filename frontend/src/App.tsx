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
      <Navbar />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
        <Route path="/event" element={user ? <Navigate to="/" replace /> : <Grid />} />
        <Route path="/about" element={user ? <Navigate to="/" replace /> : <About />} />
        <Route path="/events/:id" element={<EventDetails />} />
        <Route
          path="/"
          element={
            <Landing />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
