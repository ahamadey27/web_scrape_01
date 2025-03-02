import axios from 'axios';
import { Job, Site } from './types';

const API_URL = 'http://localhost:3001/api';

export const fetchJobs = async (): Promise<Job[]> => {
  try {
    const response = await axios.get(`${API_URL}/jobs`);
    return response.data;
  } catch (error) {
    console.error('Error fetching jobs:', error.message || 'Server connection failed');
    return [];
  }
};

export const fetchSites = async (): Promise<Site[]> => {
  try {
    const response = await axios.get(`${API_URL}/sites`);
    return response.data;
  } catch (error) {
    console.error('Error fetching sites:', error.message || 'Server connection failed');
    return [];
  }
};

export const addSite = async (site: Site): Promise<Site | null> => {
  try {
    const response = await axios.post(`${API_URL}/sites`, site);
    return response.data;
  } catch (error) {
    console.error('Error adding site:', error.message || 'Server connection failed');
    return null;
  }
};

export const updateSite = async (index: number, site: Site): Promise<Site | null> => {
  try {
    const response = await axios.put(`${API_URL}/sites/${index}`, site);
    return response.data;
  } catch (error) {
    console.error('Error updating site:', error.message || 'Server connection failed');
    return null;
  }
};

export const deleteSite = async (index: number): Promise<boolean> => {
  try {
    await axios.delete(`${API_URL}/sites/${index}`);
    return true;
  } catch (error) {
    console.error('Error deleting site:', error.message || 'Server connection failed');
    return false;
  }
};

export const triggerScrape = async (): Promise<boolean> => {
  try {
    await axios.post(`${API_URL}/scrape`);
    return true;
  } catch (error) {
    console.error('Error triggering scrape:', error.message || 'Server connection failed');
    return false;
  }
};