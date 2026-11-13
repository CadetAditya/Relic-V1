import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // 1. Authentication & RBAC
  login: async (badge_id, password) => {
    const res = await apiClient.post('/auth/login', { badge_id, password });
    return res.data;
  },

  // 12. Officer Management & Audit Logs
  getOfficers: async (params = {}) => {
    const res = await apiClient.get('/officers', { params });
    return res.data;
  },

  createOfficer: async (data) => {
    const res = await apiClient.post('/officers', data);
    return res.data;
  },

  updateOfficer: async (badge_id, data) => {
    const res = await apiClient.put(`/officers/${badge_id}`, data);
    return res.data;
  },

  getAuditLogs: async (params = {}) => {
    const res = await apiClient.get('/officers/audit/logs', { params });
    return res.data;
  },

  // 3 & 4. Complaints & Investigation Management
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

  updateComplaintStatus: async (id, data) => {
    const res = await apiClient.patch(`/complaints/${id}`, data);
    return res.data;
  },

  assignInvestigator: async (id, data) => {
    const res = await apiClient.post(`/complaints/${id}/assign`, data);
    return res.data;
  },

  getComplaintNotes: async (id) => {
    const res = await apiClient.get(`/complaints/${id}/notes`);
    return res.data;
  },

  addComplaintNote: async (id, data) => {
    const res = await apiClient.post(`/complaints/${id}/notes`, data);
    return res.data;
  },

  // 8. Evidence & CCTV References
  getComplaintEvidence: async (id) => {
    const res = await apiClient.get(`/complaints/${id}/evidence`);
    return res.data;
  },

  attachEvidence: async (id, data) => {
    const res = await apiClient.post(`/complaints/${id}/evidence`, data);
    return res.data;
  },

  updateEvidenceStatus: async (evidenceId, data) => {
    const res = await apiClient.patch(`/complaints/evidence/${evidenceId}`, data);
    return res.data;
  },

  // 5. AI Predictions & History
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

  getPredictionHistory: async (params = {}) => {
    const res = await apiClient.get('/predict/history', { params });
    return res.data;
  },

  // 7. Accounts & Network Transaction Flow
  getAccounts: async (params = {}) => {
    const res = await apiClient.get('/accounts', { params });
    return res.data;
  },

  getAccountDetail: async (id) => {
    const res = await apiClient.get(`/accounts/${id}`);
    return res.data;
  },

  getAccountNetwork: async (accountId) => {
    const res = await apiClient.get(`/accounts/${accountId}/network`);
    return res.data;
  },

  // 6. ATMs
  getAtms: async (params = {}) => {
    const res = await apiClient.get('/atms', { params });
    return res.data;
  },

  // 9. Alerts & Notifications
  getAlerts: async (params = {}) => {
    const res = await apiClient.get('/alerts', { params });
    return res.data;
  },

  markAlertRead: async (alertId) => {
    const res = await apiClient.patch(`/alerts/${alertId}/read`);
    return res.data;
  },

  createAlert: async (data) => {
    const res = await apiClient.post('/alerts', data);
    return res.data;
  },

  // 2 & 11. Role-Based Dashboard Stats & Regional Monitoring
  getStats: async (params = {}) => {
    const res = await apiClient.get('/stats', { params });
    return res.data;
  },

  getRegionalMonitoring: async (zoneName) => {
    const res = await apiClient.get(`/stats/regional/${zoneName}`);
    return res.data;
  },
};

export default api;
