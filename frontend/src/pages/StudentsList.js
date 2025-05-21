import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import StudentCard from "../components/StudentCard";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function StudentsList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/students`);
      setStudents(response.data);
      setError("");
    } catch (error) {
      console.error("Error fetching students:", error);
      setError("Failed to load students. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Students</h1>
        <Link
          to="/students/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add New Student
        </Link>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search students..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredStudents.length > 0 ? (
        <div className="space-y-3">
          {filteredStudents.map((student) => (
            <StudentCard 
              key={student.id} 
              student={student} 
              refreshStudents={fetchStudents} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          {searchTerm ? (
            <p className="text-gray-600">No students found matching "{searchTerm}".</p>
          ) : (
            <>
              <p className="text-gray-600 mb-4">You haven't added any students yet.</p>
              <Link
                to="/students/new"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Add Your First Student
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default StudentsList;
