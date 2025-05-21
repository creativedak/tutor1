import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import "./App.css";

// Components
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import StudentsList from "./pages/StudentsList";
import StudentForm from "./pages/StudentForm";
import ScheduleView from "./pages/ScheduleView";
import LessonForm from "./pages/LessonForm";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          await axios.get(`${API}/tutors/me`);
          setIsLoggedIn(true);
        } catch (error) {
          console.error("Authentication error:", error);
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };

    checkLoginStatus();
  }, []);

  const ProtectedRoute = ({ children }) => {
    if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
    if (!isLoggedIn) return <Navigate to="/login" />;
    return children;
  };

  return (
    <div className="App bg-gray-100 min-h-screen">
      <BrowserRouter>
        {isLoggedIn && <Navbar setIsLoggedIn={setIsLoggedIn} />}
        <div className={`${isLoggedIn ? 'container mx-auto pt-20 px-4' : ''}`}>
          <Routes>
            <Route path="/login" element={!isLoggedIn ? <Login setIsLoggedIn={setIsLoggedIn} /> : <Navigate to="/" />} />
            <Route path="/register" element={!isLoggedIn ? <Register setIsLoggedIn={setIsLoggedIn} /> : <Navigate to="/" />} />
            
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/students" element={<ProtectedRoute><StudentsList /></ProtectedRoute>} />
            <Route path="/students/new" element={<ProtectedRoute><StudentForm /></ProtectedRoute>} />
            <Route path="/students/edit/:id" element={<ProtectedRoute><StudentForm /></ProtectedRoute>} />
            <Route path="/schedule" element={<ProtectedRoute><ScheduleView /></ProtectedRoute>} />
            <Route path="/lessons/new" element={<ProtectedRoute><LessonForm /></ProtectedRoute>} />
            <Route path="/lessons/edit/:id" element={<ProtectedRoute><LessonForm /></ProtectedRoute>} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
