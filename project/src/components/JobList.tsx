import React, { useState } from 'react';
import { Job } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, Briefcase, MapPin, Calendar, Search } from 'lucide-react';

interface JobListProps {
  jobs: Job[];
}

const JobList: React.FC<JobListProps> = ({ jobs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState<string>('');
  const [filterKeyword, setFilterKeyword] = useState<string>('');

  // Get unique sources and keywords for filters
  const sources = Array.from(new Set(jobs.map(job => job.source)));
  const keywords = Array.from(new Set(jobs.map(job => job.keyword)));

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = searchTerm === '' || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSource = filterSource === '' || job.source === filterSource;
    const matchesKeyword = filterKeyword === '' || job.keyword === filterKeyword;
    
    return matchesSearch && matchesSource && matchesKeyword;
  });

  return (
    <div className="w-full">
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search jobs..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
            >
              <option value="">All Sources</option>
              {sources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
            
            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filterKeyword}
              onChange={(e) => setFilterKeyword(e.target.value)}
            >
              <option value="">All Keywords</option>
              {keywords.map(keyword => (
                <option key={keyword} value={keyword}>{keyword}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <p className="text-gray-500">No jobs found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map(job => (
            <div key={job.id} className="bg-white p-5 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-semibold text-indigo-700">{job.title}</h3>
                <a 
                  href={job.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <ExternalLink size={16} />
                  <span className="hidden sm:inline">View</span>
                </a>
              </div>
              
              <div className="mt-2 flex flex-wrap gap-y-2">
                <div className="flex items-center text-gray-600 mr-4">
                  <Briefcase size={16} className="mr-1" />
                  <span>{job.company}</span>
                </div>
                
                <div className="flex items-center text-gray-600 mr-4">
                  <MapPin size={16} className="mr-1" />
                  <span>{job.location}</span>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <Calendar size={16} className="mr-1" />
                  <span>{formatDistanceToNow(new Date(job.date), { addSuffix: true })}</span>
                </div>
              </div>
              
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded">
                  {job.source}
                </span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                  {job.keyword}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobList;