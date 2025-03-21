import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { getTasks, addTask, updateTask, deleteTask } from "../services/api";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { useCallback } from "react";

function TodoList() {
  const { token, logout } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [newCategory, setNewCategory] = useState("personal");
  const [newPriority, setNewPriority] = useState("medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    category: 'all',
    priority: 'all',
    search: ''
  });
  const [sortBy, setSortBy] = useState('dueDate');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageInput, setPageInput] = useState("");

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // 重置页码
  };

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError("");
  
    try {
      const queryParams = new URLSearchParams();
  
      if (filters.category !== "all") queryParams.append("category", filters.category);
      if (filters.priority !== "all") queryParams.append("priority", filters.priority);
      if (filters.search.trim() !== "") queryParams.append("search", filters.search.trim());
      if (sortBy) queryParams.append("sortBy", sortBy);
      queryParams.append("page", currentPage);
      queryParams.append("limit", 10);
  
      const url = `http://localhost:5000/api/tasks?${queryParams.toString()}`;
  
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      setTasks(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } catch (error) {
      console.error(error);
      setError("Failed to load tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token, filters, sortBy, currentPage]);

  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token, filters, sortBy, currentPage, fetchTasks]);
  
  

  const handleAddTask = async () => {
    if (!newTask.trim()) {
      setError("Task title cannot be empty.");
      return;
    }
  
    try {
      const taskData = {
        title: newTask,
        category: newCategory,
        priority: newPriority,
      };

      if (newDueDate) {
        taskData.dueDate = newDueDate;
      }

      await axios.post("http://localhost:5000/api/tasks", taskData, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      await fetchTasks();
      setNewTask("");
      setNewCategory("personal");
      setNewPriority("medium");
      setNewDueDate("");
      setError("");
    } catch (error) {
      console.error(error);
      setError("Failed to add task. Please try again.");
    }
  };

  const handleToggleTask = async (task) => {
    try {
      const res = await updateTask(task._id, { completed: !task.completed }, token);
      setTasks(tasks.map(t => (t._id === task._id ? res.data : t)));
    } catch (error) {
      setError("Failed to update task.");
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId, token);
      setTasks(tasks.filter(t => t._id !== taskId));
    } catch (error) {
      setError("Failed to delete task.");
    }
  };

  const handlePageChange = (e) => {
    const value = e.target.value;
    setPageInput(value);
  };

  const handlePageSubmit = (e) => {
    e.preventDefault();
    const page = parseInt(pageInput);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setPageInput("");
    }
  };

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">📝 Todo Dashboard</h2>
        <button 
          className="btn btn-outline-danger" 
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          Logout
        </button>
      </div>

      {/* 搜索 & 筛选 */}
      <div className="row mb-3 g-2">
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="🔍 Search task title or description"
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <select
            className="form-select"
            value={filters.category}
            onChange={(e) => handleFilterChange("category", e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="work">💼 Work</option>
            <option value="personal">🏠 Personal</option>
            <option value="shopping">🛒 Shopping</option>
          </select>
        </div>
        <div className="col-md-2">
          <select
            className="form-select"
            value={filters.priority}
            onChange={(e) => handleFilterChange("priority", e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="high">🔴 High</option>
            <option value="medium">🟠 Medium</option>
            <option value="low">🟢 Low</option>
          </select>
        </div>
        <div className="col-md-2">
          <select
            className="form-select"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1); // 重置页码
            }}
          >
            <option value="dueDate">Sort by Due Date</option>
            <option value="priority">Sort by Priority</option>
            <option value="createdAt">Sort by Created Time</option>
          </select>
        </div>
        <div className="col-md-2">
          <button className="btn btn-secondary w-100" onClick={fetchTasks}>🔁 Refresh</button>
        </div>
      </div>

      {/* 添加任务 */}
      <div className="row g-2 align-items-center mb-4">
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="➕ Task title"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
          />
        </div>
        <div className="col-md-2">
          <select
            className="form-select"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          >
            <option value="personal">🏠 Personal</option>
            <option value="work">💼 Work</option>
            <option value="shopping">🛒 Shopping</option>
          </select>
        </div>
        <div className="col-md-2">
          <select
            className="form-select"
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value)}
          >
            <option value="low">🟢 Low</option>
            <option value="medium">🟠 Medium</option>
            <option value="high">🔴 High</option>
          </select>
        </div>
        <div className="col-md-2">
          <input
            type="date"
            className="form-control"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <button className="btn btn-primary w-100" onClick={handleAddTask}>Add</button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && <p className="alert alert-danger">{error}</p>}

      {/* 任务列表 */}
      {loading ? (
        <p>Loading...</p>
      ) : tasks.length === 0 ? (
        <p className="text-muted">No tasks found</p>
      ) : (
        <>
          <ul className="list-group">
            {tasks.map(task => {
              const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date();
              return (
                <li key={task._id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <h5
                      className={`mb-1 ${task.completed ? 'text-decoration-line-through text-muted' : ''}`}
                      onClick={() => handleToggleTask(task)}
                      style={{ cursor: 'pointer' }}
                    >
                      {task.title}
                    </h5>
                    <div className="small">
                      <span className="me-3">
                        🗂 <strong>{task.category}</strong>
                      </span>
                      <span className="me-3">
                        ⚡ <strong className={
                          task.priority === 'high' ? 'text-danger' :
                          task.priority === 'medium' ? 'text-warning' :
                          'text-success'
                        }>{task.priority}</strong>
                      </span>
                      {task.dueDate && (
                        <span className={`me-3 ${isOverdue ? 'text-danger' : ''}`}>
                          ⏳ {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <button className="btn btn-outline-danger btn-sm" onClick={() => handleDeleteTask(task._id)}>🗑</button>
                </li>
              );
            })}
          </ul>

          {/* 分页控件 */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4 gap-2 align-items-center">
              <button
                className="btn btn-outline-primary btn-sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                ◀ Prev
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <form onSubmit={handlePageSubmit} className="d-flex align-items-center gap-1">
                <input
                  type="number"
                  className="form-control form-control-sm"
                  style={{ width: "60px" }}
                  min="1"
                  max={totalPages}
                  value={pageInput}
                  onChange={handlePageChange}
                  placeholder="Go to"
                />
              </form>
              <button
                className="btn btn-outline-primary btn-sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                Next ▶
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default TodoList;