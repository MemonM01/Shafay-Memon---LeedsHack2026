import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/Userauth';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
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
