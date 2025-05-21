import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Calendar({ lessons, students, refreshData }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [studentMap, setStudentMap] = useState({});

  useEffect(() => {
    // Create a map of student IDs to names
    const map = {};
    students.forEach(student => {
      map[student.id] = student;
    });
    setStudentMap(map);
  }, [students]);

  useEffect(() => {
    generateCalendarDays();
  }, [currentDate, lessons]);

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Get number of days in the month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get some days from previous month to fill the calendar
    const daysFromPrevMonth = firstDayOfWeek;
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    const calendarDays = [];
    
    // Add days from previous month
    for (let i = 0; i < daysFromPrevMonth; i++) {
      const dayNumber = prevMonthLastDay - daysFromPrevMonth + i + 1;
      const date = new Date(year, month - 1, dayNumber);
      calendarDays.push({
        date,
        dayNumber,
        currentMonth: false,
        lessons: getLessonsForDate(date)
      });
    }
    
    // Add days from current month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      calendarDays.push({
        date,
        dayNumber: i,
        currentMonth: true,
        isToday: isToday(date),
        lessons: getLessonsForDate(date)
      });
    }
    
    // Add days from next month to make sure we have complete weeks
    const totalDaysSoFar = calendarDays.length;
    const daysNeeded = Math.ceil(totalDaysSoFar / 7) * 7 - totalDaysSoFar;
    
    for (let i = 1; i <= daysNeeded; i++) {
      const date = new Date(year, month + 1, i);
      calendarDays.push({
        date,
        dayNumber: i,
        currentMonth: false,
        lessons: getLessonsForDate(date)
      });
    }
    
    setCalendarDays(calendarDays);
  };

  const getLessonsForDate = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    return lessons.filter(lesson => {
      const lessonDate = new Date(lesson.start_time);
      return (
        lessonDate.getFullYear() === year &&
        lessonDate.getMonth() === month &&
        lessonDate.getDate() === day
      );
    });
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const formatLessonTime = (datetime) => {
    const date = new Date(datetime);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleDeleteLesson = async (lessonId) => {
    if (window.confirm("Are you sure you want to delete this lesson?")) {
      try {
        await axios.delete(`${API}/lessons/${lessonId}`);
        refreshData();
      } catch (error) {
        console.error("Error deleting lesson:", error);
      }
    }
  };

  const getDayClasses = (day) => {
    let classes = "calendar-day ";
    
    if (day.currentMonth) {
      classes += "bg-white ";
    } else {
      classes += "other-month ";
    }
    
    if (day.isToday) {
      classes += "current-day ";
    }
    
    return classes;
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button onClick={goToPreviousMonth} className="p-2 bg-gray-200 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <h2 className="text-xl font-semibold">{months[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
        <button onClick={goToNextMonth} className="p-2 bg-gray-200 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
          <div key={index} className="text-center py-2 font-semibold text-gray-600">
            {day}
          </div>
        ))}
      </div>
      
      <div className="calendar-grid">
        {calendarDays.map((day, index) => (
          <div key={index} className={getDayClasses(day)}>
            <div className="day-number">{day.dayNumber}</div>
            <div className="mt-4">
              {day.lessons.map((lesson) => (
                <div key={lesson.id} className="calendar-event bg-blue-100 text-blue-800 border border-blue-300">
                  <div className="flex justify-between items-center">
                    <span>{formatLessonTime(lesson.start_time)}</span>
                    <div className="flex">
                      <Link to={`/lessons/edit/${lesson.id}`} className="mr-1 text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </Link>
                      <button onClick={() => handleDeleteLesson(lesson.id)} className="text-red-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="text-xs font-semibold truncate">
                    {studentMap[lesson.student_id] ? studentMap[lesson.student_id].name : 'Unknown student'}
                  </div>
                  <div className="text-xs truncate">{lesson.subject}</div>
                </div>
              ))}
              {day.currentMonth && (
                <Link 
                  to="/lessons/new" 
                  state={{ date: day.date }}
                  className="text-xs text-blue-600 hover:underline mt-1 block"
                >
                  + Add Lesson
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Calendar;
