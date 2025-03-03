import React, { useState, useEffect } from 'react';
import { Job, Site } from './types';
import { fetchJobs, fetchSites, addSite, updateSite, deleteSite, triggerScrape, checkServerStatus } from './api';
import JobList from './components/JobList';
import SiteManager from './components/SiteManager';
import { Music, RefreshCw, Settings, Play, AlertCircle } from 'lucide-react';

function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'jobs' | 'sites'>('jobs');
  const [isScrapingNow, setIsScrapingNow] = useState(false);
  const [serverRunning, setServerRunning] = useState(false);
  const [isCheckingServer, setIsCheckingServer] = useState(false);

  useEffect(() => {
    checkServerConnection();
    
    // Check server status every 10 seconds
    const interval = setInterval(checkServerConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkServerConnection = async () => {
    if (isCheckingServer) return;
    
    setIsCheckingServer(true);
    try {
      const isRunning = await checkServerStatus();
      setServerRunning(isRunning);
      
      if (isRunning) {
        setError(null);
        if (jobs.length === 0 && sites.length === 0) {
          loadData();
        }
      } else {
        setError('Server is not running. Please start the server with "npm run server" in a new terminal.');
      }
    } catch (err) {
      setServerRunning(false);
      setError('Server is not running. Please start the server with "npm run server" in a new terminal.');
    } finally {
      setIsCheckingServer(false);
    }
  };

  const loadData = async () => {
    if (!serverRunning) {
      await checkServerConnection();
      if (!serverRunning) return;
    }
    
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

  const startServer = () => {
    window.open('about:blank', '_blank')?.document.write(`
      <html>
        <head>
          <title>Server Instructions</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
            pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
            .note { background: #fffde7; border-left: 4px solid #ffd600; padding: 10px; margin: 20px 0; }
            .command { font-family: monospace; background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
          </style>
        </head>
        <body>
          <h1>Starting the Server</h1>
          <p>To start the server, follow these steps:</p>
          
          <ol>
            <li>Open a <strong>new terminal</strong> in your project</li>
            <li>Run the command: <pre>npm run server</pre></li>
            <li>Keep this terminal window open while using the application</li>
          </ol>
          
          <div class="note">
            <strong>Important:</strong> The server must stay running for the application to work properly. Do not close the terminal window.
          </div>
          
          <p>Once the server is running, you should see a message like:</p>
          <pre>Server running on http://localhost:3001</pre>
          
          <p>After that, you can close this window and return to the application. The app will automatically detect the running server.</p>
          
          <h2>Troubleshooting</h2>
          <p>If you encounter issues:</p>
          <ul>
            <li>Make sure you're running the command in a new terminal, not the one running the frontend</li>
            <li>Check for any error messages in the terminal</li>
            <li>If port 3001 is already in use, you may need to stop other applications using that port</li>
          </ul>
        </body>
      </html>
    `);
  };

  const handleRetryConnection = async () => {
    setLoading(true);
    await checkServerConnection();
    if (serverRunning) {
      await loadData();
    }
    setLoading(false);
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
            
            <div className="flex gap-2 items-center">
              {!serverRunning && (
                <button 
                  onClick={startServer}
                  className="flex items-center gap-1 bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors"
                >
                  <Play size={16} />
                  <span className="text-sm">Start Server</span>
                </button>
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
            <div className="flex items-start">
              <AlertCircle size={20} className="mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">{error}</p>
                <div className="mt-2 flex gap-2">
                  {!serverRunning && (
                    <button
                      onClick={startServer}
                      className="inline-flex items-center text-sm bg-red-50 hover:bg-red-100 text-red-800 px-3 py-1 rounded transition-colors"
                    >
                      <Play size={14} className="mr-1" />
                      View server instructions
                    </button>
                  )}
                  <button
                    onClick={handleRetryConnection}
                    className="inline-flex items-center text-sm bg-red-50 hover:bg-red-100 text-red-800 px-3 py-1 rounded transition-colors"
                  >
                    <RefreshCw size={14} className="mr-1" />
                    Retry connection
                  </button>
                </div>
              </div>
            </div>
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
                    {serverRunning 
                      ? `Found ${jobs.length} job listings matching your keywords.`
                      : "Connect to the server to view job listings."}
                  </p>
                </div>
                {serverRunning || jobs.length > 0 ? (
                  <JobList jobs={jobs} />
                ) : (
                  <div className="bg-white p-8 rounded-lg shadow-md text-center">
                    <AlertCircle size={48} className="mx-auto mb-4 text-yellow-500" />
                    <h3 className="text-xl font-semibold mb-2">Server Not Running</h3>
                    <p className="text-gray-600 mb-4">
                      The job listings cannot be displayed because the server is not running.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <button
                        onClick={startServer}
                        className="inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                      >
                        <Play size={16} className="mr-2" />
                        View Server Instructions
                      </button>
                      <button
                        onClick={handleRetryConnection}
                        className="inline-flex items-center bg-gray-100 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        <RefreshCw size={16} className="mr-2" />
                        Retry Connection
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            
            {activeTab === 'sites' && (
              <SiteManager
                sites={sites}
                onAddSite={handleAddSite}
                onUpdateSite={handleUpdateSite}
                onDeleteSite={handleDeleteSite}
                serverRunning={serverRunning}
                onStartServer={startServer}
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