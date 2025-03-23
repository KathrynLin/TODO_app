import { useState, useEffect, useContext } from "react";
import { useAuth } from "../context/AuthContext";
import { getTasks, addTask, updateTask, deleteTask, bulkDeleteTasks, toggleTaskStatus } from "../services/api";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";
import { useCallback } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import dayjs from 'dayjs';

function TaskDetailModal({ task, show, onClose, onSave, onChange }) {
  if (!task) return null;

  // 格式化日期时间为 datetime-local 格式
  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
  };

  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>📝 Edit Task</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          {/* <Form.Group className="mb-3">
            <Form.Label>Title</Form.Label>
            <Form.Control
              value={task.title}
              onChange={(e) => onChange({ ...task, title: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={task.description || ""}
              onChange={(e) => onChange({ ...task, description: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Category</Form.Label>
            <Form.Select
              value={task.category}
              onChange={(e) => onChange({ ...task, category: e.target.value })}
            >
              <option value="personal">🏠 Personal</option>
              <option value="work">💼 Work</option>
              <option value="shopping">🛒 Shopping</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Priority</Form.Label>
            <Form.Select
              value={task.priority}
              onChange={(e) => onChange({ ...task, priority: e.target.value })}
            >
              <option value="low">🟢 Low</option>
              <option value="medium">🟠 Medium</option>
              <option value="high">🔴 High</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Due Date</Form.Label>
            <Form.Control
              type="datetime-local"
              value={formatDateTime(task.dueDate)}
              onChange={(e) => onChange({ ...task, dueDate: e.target.value })}
            />
          </Form.Group>

          <Form.Check
            type="checkbox"
            label="Completed"
            checked={task.completed}
            onChange={(e) => onChange({ ...task, completed: e.target.checked })}
          /> */}
          <Form.Group className="mb-3">
            <Form.Label htmlFor="task-title">Title</Form.Label>
            <Form.Control
              id="task-title"
              value={task.title}
              onChange={(e) => onChange({ ...task, title: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label htmlFor="task-description">Description</Form.Label>
            <Form.Control
              id="task-description"
              as="textarea"
              rows={2}
              value={task.description || ""}
              onChange={(e) => onChange({ ...task, description: e.target.value })}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label htmlFor="task-category">Category</Form.Label>
            <Form.Select
              id="task-category"
              value={task.category}
              onChange={(e) => onChange({ ...task, category: e.target.value })}
            >
              <option value="personal">🏠 Personal</option>
              <option value="work">💼 Work</option>
              <option value="shopping">🛒 Shopping</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label htmlFor="task-priority">Priority</Form.Label>
            <Form.Select
              id="task-priority"
              value={task.priority}
              onChange={(e) => onChange({ ...task, priority: e.target.value })}
            >
              <option value="low">🟢 Low</option>
              <option value="medium">🟠 Medium</option>
              <option value="high">🔴 High</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label htmlFor="task-dueDate">Due Date</Form.Label>
            <Form.Control
              id="task-dueDate"
              type="datetime-local"
              value={formatDateTime(task.dueDate)}
              onChange={(e) => onChange({ ...task, dueDate: e.target.value })}
            />
          </Form.Group>

          <Form.Check
            type="checkbox"
            id="task-completed"
            label="Completed"
            checked={task.completed}
            onChange={(e) => onChange({ ...task, completed: e.target.checked })}
          />

        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={() => onSave(task)}>Save</Button>
      </Modal.Footer>
    </Modal>
  );
}

function TodoList() {
  const { token, logout } = useAuth();
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
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);


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
      
      // 始终传递 completed 参数
      queryParams.append("completed", showCompleted ? "true" : "false");
      
      queryParams.append("page", currentPage);
      queryParams.append("limit", 10);
  
      // const url = `http://localhost:5000/api/tasks?${queryParams.toString()}`;
      console.log("Fetching tasks with showCompleted =", showCompleted);
      // console.log("Request URL:", url);
  
      // const res = await axios.get(url, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      const res = await getTasks(token, queryParams.toString());

      setTasks(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } catch (error) {
      console.error(error);
      setError("Failed to load tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token, filters, sortBy, currentPage, showCompleted]);

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
  
      // 使用封装后的 addTask 方法
      await addTask(taskData, token);
  
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
  

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId, token);
      await fetchTasks();
    } catch (error) {
      setError("Failed to delete task.");
    }
  };
  const handleBulkDelete = async () => {
    if (!window.confirm("Are you sure you want to delete selected tasks?")) return;
  
    try {
      await bulkDeleteTasks(selectedTaskIds, token);
      setSelectedTaskIds([]);
      await fetchTasks();
    } catch (error) {
      console.error("Bulk delete failed:", error);
      setError("Failed to delete selected tasks. Please try again.");
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

  const handleOpenModal = (task) => {
    setSelectedTask(task);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setSelectedTask(null);
    setShowModal(false);
  };

  const formatDisplayDateTime = (dateString) => {
    if (!dateString) return "";
    return dayjs(dateString).format("YYYY-MM-DD HH:mm");
  };

  const handleToggleTask = async (task) => {
    try {
      await toggleTaskStatus(task._id, !task.completed, token);
      await fetchTasks();
    } catch (error) {
      console.error("Toggle task error:", error);
      setError("Failed to update task status. Please try again.");
    }
  };
  
  const handleSelectTask = (taskId) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };
  

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">📝 Todo Dashboard</h2>
        <div className="d-flex align-items-center gap-3">

          <Button variant="outline-info" onClick={() => navigate("/calendar")}>
            📅 Calendar View
          </Button>
          <Button
            variant={isBulkMode ? "outline-warning" : "outline-secondary"}
            onClick={() => {
              setIsBulkMode(!isBulkMode);
              setSelectedTaskIds([]); // 每次进入清空
            }}
          >
            {isBulkMode ? "Cancel Bulk Delete" : "🗑️ Bulk Delete"}
          </Button>
          <Button variant="outline-danger" onClick={logout}>
            Logout
          </Button>

        </div>
      </div>

      {/* Search & Filters */}
      <div className="row mb-3 g-2">
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="🔍 Search tasks..."
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
              setCurrentPage(1);
            }}
          >
            <option value="dueDate">Sort by Due Date</option>
            <option value="priority">Sort by Priority</option>
            <option value="createdAt">Sort by Created Time</option>
          </select>
        </div>
        <div className="col-md-2 d-flex align-items-center">
          <Form.Check
            type="switch"
            id="show-completed-switch"
            label="Show Completed"
            checked={showCompleted}
            onChange={() => {
              setShowCompleted(!showCompleted);
              setCurrentPage(1); 
            }}
          />
        </div>

      </div>

      {/* Add Task */}
      <div className="row g-2 align-items-center mb-4">
        <div className="col-md-4">
          <input
            type="text"
            className="form-control"
            placeholder="➕ New task title"
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
            type="datetime-local"
            className="form-control"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <button className="btn btn-primary w-100" onClick={handleAddTask}>
            Add Task
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && <p className="alert alert-danger">{error}</p>}

      {/* Task List */}
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
                <li key={task._id} className="list-group-item">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center mb-2">
                        <Form.Check
                          type="checkbox"
                          checked={task.completed}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleTask(task);
                          }}
                          className="me-3"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <h5 
                          className={`mb-0 ${task.completed ? 'text-decoration-line-through text-muted' : ''}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleOpenModal(task)}
                        >
                          {task.title || 'Untitled Task'}
                        </h5>
                      </div>
                      <div 
                        className="small"
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleOpenModal(task)}
                      >
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
                        {task.dueDate && (
                          <span className={`me-3 ${isOverdue ? 'text-danger' : ''}`}>
                            ⏳ {formatDisplayDateTime(task.dueDate)}
                          </span>
                        )}
                        <div className="text-muted small mt-1">
                          🕒 Created at: {formatDisplayDateTime(task.createdAt)}
                        </div>
                        {task.description && (
                          <div className="text-muted small mt-1">
                            {task.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ms-3">
                      {isBulkMode ? (
                        <Form.Check
                          type="checkbox"
                          checked={selectedTaskIds.includes(task._id)}
                          onChange={() => handleSelectTask(task._id)}
                        />
                      ) : (
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task._id);
                          }}
                        >
                          🗑
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4 gap-2 align-items-center">
              <button
                className="btn btn-outline-primary btn-sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                ◀ Previous
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
        {isBulkMode && selectedTaskIds.length > 0 && (
          <div className="fixed-bottom bg-light border-top p-3 d-flex justify-content-between align-items-center">
            <span>{selectedTaskIds.length} task(s) selected</span>
            <Button variant="danger" onClick={handleBulkDelete}>
              🔥 Confirm Delete
            </Button>
          </div>
        )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        show={showModal}
        onClose={handleCloseModal}
        onChange={setSelectedTask}
        onSave={async (updatedTask) => {
          try {
            await updateTask(updatedTask._id, updatedTask, token);
            await fetchTasks();
            handleCloseModal();
          } catch (err) {
            console.error(err);
            setError("Failed to update task. Please try again.");
          }
        }}
      />
    </div>
  );
}




export default TodoList;