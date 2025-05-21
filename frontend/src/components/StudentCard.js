import { Link } from "react-router-dom";
import axios from "axios";
import { useState } from "react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function StudentCard({ student, refreshStudents }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const togglePaymentStatus = async () => {
    setIsUpdating(true);
    try {
      await axios.put(`${API}/students/${student.id}/payment`, !student.payment_status);
      refreshStudents();
    } catch (error) {
      console.error("Error updating payment status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleHomeworkStatus = async () => {
    setIsUpdating(true);
    try {
      await axios.put(`${API}/students/${student.id}/homework`, !student.homework_status);
      refreshStudents();
    } catch (error) {
      console.error("Error updating homework status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteStudent = async () => {
    if (window.confirm(`Are you sure you want to delete ${student.name}?`)) {
      try {
        await axios.delete(`${API}/students/${student.id}`);
        refreshStudents();
      } catch (error) {
        console.error("Error deleting student:", error);
      }
    }
  };

  return (
    <div className="student-card">
      <div>
        <h3 className="font-semibold text-lg">{student.name}</h3>
        {student.notes && <p className="text-sm text-gray-600 mt-1">{student.notes}</p>}
        {student.lesson_link && (
          <a 
            href={student.lesson_link.startsWith('http') ? student.lesson_link : `https://${student.lesson_link}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline text-sm mt-1 block"
          >
            Lesson Link
          </a>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <button 
          onClick={togglePaymentStatus}
          disabled={isUpdating}
          className={`px-3 py-1 rounded-md text-xs font-medium ${
            student.payment_status
              ? "bg-green-100 text-green-800 hover:bg-green-200"
              : "bg-red-100 text-red-800 hover:bg-red-200"
          }`}
        >
          {student.payment_status ? "Paid" : "Unpaid"}
        </button>
        <button 
          onClick={toggleHomeworkStatus}
          disabled={isUpdating}
          className={`px-3 py-1 rounded-md text-xs font-medium ${
            student.homework_status
              ? "bg-purple-100 text-purple-800 hover:bg-purple-200"
              : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
          }`}
        >
          {student.homework_status ? "HW Checked" : "HW Pending"}
        </button>
        <Link 
          to={`/students/edit/${student.id}`} 
          className="p-1 text-blue-600 hover:text-blue-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </Link>
        <button 
          onClick={deleteStudent}
          className="p-1 text-red-600 hover:text-red-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default StudentCard;
