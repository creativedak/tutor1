import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recentTutors, setRecentTutors] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsResponse, tutorsResponse] = await Promise.all([
          axios.get(`${API}/admin/stats`),
          axios.get(`${API}/admin/tutors`)
        ]);
        
        setStats(statsResponse.data);
        
        // Sort tutors by creation date (newest first) and take only the 5 most recent
        const sortedTutors = tutorsResponse.data.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        ).slice(0, 5);
        
        setRecentTutors(sortedTutors);
        setError("");
      } catch (error) {
        console.error("Error fetching admin data:", error);
        setError("Failed to load admin data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Prepare chart data
  const prepareChartData = () => {
    if (!stats || !stats.lessons_by_month) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Get the last 6 months
    const months = Object.keys(stats.lessons_by_month).sort().slice(-6);
    const lessonCounts = months.map(month => stats.lessons_by_month[month] || 0);

    // Convert month keys (YYYY-MM) to readable month names
    const monthNames = months.map(monthKey => {
      const [year, month] = monthKey.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleString('default', { month: 'short', year: '2-digit' });
    });

    return {
      labels: monthNames,
      datasets: [
        {
          label: 'Number of Lessons',
          data: lessonCounts,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgb(54, 162, 235)',
          borderWidth: 1
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Lessons by Month'
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-80px)]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <div className="flex space-x-2">
          <Link to="/admin/tutors" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
            Manage Tutors
          </Link>
          <Link to="/admin/students" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            View All Students
          </Link>
          <Link to="/admin/lessons" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            View All Lessons
          </Link>
        </div>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}

      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <div className="text-3xl font-bold">{stats.tutor_count}</div>
              <div className="text-sm opacity-80">Total Tutors</div>
            </div>
            <div className="card bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <div className="text-3xl font-bold">{stats.student_count}</div>
              <div className="text-sm opacity-80">Total Students</div>
            </div>
            <div className="card bg-gradient-to-r from-green-500 to-green-600 text-white">
              <div className="text-3xl font-bold">{stats.lesson_count}</div>
              <div className="text-sm opacity-80">Total Lessons</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 card">
              <h2 className="card-title mb-4">Lessons Overview</h2>
              <div className="h-64">
                <Bar data={prepareChartData()} options={chartOptions} />
              </div>
            </div>

            <div className="lg:col-span-2 card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title">Recent Tutors</h2>
                <Link to="/admin/tutors" className="text-blue-600 text-sm hover:underline">View All</Link>
              </div>
              
              {recentTutors.length > 0 ? (
                <div className="space-y-3">
                  {recentTutors.map(tutor => (
                    <div key={tutor.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{tutor.name}</span>
                        {tutor.is_admin && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">Admin</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">{tutor.email}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Joined: {new Date(tutor.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No tutors found.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminDashboard;