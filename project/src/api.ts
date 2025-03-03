import axios from 'axios';
import { Job, Site } from './types';

const API_URL = 'http://localhost:3001/api';

// Configure axios with timeout and retry logic
const api = axios.create({
  baseURL: API_URL,
  timeout: 5000, // 5 second timeout
});

// Add retry interceptor
let retryCount = 0;
const MAX_RETRIES = 2;

api.interceptors.response.use(undefined, async (error) => {
  const config = error.config;
  
  // Only retry on network errors or 5xx server errors, not on 4xx client errors
  if (
    (error.message === 'Network Error' || (error.response && error.response.status >= 500)) && 
    retryCount < MAX_RETRIES
  ) {
    retryCount++;
    // Exponential backoff: wait longer between each retry
    const delay = retryCount * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    return api(config);
  }
  
  retryCount = 0;
  return Promise.reject(error);
});

export const fetchJobs = async (): Promise<Job[]> => {
  try {
    const response = await api.get('/jobs');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching jobs:', error.message || 'Server connection failed');
    return [];
  }
};

export const fetchSites = async (): Promise<Site[]> => {
  try {
    const response = await api.get('/sites');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching sites:', error.message || 'Server connection failed');
    return [];
  }
};

export const addSite = async (site: Site): Promise<Site | null> => {
  try {
    const response = await api.post('/sites', site);
    return response.data;
  } catch (error: any) {
    console.error('Error adding site:', error.message || 'Server connection failed');
    throw error;
  }
};

export const updateSite = async (index: number, site: Site): Promise<Site | null> => {
  try {
    const response = await api.put(`/sites/${index}`, site);
    return response.data;
  } catch (error: any) {
    console.error('Error updating site:', error.message || 'Server connection failed');
    throw error;
  }
};

export const deleteSite = async (index: number): Promise<boolean> => {
  try {
    await api.delete(`/sites/${index}`);
    return true;
  } catch (error: any) {
    console.error('Error deleting site:', error.message || 'Server connection failed');
    throw error;
  }
};

export const triggerScrape = async (): Promise<boolean> => {
  try {
    await api.post('/scrape');
    return true;
  } catch (error: any) {
    console.error('Error triggering scrape:', error.message || 'Server connection failed');
    throw error;
  }
};

// Check if server is running
export const checkServerStatus = async (): Promise<boolean> => {
  try {
    await api.head('/jobs', { timeout: 2000 });
    return true;
  } catch (error) {
    return false;
  }
};