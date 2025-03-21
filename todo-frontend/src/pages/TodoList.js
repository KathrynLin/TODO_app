import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { getTasks, addTask, updateTask, deleteTask } from "../services/api";
import { useNavigate } from "react-router-dom";

function TodoList() {
  const { token, logout } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchTasks();
  }, [token]);

  const fetchTasks = async () => {
    try {
      const res = await getTasks(token);
      setTasks(res.data);
    } catch (error) {
      console.error("获取任务失败", error);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    try {
      const res = await addTask({ title: newTask }, token);
      setTasks([...tasks, res.data]);
      setNewTask("");
    } catch (error) {
      console.error("添加任务失败", error);
    }
  };

  const handleToggleTask = async (task) => {
    try {
      const res = await updateTask(task._id, { completed: !task.completed }, token);
      setTasks(tasks.map(t => (t._id === task._id ? res.data : t)));
    } catch (error) {
      console.error("更新任务失败", error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId, token);
      setTasks(tasks.filter(t => t._id !== taskId));
    } catch (error) {
      console.error("删除任务失败", error);
    }
  };

  return (
    <div>
      <h2>待办事项</h2>
      <button onClick={logout}>退出登录</button>
      <div>
        <input 
          type="text" 
          placeholder="添加新任务" 
          value={newTask} 
          onChange={(e) => setNewTask(e.target.value)}
        />
        <button onClick={handleAddTask}>添加</button>
      </div>
      <ul>
        {tasks.map(task => (
          <li key={task._id}>
            <span 
              onClick={() => handleToggleTask(task)}
              style={{ textDecoration: task.completed ? "line-through" : "none", cursor: "pointer" }}
            >
              {task.title}
            </span>
            <button onClick={() => handleDeleteTask(task._id)}>删除</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TodoList;
