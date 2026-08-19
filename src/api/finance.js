import { API } from './index';

export const FinanceAPI = {
  list: async (page = 1, limit = 20) => {
    return await API.get(`/finance?page=${page}&limit=${limit}`);
  },

  create: async (data) => {
    return await API.post('/finance', data);
  },

  update: async (id, data) => {
    return await API.put(`/finance/${id}`, data);
  },

  delete: async (id) => {
    return await API.delete(`/finance/${id}`);
  },

  getStats: async () => {
    return await API.get('/finance/stats');
  }
};

export default FinanceAPI;