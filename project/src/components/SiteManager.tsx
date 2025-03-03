import React, { useState } from 'react';
import { Site } from '../types';
import { Plus, Edit, Trash2, Save, X, AlertCircle, Play } from 'lucide-react';

interface SiteManagerProps {
  sites: Site[];
  onAddSite: (site: Site) => Promise<void>;
  onUpdateSite: (index: number, site: Site) => Promise<void>;
  onDeleteSite: (index: number) => Promise<void>;
  serverRunning: boolean;
  onStartServer: () => void;
}

const defaultSelectors = {
  jobContainer: '',
  title: '',
  company: '',
  location: '',
  link: ''
};

const emptySite: Site = {
  name: '',
  url: '',
  searchTerms: [],
  selectors: { ...defaultSelectors }
};

const SiteManager: React.FC<SiteManagerProps> = ({ 
  sites, 
  onAddSite, 
  onUpdateSite, 
  onDeleteSite,
  serverRunning,
  onStartServer
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newSite, setNewSite] = useState<Site>({ ...emptySite });
  const [searchTermInput, setSearchTermInput] = useState('');

  const handleAddSearchTerm = () => {
    if (searchTermInput.trim()) {
      setNewSite({
        ...newSite,
        searchTerms: [...newSite.searchTerms, searchTermInput.trim()]
      });
      setSearchTermInput('');
    }
  };

  const handleRemoveSearchTerm = (index: number) => {
    setNewSite({
      ...newSite,
      searchTerms: newSite.searchTerms.filter((_, i) => i !== index)
    });
  };

  const handleSelectorChange = (key: keyof typeof defaultSelectors, value: string) => {
    setNewSite({
      ...newSite,
      selectors: {
        ...newSite.selectors,
        [key]: value
      }
    });
  };

  const handleSubmit = async () => {
    if (editingIndex !== null) {
      await onUpdateSite(editingIndex, newSite);
      setEditingIndex(null);
    } else {
      await onAddSite(newSite);
    }
    setNewSite({ ...emptySite });
    setIsAdding(false);
  };

  const handleEdit = (index: number) => {
    setNewSite({ ...sites[index] });
    setEditingIndex(index);
    setIsAdding(true);
  };

  const handleCancel = () => {
    setNewSite({ ...emptySite });
    setEditingIndex(null);
    setIsAdding(false);
  };

  if (!serverRunning && sites.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <AlertCircle size={48} className="mx-auto mb-4 text-yellow-500" />
        <h3 className="text-xl font-semibold mb-2">Server Not Running</h3>
        <p className="text-gray-600 mb-4">
          You need to start the server to configure scraping sites.
        </p>
        <button
          onClick={onStartServer}
          className="inline-flex items-center bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          <Play size={16} className="mr-2" />
          View Server Instructions
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Manage Scraping Sites</h2>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            disabled={!serverRunning}
            className="flex items-center gap-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-300"
          >
            <Plus size={16} />
            Add Site
          </button>
        )}
      </div>

      {!serverRunning && sites.length > 0 && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <AlertCircle size={20} className="text-yellow-500 mr-2 flex-shrink-0" />
            <div>
              <p className="font-medium text-yellow-700">Server not running</p>
              <p className="text-yellow-600 mt-1">
                You can view existing sites, but you cannot add, edit, or delete sites until the server is running.
              </p>
              <button
                onClick={onStartServer}
                className="mt-2 inline-flex items-center text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded transition-colors"
              >
                <Play size={14} className="mr-1" />
                View server instructions
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdding && (
        <div className="mb-8 p-4 border border-gray-200 rounded-lg">
          <h3 className="text-lg font-medium mb-4">
            {editingIndex !== null ? 'Edit Site' : 'Add New Site'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
              <input
                type="text"
                value={newSite.name}
                onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Indeed, LinkedIn"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
              <input
                type="text"
                value={newSite.url}
                onChange={(e) => setNewSite({ ...newSite, url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., https://www.indeed.com/jobs?q="
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Terms</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={searchTermInput}
                onChange={(e) => setSearchTermInput(e.target.value)}
                className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., music, audio, sound designer"
                onKeyDown={(e) => e.key === 'Enter' && handleAddSearchTerm()}
              />
              <button
                onClick={handleAddSearchTerm}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Add
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {newSite.searchTerms.map((term, index) => (
                <div key={index} className="flex items-center bg-gray-100 px-3 py-1 rounded-md">
                  <span className="mr-2">{term}</span>
                  <button
                    onClick={() => handleRemoveSearchTerm(index)}
                    className="text-gray-500 hover:text-red-500"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="text-md font-medium mb-2">CSS Selectors</h4>
            <p className="text-sm text-gray-600 mb-3">
              These selectors are used to extract job information from the website's HTML.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(defaultSelectors).map(([key]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <input
                    type="text"
                    value={newSite.selectors[key as keyof typeof defaultSelectors]}
                    onChange={(e) => handleSelectorChange(key as keyof typeof defaultSelectors, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={`CSS selector for ${key}`}
                  />
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!newSite.name || !newSite.url || newSite.searchTerms.length === 0}
              className="flex items-center gap-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-indigo-300"
            >
              <Save size={16} />
              {editingIndex !== null ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Search Terms</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sites.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  No sites configured. Add a site to start scraping.
                </td>
              </tr>
            ) : (
              sites.map((site, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">{site.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-[200px]">
                    {site.url}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {site.searchTerms.map((term, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 text-xs rounded-full">
                          {term}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(index)}
                        disabled={!serverRunning}
                        className="text-indigo-600 hover:text-indigo-900 disabled:text-gray-400"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => onDeleteSite(index)}
                        disabled={!serverRunning}
                        className="text-red-600 hover:text-red-900 disabled:text-gray-400"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SiteManager;