import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const register = (userData) => axios.post(`${API_BASE_URL}/auth/register`, userData);
export const login = (userData) => axios.post(`${API_BASE_URL}/auth/login`, userData);
export const getTasks = (token) => axios.get(`${API_BASE_URL}/tasks`, { headers: { Authorization: `Bearer ${token}` } });
export const addTask = (task, token) => axios.post(`${API_BASE_URL}/tasks`, task, { headers: { Authorization: `Bearer ${token}` } });
export const updateTask = (id, task, token) => axios.put(`${API_BASE_URL}/tasks/${id}`, task, { headers: { Authorization: `Bearer ${token}` } });
export const deleteTask = (id, token) => axios.delete(`${API_BASE_URL}/tasks/${id}`, { headers: { Authorization: `Bearer ${token}` } });
