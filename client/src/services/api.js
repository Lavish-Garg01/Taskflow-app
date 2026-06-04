import axios from 'axios';

const API = axios.create({
  baseURL: 'https://taskflow-app-8x79.onrender.com/api'
});

// Har request mein token automatically add ho
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export const registerUser  = (data) => API.post('/auth/register', data);
export const loginUser     = (data) => API.post('/auth/login', data);
export const getMe         = ()     => API.get('/auth/me');

export const getProjects   = ()     => API.get('/projects');
export const createProject = (data) => API.post('/projects', data);
export const getProject    = (id)   => API.get(`/projects/${id}`);
export const updateProject = (id, data) => API.put(`/projects/${id}`, data);
export const deleteProject = (id)   => API.delete(`/projects/${id}`);

export const getTasksByProject = (projectId) => API.get(`/tasks/project/${projectId}`);
export const createTask    = (data) => API.post('/tasks', data);
export const updateTask    = (id, data) => API.put(`/tasks/${id}`, data);
export const deleteTask    = (id)   => API.delete(`/tasks/${id}`);
export const getMyTasks    = ()     => API.get('/tasks/my');

export default API;