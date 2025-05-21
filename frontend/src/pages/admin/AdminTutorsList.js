import { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function AdminTutorsList() {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchTutors = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/admin/tutors`);
      setTutors(response.data);
      setError("");
    } catch (error) {
      console.error("Error fetching tutors:", error);
      setError("Failed to load tutors. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTutors();
  }, []);

  const handleToggleAdmin = async (tutorId) => {
    try {
      await axios.put(`${API}/admin/tutors/${tutorId}/admin`);
      fetchTutors();
    } catch (error) {
      console.error("Error updating admin status:", error);
      setError("Failed to update admin status. Please try again later.");
    }
  };

  const handleDeleteTutor = async (tutorId, tutorName) => {
    if (window.confirm(`Are you sure you want to delete tutor ${tutorName}? This will also delete all their students and lessons.`)) {
      try {
        await axios.delete(`${API}/admin/tutors/${tutorId}`);
        fetchTutors();
      } catch (error) {
        console.error("Error deleting tutor:", error);
        if (error.response && error.response.status === 400) {
          setError("You cannot delete your own account.");
        } else {
          setError("Failed to delete tutor. Please try again later.");
        }
      }
    }
  };

  const filteredTutors = tutors.filter(tutor =>
    tutor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tutor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Tutors</h1>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search tutors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
        </div>
      ) : filteredTutors.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow-md">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Joined</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTutors.map((tutor) => (
                <tr key={tutor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-800">{tutor.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {tutor.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(tutor.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {tutor.is_admin ? (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        Admin
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        Tutor
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => handleToggleAdmin(tutor.id)}
                      className="text-purple-600 hover:text-purple-900 mr-4"
                    >
                      {tutor.is_admin ? "Remove Admin" : "Make Admin"}
                    </button>
                    <button 
                      onClick={() => handleDeleteTutor(tutor.id, tutor.name)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          {searchTerm ? (
            <p className="text-gray-600">No tutors found matching "{searchTerm}".</p>
          ) : (
            <p className="text-gray-600">No tutors found.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminTutorsList;