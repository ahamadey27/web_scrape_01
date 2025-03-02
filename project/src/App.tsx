import React, { useState, useEffect } from 'react';
import { Job, Site } from './types';
import { fetchJobs, fetchSites, addSite, updateSite, deleteSite, triggerScrape } from './api';
import JobList from './components/JobList';
import SiteManager from './components/SiteManager';
import { Music, RefreshCw, Settings, Play } from 'lucide-react';

function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'jobs' | 'sites'>('jobs');
  const [isScrapingNow, setIsScrapingNow] = useState(false);
  const [serverRunning, setServerRunning] = useState(false);

  useEffect(() => {
    loadData();
    // Check server status every 5 seconds
    const interval = setInterval(checkServerStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkServerStatus = async () => {
    try {
      await fetch('http://localhost:3001/api/jobs', { method: 'HEAD' });
      setServerRunning(true);
      setError(null);
    } catch (err) {
      setServerRunning(false);
      setError('Server is not running. Please start the server with "npm run server" in a new terminal.');
    }
  };

  const loadData = async () => {
    setLoading(true);
    
    try {
      const [jobsData, sitesData] = await Promise.all([
        fetchJobs(),
        fetchSites()
      ]);
      
      setJobs(jobsData);
      setSites(sitesData);
      
      if (jobsData.length > 0 || sitesData.length > 0) {
        setServerRunning(true);
        setError(null);
      }
    } catch (err) {
      // Error is already handled in the API functions
    } finally {
      setLoading(false);
    }
  };

  const handleAddSite = async (site: Site) => {
    if (!serverRunning) {
      setError('Server is not running. Please start the server with "npm run server" in a new terminal.');
      return;
    }
    
    try {
      await addSite(site);
      const updatedSites = await fetchSites();
      setSites(updatedSites);
    } catch (err) {
      setError('Failed to add site');
    }
  };

  const handleUpdateSite = async (index: number, site: Site) => {
    if (!serverRunning) {
      setError('Server is not running. Please start the server with "npm run server" in a new terminal.');
      return;
    }
    
    try {
      await updateSite(index, site);
      const updatedSites = await fetchSites();
      setSites(updatedSites);
    } catch (err) {
      setError('Failed to update site');
    }
  };

  const handleDeleteSite = async (index: number) => {
    if (!serverRunning) {
      setError('Server is not running. Please start the server with "npm run server" in a new terminal.');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this site?')) {
      try {
        await deleteSite(index);
        const updatedSites = await fetchSites();
        setSites(updatedSites);
      } catch (err) {
        setError('Failed to delete site');
      }
    }
  };

  const handleScrapeNow = async () => {
    if (!serverRunning) {
      setError('Server is not running. Please start the server with "npm run server" in a new terminal.');
      return;
    }
    
    setIsScrapingNow(true);
    setError(null);
    
    try {
      await triggerScrape();
      // Wait a bit to allow scraping to complete
      setTimeout(async () => {
        const jobsData = await fetchJobs();
        setJobs(jobsData);
        setIsScrapingNow(false);
      }, 3000);
    } catch (err) {
      setError('Failed to trigger scraping');
      setIsScrapingNow(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-indigo-700 text-white shadow-md">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Music size={32} className="mr-3" />
              <h1 className="text-2xl font-bold">Music & Audio Job Finder</h1>
            </div>
            
            <div className="flex gap-2">
              {!serverRunning && (
                <div className="flex items-center text-yellow-300 mr-4">
                  <span className="text-sm">Server not running</span>
                </div>
              )}
              <button
                onClick={handleScrapeNow}
                disabled={isScrapingNow || !serverRunning}
                className="flex items-center gap-1 bg-white text-indigo-700 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors disabled:bg-gray-300 disabled:text-gray-500"
              >
                <RefreshCw size={16} className={isScrapingNow ? "animate-spin" : ""} />
                {isScrapingNow ? 'Scraping...' : 'Scrape Now'}
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{error}</p>
            {!serverRunning && (
              <div className="mt-2 flex items-center">
                <Play size={16} className="mr-1" />
                <span>Run <code className="bg-red-50 px-1 rounded">npm run server</code> in a new terminal to start the server</span>
              </div>
            )}
          </div>
        )}
        
        <div className="mb-6">
          <div className="flex border-b border-gray-200">
            <button
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'jobs'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('jobs')}
            >
              Job Listings
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm flex items-center ${
                activeTab === 'sites'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('sites')}
            >
              <Settings size={16} className="mr-1" />
              Configure Sites
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            {activeTab === 'jobs' && (
              <>
                <div className="mb-4">
                  <p className="text-gray-600">
                    Found {jobs.length} job listings matching your keywords.
                  </p>
                </div>
                <JobList jobs={jobs} />
              </>
            )}
            
            {activeTab === 'sites' && (
              <SiteManager
                sites={sites}
                onAddSite={handleAddSite}
                onUpdateSite={handleUpdateSite}
                onDeleteSite={handleDeleteSite}
              />
            )}
          </>
        )}
      </main>
      
      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-4">
          <p className="text-center text-gray-400 text-sm">
            Music & Audio Job Finder © {new Date().getFullYear()} - Scrapes job listings for music and audio professionals
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;