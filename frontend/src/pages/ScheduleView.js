import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Calendar from "../components/Calendar";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function ScheduleView() {
  const [lessons, setLessons] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [lessonsResponse, studentsResponse] = await Promise.all([
        axios.get(`${API}/lessons`),
        axios.get(`${API}/students`)
      ]);
      
      setLessons(lessonsResponse.data);
      setStudents(studentsResponse.data);
      setError("");
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load schedule data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Schedule</h1>
        <Link
          to="/lessons/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add New Lesson
        </Link>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <Calendar 
          lessons={lessons} 
          students={students} 
          refreshData={fetchData} 
        />
      )}
    </div>
  );
}

export default ScheduleView;
