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
        }
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
};

// API endpoints
app.get('/api/jobs', (req, res) => {
  const jobs = loadJobs();
  res.json(jobs);
});

app.get('/api/sites', (req, res) => {
  const sites = loadSites();
  res.json(sites);
});

app.post('/api/sites', (req, res) => {
  const sites = loadSites();
  const newSite = req.body;
  
  // Validate required fields
  if (!newSite.name || !newSite.url || !newSite.searchTerms || !newSite.selectors) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  sites.push(newSite);
  saveSites(sites);
  res.status(201).json(newSite);
});

app.put('/api/sites/:index', (req, res) => {
  const sites = loadSites();
  const index = parseInt(req.params.index);
  
  if (isNaN(index) || index < 0 || index >= sites.length) {
    return res.status(404).json({ error: 'Site not found' });
  }
  
  sites[index] = req.body;
  saveSites(sites);
  res.json(sites[index]);
});

app.delete('/api/sites/:index', (req, res) => {
  const sites = loadSites();
  const index = parseInt(req.params.index);
  
  if (isNaN(index) || index < 0 || index >= sites.length) {
    return res.status(404).json({ error: 'Site not found' });
  }
  
  sites.splice(index, 1);
  saveSites(sites);
  res.json({ success: true });
});

app.post('/api/scrape', async (req, res) => {
  try {
    await runScraper();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Schedule daily scraping (at midnight)
cron.schedule('0 0 * * *', () => {
  runScraper();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
  // Run initial scrape on server start
  // runScraper();
});