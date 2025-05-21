import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [tutorInfo, setTutorInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch tutor info
        const tutorResponse = await axios.get(`${API}/tutors/me`);
        setTutorInfo(tutorResponse.data);

        // Fetch students
        const studentsResponse = await axios.get(`${API}/students`);
        setStudents(studentsResponse.data);

        // Fetch lessons
        const lessonsResponse = await axios.get(`${API}/lessons`);
        setLessons(lessonsResponse.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Get today's and upcoming lessons
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysLessons = lessons.filter(lesson => {
    const lessonDate = new Date(lesson.start_time);
    lessonDate.setHours(0, 0, 0, 0);
    return lessonDate.getTime() === today.getTime();
  });

  const upcomingLessons = lessons.filter(lesson => {
    const lessonDate = new Date(lesson.start_time);
    lessonDate.setHours(0, 0, 0, 0);
    return lessonDate.getTime() > today.getTime();
  }).sort((a, b) => new Date(a.start_time) - new Date(b.start_time)).slice(0, 5);

  // Calculate student stats
  const unpaidStudents = students.filter(student => !student.payment_status);
  const pendingHomeworkStudents = students.filter(student => !student.homework_status);

  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : "Unknown student";
  };

  const formatLessonTime = (datetime) => {
    const date = new Date(datetime);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-80px)]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
        <div className="w-full md:w-2/3">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Welcome, {tutorInfo?.name}!</h2>
            <p className="text-gray-600 mb-4">
              This is your dashboard where you can manage your tutoring business.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <Link 
                to="/students/new" 
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-center"
              >
                Add New Student
              </Link>
              <Link 
                to="/lessons/new" 
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-center"
              >
                Schedule a Lesson
              </Link>
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/3">
          <div className="card">
            <h3 className="card-title">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">{students.length}</div>
                <div className="text-sm text-gray-600">Total Students</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-3xl font-bold text-green-600">{lessons.length}</div>
                <div className="text-sm text-gray-600">Total Lessons</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="text-3xl font-bold text-red-600">{unpaidStudents.length}</div>
                <div className="text-sm text-gray-600">Unpaid Students</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="text-3xl font-bold text-yellow-600">{pendingHomeworkStudents.length}</div>
                <div className="text-sm text-gray-600">Pending Homework</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
        <div className="w-full md:w-1/2">
          <div className="card h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="card-title">Today's Lessons</h3>
              <Link to="/schedule" className="text-blue-600 text-sm hover:underline">View All</Link>
            </div>
            
            {todaysLessons.length > 0 ? (
              <div className="space-y-3">
                {todaysLessons.map(lesson => (
                  <div key={lesson.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                    <div className="flex justify-between">
                      <span className="font-semibold">{formatLessonTime(lesson.start_time)} - {formatLessonTime(lesson.end_time)}</span>
                      <Link to={`/lessons/edit/${lesson.id}`} className="text-blue-600 hover:underline text-sm">Edit</Link>
                    </div>
                    <div>{getStudentName(lesson.student_id)}</div>
                    <div className="text-sm text-gray-600">{lesson.subject}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No lessons scheduled for today.</p>
            )}
          </div>
        </div>

        <div className="w-full md:w-1/2">
          <div className="card h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="card-title">Upcoming Lessons</h3>
              <Link to="/schedule" className="text-blue-600 text-sm hover:underline">View All</Link>
            </div>
            
            {upcomingLessons.length > 0 ? (
              <div className="space-y-3">
                {upcomingLessons.map(lesson => {
                  const lessonDate = new Date(lesson.start_time);
                  return (
                    <div key={lesson.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                      <div className="flex justify-between">
                        <span className="font-semibold">
                          {lessonDate.toLocaleDateString()} at {formatLessonTime(lesson.start_time)}
                        </span>
                        <Link to={`/lessons/edit/${lesson.id}`} className="text-blue-600 hover:underline text-sm">Edit</Link>
                      </div>
                      <div>{getStudentName(lesson.student_id)}</div>
                      <div className="text-sm text-gray-600">{lesson.subject}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500">No upcoming lessons scheduled.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
