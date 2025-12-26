import axios from 'axios';
import { auth } from '../config/firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// Create axios instance with timeout and retry configuration
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 second timeout
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper function to check if error is retryable
const isRetryableError = (error) => {
    // Retry on network errors or 5xx server errors
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
};

// Helper function to delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Request interceptor to add auth token
api.interceptors.request.use(
    async (config) => {
        const user = auth.currentUser;
        if (user) {
            try {
                const token = await user.getIdToken();
                config.headers.Authorization = `Bearer ${token}`;
            } catch (error) {
                console.error('Failed to get auth token:', error);
            }
        }

        // Initialize retry count
        config.__retryCount = config.__retryCount || 0;

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling and retries
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;

        // Handle network errors (backend not running)
        if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
            console.error('Network error - backend may not be running');

            // Retry if we haven't exceeded max retries
            if (config && config.__retryCount < MAX_RETRIES) {
                config.__retryCount += 1;
                console.log(`Retrying request... (${config.__retryCount}/${MAX_RETRIES})`);
                await delay(RETRY_DELAY * config.__retryCount);
                return api.request(config);
            }

            // Create a more informative error
            error.message = 'Unable to connect to server. Please ensure the backend is running.';
            return Promise.reject(error);
        }

        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
            const user = auth.currentUser;
            if (user) {
                try {
                    // Force refresh the token
                    const token = await user.getIdToken(true);
                    error.config.headers.Authorization = `Bearer ${token}`;
                    return api.request(error.config);
                } catch (refreshError) {
                    // Refresh failed, logout user
                    console.error('Token refresh failed, logging out');
                    await auth.signOut();
                    window.location.href = '/login';
                }
            }
        }

        // Handle 5xx errors with retry
        if (isRetryableError(error) && config && config.__retryCount < MAX_RETRIES) {
            config.__retryCount += 1;
            console.log(`Server error, retrying... (${config.__retryCount}/${MAX_RETRIES})`);
            await delay(RETRY_DELAY * config.__retryCount);
            return api.request(config);
        }

        // Provide clear error messages for common errors
        if (error.response) {
            switch (error.response.status) {
                case 400:
                    error.message = error.response.data?.message || 'Invalid request';
                    break;
                case 403:
                    error.message = 'Access denied. Please check your permissions.';
                    break;
                case 404:
                    error.message = 'Resource not found';
                    break;
                case 413:
                    error.message = 'File too large';
                    break;
                case 500:
                    error.message = 'Server error. Please try again later.';
                    break;
                default:
                    error.message = error.response.data?.message || 'An error occurred';
            }
        }

        return Promise.reject(error);
    }
);

export default api;
