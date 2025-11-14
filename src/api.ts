import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Next.js automatically makes NEXT_PUBLIC_* env vars available
const API_URL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Projects API
export const projectsAPI = {
  getAll: () => api.get('/projects'),
  getById: (id: string) => api.get(`/projects/${id}`),
  create: (data: { name: string; description?: string; color?: string }) =>
    api.post('/projects', data),
  update: (id: string, data: { name?: string; description?: string; color?: string }) =>
    api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  addMember: (id: string, userId: string) =>
    api.post(`/projects/${id}/members`, { userId }),
  removeMember: (id: string, userId: string) =>
    api.delete(`/projects/${id}/members/${userId}`),
};

// Tasks API
export const tasksAPI = {
  getAll: (params?: { projectId?: string; assignee?: string; status?: string; search?: string; dueDate?: string }) =>
    api.get('/tasks', { params }),
  getById: (id: string) => api.get(`/tasks/${id}`),
  create: (data: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    dueDate?: string;
    projectId: string;
    assignee?: string;
  }) => api.post('/tasks', data),
  update: (id: string, data: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    dueDate?: string;
    assignee?: string;
    position?: number;
  }) => api.put(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  uploadAttachment: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/tasks/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteAttachment: (id: string, attachmentId: string) =>
    api.delete(`/tasks/${id}/attachments/${attachmentId}`),
};

// Comments API
export const commentsAPI = {
  getByTask: (taskId: string) => api.get(`/comments/task/${taskId}`),
  create: (data: { content: string; taskId: string }) =>
    api.post('/comments', data),
  update: (id: string, data: { content: string }) =>
    api.put(`/comments/${id}`, data),
  delete: (id: string) => api.delete(`/comments/${id}`),
};

// Users API
export const usersAPI = {
  getAll: (search?: string) => api.get('/users', { params: { search } }),
  getById: (id: string) => api.get(`/users/${id}`),
};

// Activities API
export const activitiesAPI = {
  getByProject: (projectId: string) =>
    api.get(`/activities/project/${projectId}`),
};

export default api;

