export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  link: string;
  source: string;
  keyword: string;
  date: string;
}

export interface SiteSelectors {
  jobContainer: string;
  title: string;
  company: string;
  location: string;
  link: string;
}

export interface Site {
  name: string;
  url: string;
  searchTerms: string[];
  selectors: SiteSelectors;
}