import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL;
console.log("✅ API_BASE_URL:", API_BASE_URL);


export const register = (userData) => axios.post(`${API_BASE_URL}/auth/register`, userData);
export const login = (userData) => axios.post(`${API_BASE_URL}/auth/login`, userData);

export const getTasks = (token, queryParams = "") =>
    axios.get(`${API_BASE_URL}/tasks${queryParams ? `?${queryParams}` : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
export const addTask = (task, token) => axios.post(`${API_BASE_URL}/tasks`, task, { headers: { Authorization: `Bearer ${token}` } });
export const updateTask = (id, task, token) => axios.put(`${API_BASE_URL}/tasks/${id}`, task, { headers: { Authorization: `Bearer ${token}` } });
export const deleteTask = (id, token) => axios.delete(`${API_BASE_URL}/tasks/${id}`, { headers: { Authorization: `Bearer ${token}` } });
export const bulkDeleteTasks = (taskIds, token) =>
    axios.delete(`${API_BASE_URL}/tasks/bulk/delete`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { taskIds },
    }); 
export const toggleTaskStatus = (id, completed, token) =>
    axios.patch(`${API_BASE_URL}/tasks/${id}/status`, { completed }, {
        headers: { Authorization: `Bearer ${token}` }
    });  
export const getTaskStats = (token) =>
    axios.get(`${API_BASE_URL}/tasks/stats`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    