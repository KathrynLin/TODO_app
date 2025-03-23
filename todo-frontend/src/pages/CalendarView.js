import React, { useState, useEffect, useCallback } from "react";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import { getTasks } from "../services/api";

function CalendarView() {
  const { token, logout } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [taskDates, setTaskDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchMonthlyTaskDates = useCallback(async (date) => {
    const start = dayjs(date).startOf("month").toISOString();
    const end = dayjs(date).endOf("month").toISOString();

    try {
      const res = await getTasks(token, {
        dueDate_gte: start,
        dueDate_lte: end,
        limit: 1000
      });

      const dates = res.data.data.map(task => dayjs(task.dueDate).format("YYYY-MM-DD"));
      setTaskDates(dates);
    } catch (err) {
      console.error("Failed to fetch monthly tasks:", err);
    }
  }, [token]);

  const fetchTasksForDate = useCallback(async (date) => {
    setLoading(true);
    setError("");
    const start = dayjs(date).startOf("day").toISOString();
    const end = dayjs(date).endOf("day").toISOString();

    try {
      // const res = await axios.get("http://localhost:5000/api/tasks", {
      //   headers: { Authorization: `Bearer ${token}` },
      //   params: {
      //     dueDate_gte: start,
      //     dueDate_lte: end,
      //     limit: 100
      //   }
      // });
      const res = await getTasks(token, {
        dueDate_gte: start,
        dueDate_lte: end,
        limit: 100
      });
      setTasks(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      setError("Failed to load tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchTasksForDate(selectedDate);
    fetchMonthlyTaskDates(selectedDate);
  }, [token, selectedDate, navigate, fetchTasksForDate, fetchMonthlyTaskDates]);

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>📅 Calendar View</h2>
        <div className="d-flex gap-2">
          <Button variant="outline-info" onClick={() => navigate("/todo")}>
            📝 List View
          </Button>
          <Button variant="outline-danger" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>

      <div className="row">
        <div className="col-md-4">
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            className="w-100"
            onActiveStartDateChange={({ activeStartDate }) => {
              fetchMonthlyTaskDates(activeStartDate);
            }}
            tileClassName={({ date }) => {
              const formatted = dayjs(date).format("YYYY-MM-DD");
              return taskDates.includes(formatted) ? 'has-tasks' : '';
            }}
          />
        </div>
        <div className="col-md-8">
          <h4 className="mb-3">
            Tasks for {dayjs(selectedDate).format("MMMM D, YYYY")}
          </h4>
          {loading ? (
            <p>Loading tasks...</p>
          ) : error ? (
            <p className="text-danger">{error}</p>
          ) : tasks.length === 0 ? (
            <p className="text-muted">No tasks scheduled for this day</p>
          ) : (
            <div className="list-group">
              {tasks.map((task) => (
                <div className="list-group-item" key={task._id}>
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h5 className={`mb-1 ${task.completed ? 'text-decoration-line-through text-muted' : ''}`}>
                        {task.title}
                      </h5>
                      {task.description && (
                        <p className="text-muted small mb-1">{task.description}</p>
                      )}
                      <div className="small">
                        <span className="me-3">
                          🗂 <strong>{task.category || 'Uncategorized'}</strong>
                        </span>
                        <span className="me-3">
                          ⚡ <strong className={
                            task.priority === 'high' ? 'text-danger' :
                            task.priority === 'medium' ? 'text-warning' :
                            'text-success'
                          }>{task.priority || 'medium'}</strong>
                        </span>
                        <span>
                          🕒 {dayjs(task.dueDate).format("HH:mm")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CalendarView; 