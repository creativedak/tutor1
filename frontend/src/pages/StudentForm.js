import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function StudentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: "",
    notes: "",
    lesson_link: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEditMode) {
      fetchStudent();
    }
  }, [id]);

  const fetchStudent = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/students/${id}`);
      setFormData({
        name: response.data.name || "",
        notes: response.data.notes || "",
        lesson_link: response.data.lesson_link || "",
      });
    } catch (error) {
      console.error("Error fetching student:", error);
      setError("Failed to load student data. Please try again later.");
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
    setLoading(true);
    setError("");

    try {
      if (isEditMode) {
        await axios.put(`${API}/students/${id}`, formData);
      } else {
        await axios.post(`${API}/students`, formData);
      }
      navigate("/students");
    } catch (error) {
      console.error("Error saving student:", error);
      setError("Failed to save student. Please try again later.");
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
        {isEditMode ? "Edit Student" : "Add New Student"}
      </h1>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name" className="form-label">
            Student Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="form-input"
            placeholder="John Doe"
          />
        </div>

        <div className="form-group">
          <label htmlFor="lesson_link" className="form-label">
            Lesson Link (Optional)
          </label>
          <input
            type="text"
            id="lesson_link"
            name="lesson_link"
            value={formData.lesson_link}
            onChange={handleChange}
            className="form-input"
            placeholder="https://meet.google.com/xxx-xxxx-xxx"
          />
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
            placeholder="Add any notes about this student..."
          ></textarea>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            disabled={loading}
            className="form-button"
          >
            {loading ? "Saving..." : isEditMode ? "Update Student" : "Add Student"}
          </button>
          <Link
            to="/students"
            className="form-button-secondary text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

export default StudentForm;
