import { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function AdminLessonsList() {
  const [lessons, setLessons] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [tutorFilter, setTutorFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [lessonsResponse, tutorsResponse, studentsResponse] = await Promise.all([
          axios.get(`${API}/admin/lessons`),
          axios.get(`${API}/admin/tutors`),
          axios.get(`${API}/admin/students`)
        ]);
        
        setLessons(lessonsResponse.data);
        setTutors(tutorsResponse.data);
        setStudents(studentsResponse.data);
        setError("");
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getTutorName = (tutorId) => {
    const tutor = tutors.find(t => t.id === tutorId);
    return tutor ? tutor.name : "Unknown Tutor";
  };

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : "Unknown Student";
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMinutes = Math.round((end - start) / (1000 * 60));
    
    if (durationMinutes < 60) {
      return `${durationMinutes} min`;
    } else {
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  };

  const filteredLessons = lessons.filter(lesson => {
    const matchesSearch = 
      lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getStudentName(lesson.student_id).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTutor = tutorFilter ? lesson.tutor_id === tutorFilter : true;
    
    let matchesDate = true;
    if (dateFilter) {
      const lessonDate = new Date(lesson.start_time).toISOString().split('T')[0];
      matchesDate = lessonDate === dateFilter;
    }
    
    return matchesSearch && matchesTutor && matchesDate;
  });

  // Sort lessons by start time (most recent first)
  const sortedLessons = [...filteredLessons].sort((a, b) => 
    new Date(b.start_time) - new Date(a.start_time)
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">All Lessons</h1>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <input
            type="text"
            placeholder="Search lessons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <select
            value={tutorFilter}
            onChange={(e) => setTutorFilter(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Tutors</option>
            {tutors.map(tutor => (
              <option key={tutor.id} value={tutor.id}>{tutor.name}</option>
            ))}
          </select>
        </div>
        <div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
        </div>
      ) : sortedLessons.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow-md">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Subject</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Tutor</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Student</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date & Time</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedLessons.map((lesson) => (
                <tr key={lesson.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-800">{lesson.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {lesson.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {getTutorName(lesson.tutor_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {getStudentName(lesson.student_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDateTime(lesson.start_time)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDuration(lesson.start_time, lesson.end_time)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          {searchTerm || tutorFilter || dateFilter ? (
            <p className="text-gray-600">No lessons found matching your filters.</p>
          ) : (
            <p className="text-gray-600">No lessons found in the system.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminLessonsList;