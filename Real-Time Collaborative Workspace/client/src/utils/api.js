import axios from "axios";

// Automatically uses live Render backend in production, or localhost in development
const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://nexvia-fullstack-internship.onrender.com/api"
    : "http://localhost:5001/api");

const API = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

export default API;
