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

export const getAllManhwa = async () => {
  const res = await API.get('/all-manhwa');
  return res.data;
}

export const getTopAllManhwa = async () => {
    const res = await API.get('/top-all');
    return res.data;
}

export const getSuggestions = async (query) => {
    const res = await API.get(`/mangadex-suggestions?title=${encodeURIComponent(query)}`);
    return res.data.suggestions;
}

export const getTitleRecommendations = async (title, summary) => {
    const res = await API.post('/recommend-title', { title, summary });
    return res.data;
}

export const searchManhwa = async (query) => {
    const res = await API.get(`/mangadex-search?title=${encodeURIComponent(query)}`);
    return res.data;
}
