import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function Navbar({ user, setIsLoggedIn, setUser }) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setUser(null);
    navigate("/login");
  };

  const isAdmin = user?.is_admin;

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-10">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-blue-600">
              Tutor Dashboard
            </Link>
          </div>

          <div className="hidden md:flex space-x-4">
            {/* Regular tutor links */}
            <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100">
              Dashboard
            </Link>
            <Link to="/students" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100">
              Students
            </Link>
            <Link to="/schedule" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100">
              Schedule
            </Link>

            {/* Admin links */}
            {isAdmin && (
              <>
                <div className="border-l border-gray-300 h-6 my-auto mx-2"></div>
                <Link to="/admin" className="px-3 py-2 rounded-md text-sm font-medium text-purple-700 hover:text-purple-600 hover:bg-purple-100">
                  Admin Dashboard
                </Link>
                <Link to="/admin/tutors" className="px-3 py-2 rounded-md text-sm font-medium text-purple-700 hover:text-purple-600 hover:bg-purple-100">
                  Manage Tutors
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center">
            {/* User info with dropdown for mobile */}
            <div className="mr-4 text-sm text-gray-700">
              <span className="hidden md:inline">Welcome, </span>
              <span className="font-semibold">{user?.name}</span>
              {isAdmin && <span className="ml-1 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">Admin</span>}
            </div>
            
            <button 
              onClick={handleLogout}
              className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-500 hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100">
            Dashboard
          </Link>
          <Link to="/students" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100">
            Students
          </Link>
          <Link to="/schedule" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100">
            Schedule
          </Link>
          
          {isAdmin && (
            <>
              <div className="border-t border-gray-300 my-2"></div>
              <Link to="/admin" className="block px-3 py-2 rounded-md text-base font-medium text-purple-700 hover:text-purple-600 hover:bg-purple-100">
                Admin Dashboard
              </Link>
              <Link to="/admin/tutors" className="block px-3 py-2 rounded-md text-base font-medium text-purple-700 hover:text-purple-600 hover:bg-purple-100">
                Manage Tutors
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
