import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// File to store job listings
const JOBS_FILE = path.join(__dirname, 'jobs.json');

// File to store website configurations
const SITES_FILE = path.join(__dirname, 'sites.json');

// Initialize files if they don't exist
if (!fs.existsSync(JOBS_FILE)) {
  fs.writeFileSync(JOBS_FILE, JSON.stringify([]));
}

if (!fs.existsSync(SITES_FILE)) {
  const initialSites = [
    {
      name: 'Indeed',
      url: 'https://www.indeed.com/jobs?q=',
      searchTerms: ['music', 'audio', 'sound designer', 'sound design'],
      selectors: {
        jobContainer: '.job_seen_beacon',
        title: '.jobTitle',
        company: '.companyName',
        location: '.companyLocation',
        link: '.jcs-JobTitle'
      }
    },
    {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/jobs/search/?keywords=',
      searchTerms: ['music', 'audio', 'sound designer', 'sound design'],
      selectors: {
        jobContainer: '.job-search-card',
        title: '.base-search-card__title',
        company: '.base-search-card__subtitle',
        location: '.job-search-card__location',
        link: '.base-card__full-link'
      }
    }
  ];
  fs.writeFileSync(SITES_FILE, JSON.stringify(initialSites, null, 2));
}

// Load websites configuration
const loadSites = () => {
  try {
    const data = fs.readFileSync(SITES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading sites:', error);
    return [];
  }
};

// Load job listings
const loadJobs = () => {
  try {
    const data = fs.readFileSync(JOBS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading jobs:', error);
    return [];
  }
};

// Save job listings
const saveJobs = (jobs) => {
  try {
    fs.writeFileSync(JOBS_FILE, JSON.stringify(jobs, null, 2));
  } catch (error) {
    console.error('Error saving jobs:', error);
  }
};

// Save website configurations
const saveSites = (sites) => {
  try {
    fs.writeFileSync(SITES_FILE, JSON.stringify(sites, null, 2));
  } catch (error) {
    console.error('Error saving sites:', error);
  }
};

// Scrape job listings from a website
const scrapeJobs = async (site) => {
  const jobs = [];
  
  for (const term of site.searchTerms) {
    try {
      const searchUrl = `${site.url}${encodeURIComponent(term)}`;
      console.log(`Scraping ${site.name} for "${term}" at ${searchUrl}`);
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000 // 10 second timeout
      });
      
      const $ = cheerio.load(response.data);
      
      $(site.selectors.jobContainer).each((i, el) => {
        const title = $(el).find(site.selectors.title).text().trim();
        const company = $(el).find(site.selectors.company).text().trim();
        const location = $(el).find(site.selectors.location).text().trim();
        let link = $(el).find(site.selectors.link).attr('href');
        
        // Handle relative URLs
        if (link && !link.startsWith('http')) {
          const baseUrl = new URL(site.url).origin;
          link = `${baseUrl}${link}`;
        }
        
        if (title) {
          jobs.push({
            id: `${site.name}-${title}-${company}`.replace(/[^a-zA-Z0-9]/g, '-'),
            title,
            company,
            location,
            link,
            source: site.name,
            keyword: term,
            date: new Date().toISOString()
          });
        }
      });
    } catch (error) {
      console.error(`Error scraping ${site.name} for "${term}":`, error.message);
    }
  }
  
  return jobs;
};

// Run scraper for all sites
const runScraper = async () => {
  console.log('Starting job scraper...');
  const sites = loadSites();
  let allJobs = loadJobs();
  
  for (const site of sites) {
    const newJobs = await scrapeJobs(site);
    console.log(`Found ${newJobs.length} jobs from ${site.name}`);
    
    // Add only new jobs (avoid duplicates)
    const existingIds = new Set(allJobs.map(job => job.id));
    const uniqueNewJobs = newJobs.filter(job => !existingIds.has(job.id));
    
    allJobs = [...uniqueNewJobs, ...allJobs];
  }
  
  // Sort by date (newest first)
  allJobs.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Save updated jobs
  saveJobs(allJobs);
  console.log(`Scraping complete. Total jobs: ${allJobs.length}`);
  
  return allJobs.length;
};

// API endpoints
app.get('/api/jobs', (req, res) => {
  try {
    const jobs = loadJobs();
    res.json(jobs);
  } catch (error) {
    console.error('Error serving jobs:', error);
    res.status(500).json({ error: 'Failed to load jobs' });
  }
});

app.get('/api/sites', (req, res) => {
  try {
    const sites = loadSites();
    res.json(sites);
  } catch (error) {
    console.error('Error serving sites:', error);
    res.status(500).json({ error: 'Failed to load sites' });
  }
});

app.post('/api/sites', (req, res) => {
  try {
    const sites = loadSites();
    const newSite = req.body;
    
    // Validate required fields
    if (!newSite.name || !newSite.url || !newSite.searchTerms || !newSite.selectors) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    sites.push(newSite);
    saveSites(sites);
    res.status(201).json(newSite);
  } catch (error) {
    console.error('Error adding site:', error);
    res.status(500).json({ error: 'Failed to add site' });
  }
});

app.put('/api/sites/:index', (req, res) => {
  try {
    const sites = loadSites();
    const index = parseInt(req.params.index);
    
    if (isNaN(index) || index < 0 || index >= sites.length) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    sites[index] = req.body;
    saveSites(sites);
    res.json(sites[index]);
  } catch (error) {
    console.error('Error updating site:', error);
    res.status(500).json({ error: 'Failed to update site' });
  }
});

app.delete('/api/sites/:index', (req, res) => {
  try {
    const sites = loadSites();
    const index = parseInt(req.params.index);
    
    if (isNaN(index) || index < 0 || index >= sites.length) {
      return res.status(404).json({ error: 'Site not found' });
    }
    
    sites.splice(index, 1);
    saveSites(sites);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting site:', error);
    res.status(500).json({ error: 'Failed to delete site' });
  }
});

app.post('/api/scrape', async (req, res) => {
  try {
    const jobCount = await runScraper();
    res.json({ success: true, jobCount });
  } catch (error) {
    console.error('Error during scrape:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add a health check endpoint
app.head('/api/jobs', (req, res) => {
  res.status(200).end();
});

// Schedule daily scraping (at midnight)
cron.schedule('0 0 * * *', () => {
  runScraper();
});

// Handle startup errors
const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
  // Run initial scrape on server start
  // runScraper();
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please close other applications using this port or change the port number.`);
  } else {
    console.error('Server error:', error);
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});