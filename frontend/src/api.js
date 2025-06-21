import axios from 'axios';

const API = axios.create({
  baseURL: 'http://127.0.0.1:8000',
});

export const getRecommendations = async (moods) => {
  const res = await API.post('/recommend', { moods });
  return res.data.recommendations;
};

export const summarizeManhwa = async (title, summary) => {
  const res = await API.post('/summarize', { title, summary });
  return res.data;
};
