import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // lấy từ .env
  withCredentials: true, // gửi cookie/session
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
