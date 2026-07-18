export interface Category {
  id: number;
  name: string;
}

export interface Company {
  name: string;
  slug: string;
}

export interface Vacancy {
  id: number;
  title: string;
  slug: string;
  description: string;
  salary: string | null;
  type: string | null;
  category?: Category;
  company?: Company;
  locations: string[];
  deadline: string | null;
  url: string;
}

export interface Tender {
  id: number;
  title: string;
  slug: string;
  preview: string;
  category?: Category;
  company?: Company;
  location: string | null;
  deadline: string | null;
  url: string;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

export interface PaginationLinks {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  links: PaginationLinks;
  meta: PaginationMeta;
}

export interface SingleResponse<T> {
  data: T;
}
