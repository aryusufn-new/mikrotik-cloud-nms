import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getDashboardSummary = () => api.get('/dashboard/summary');
export const getDevices = (params) => api.get('/devices', { params });
export const getDevice = (id) => api.get(`/devices/${id}`);
export const createDevice = (data) => api.post('/devices', data);
export const updateDevice = (id, data) => api.put(`/devices/${id}`, data);
export const deleteDevice = (id) => api.delete(`/devices/${id}`);
export const testDeviceConnection = (id) => api.post(`/devices/${id}/test-connection`);

export const getGroups = () => api.get('/groups');
export const createGroup = (data) => api.post('/groups', data);

export const getTopology = () => api.get('/topology');
export const saveTopology = (data) => api.post('/topology/save', data);

export const getConnectionHistory = (params) => api.get('/history', { params });

export const getRemoteSession = (deviceId, service) => api.get(`/remote/${deviceId}/session`, { params: { service } });
export const terminateRemoteSession = (sessionId) => api.post(`/remote/session/${sessionId}/terminate`);
export const getRemoteActivities = (deviceId) => api.get(`/remote/${deviceId}/activities`);

export default api;

