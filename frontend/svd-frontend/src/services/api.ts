import axios, { Axios } from "axios";

const baseURL: string = "http://127.0.0.1:8000";

const api: Axios = axios.create({
    baseURL,
    timeout: 60000,
    headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
    }
});

export default api;