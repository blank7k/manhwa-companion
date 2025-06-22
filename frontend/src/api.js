import axios from 'axios';

const API_BASE_URL = "https://manhwa-companion.onrender.com";

const API = axios.create({
  baseURL: API_BASE_URL,
});

export const getRecommendations = async (moods) => {
  const res = await API.post('/recommend', { moods });
  return res.data.recommendations;
};

export const summarizeManhwa = async (title, summary) => {
  const res = await API.post('/summarize', { title, summary });
  return res.data;
};
