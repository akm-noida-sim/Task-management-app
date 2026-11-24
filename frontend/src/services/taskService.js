import api from './api';

export const taskService = {
  async list(params = {}) {
    const { data } = await api.get('/tasks', { params });
    return { tasks: data.data.tasks, meta: data.meta };
  },
  async get(id) {
    const { data } = await api.get(`/tasks/${id}`);
    return data.data.task;
  },
  async create(payload) {
    const { data } = await api.post('/tasks', payload);
    return data.data.task;
  },
  async update(id, payload) {
    const { data } = await api.put(`/tasks/${id}`, payload);
    return data.data.task;
  },
  async updateStatus(id, status) {
    const { data } = await api.patch(`/tasks/${id}/status`, { status });
    return data.data.task;
  },
  async remove(id) {
    await api.delete(`/tasks/${id}`);
  },
};
