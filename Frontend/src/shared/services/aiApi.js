import { apiRequest as request } from './httpClient';

export const aiApi = {
  analyze: (body) =>
    request('/api/ai/analyze', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getPredictions: (params = {}) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v != null && v !== '')
    ).toString();
    return request(`/api/ai/predictions?${q}`);
  },
  getPrediction: (id) => request(`/api/ai/predictions/${id}`),
  chat: (body) =>
    request('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

export default aiApi;
