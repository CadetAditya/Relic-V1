import axios from 'axios';

const API_BASE = '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Authentication
  login: async (badge_id, password) => {
    const res = await apiClient.post('/auth/login', { badge_id, password });
    return res.data;
  },

  // Predictions
  predict: async (data) => {
    const res = await apiClient.post('/predict', data);
    return res.data;
  },

  getSamplePrediction: async (complaintId = 'COMP000009') => {
    const res = await apiClient.get('/predict/sample', {
      params: { complaint_id: complaintId },
    });
    return res.data;
  },

  // Complaints
  getComplaints: async (params = {}) => {
    const res = await apiClient.get('/complaints', { params });
    return res.data;
  },

  getComplaintById: async (id) => {
    const res = await apiClient.get(`/complaints/${id}`);
    return res.data;
  },

  createComplaint: async (data) => {
    const res = await apiClient.post('/complaints', data);
    return res.data;
  },

  // Accounts
  getAccounts: async (params = {}) => {
    const res = await apiClient.get('/accounts', { params });
    return res.data;
  },

  getAccountDetail: async (id) => {
    const res = await apiClient.get(`/accounts/${id}`);
    return res.data;
  },

  // ATMs
  getAtms: async (params = {}) => {
    const res = await apiClient.get('/atms', { params });
    return res.data;
  },

  // Dashboard Stats
  getStats: async () => {
    const res = await apiClient.get('/stats');
    return res.data;
  },
};

export default api;
