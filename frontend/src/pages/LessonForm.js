import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function LessonForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = !!id;

  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    student_id: "",
    subject: "",
    start_time: "",
    end_time: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStudents();
    
    if (isEditMode) {
      fetchLesson();
    } else if (location.state?.date) {
      // Pre-fill date if coming from calendar
      const date = new Date(location.state.date);
      const dateString = date.toISOString().split('T')[0];
      
      // Set default times (e.g. 1 hour session starting at noon)
      const startTime = `${dateString}T12:00:00`;
      const endTime = `${dateString}T13:00:00`;
      
      setFormData({
        ...formData,
        start_time: startTime,
        end_time: endTime,
      });
    }
  }, [id, location.state]);

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API}/students`);
      setStudents(response.data);
      
      // If there's at least one student and we're in create mode, select the first one by default
      if (response.data.length > 0 && !isEditMode && !formData.student_id) {
        setFormData(prev => ({
          ...prev,
          student_id: response.data[0].id
        }));
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      setError("Failed to load students. Please try again later.");
    }
  };

  const fetchLesson = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/lessons/${id}`);
      
      // Format datetime strings for form inputs
      const lesson = response.data;
      const formattedStartTime = new Date(lesson.start_time)
        .toISOString()
        .slice(0, 16); // Format: YYYY-MM-DDThh:mm
      
      const formattedEndTime = new Date(lesson.end_time)
        .toISOString()
        .slice(0, 16);
      
      setFormData({
        title: lesson.title || "",
        student_id: lesson.student_id || "",
        subject: lesson.subject || "",
        start_time: formattedStartTime,
        end_time: formattedEndTime,
        notes: lesson.notes || "",
      });
    } catch (error) {
      console.error("Error fetching lesson:", error);
      setError("Failed to load lesson data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.student_id) {
      setError("Please select a student.");
      return;
    }
    
    // Validate that end time is after start time
    if (new Date(formData.end_time) <= new Date(formData.start_time)) {
      setError("End time must be after start time.");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      if (isEditMode) {
        await axios.put(`${API}/lessons/${id}`, formData);
      } else {
        await axios.post(`${API}/lessons`, formData);
      }
      navigate("/schedule");
    } catch (error) {
      console.error("Error saving lesson:", error);
      setError("Failed to save lesson. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="form-container">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {isEditMode ? "Edit Lesson" : "Schedule New Lesson"}
      </h1>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      {students.length === 0 && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          You need to add a student before you can schedule lessons.{" "}
          <Link to="/students/new" className="underline">Add a student</Link>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title" className="form-label">
            Lesson Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="form-input"
            placeholder="Math Tutoring"
          />
        </div>

        <div className="form-group">
          <label htmlFor="student_id" className="form-label">
            Student
          </label>
          <select
            id="student_id"
            name="student_id"
            value={formData.student_id}
            onChange={handleChange}
            required
            className="form-input"
            disabled={students.length === 0}
          >
            <option value="">Select a student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="subject" className="form-label">
            Subject
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            className="form-input"
            placeholder="Mathematics, Physics, etc."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-group">
            <label htmlFor="start_time" className="form-label">
              Start Time
            </label>
            <input
              type="datetime-local"
              id="start_time"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="end_time" className="form-label">
              End Time
            </label>
            <input
              type="datetime-local"
              id="end_time"
              name="end_time"
              value={formData.end_time}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="notes" className="form-label">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="form-textarea"
            rows="4"
            placeholder="Add any notes about this lesson..."
          ></textarea>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            disabled={loading || students.length === 0}
            className="form-button"
          >
            {loading ? "Saving..." : isEditMode ? "Update Lesson" : "Schedule Lesson"}
          </button>
          <Link
            to="/schedule"
            className="form-button-secondary text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

export default LessonForm;
