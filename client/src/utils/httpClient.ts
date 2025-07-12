
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  body?: any;
}

const BASE_URL = "https://case-supplier-api.projects.bbdgrad.com:444/api/reports";
// const BASE_URL = "http://localhost:8080/api/reports";

const buildQueryString = (params?: RequestOptions['params']): string => {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  for (const key in params) {
    if (params[key] !== undefined && params[key] !== null) {
      searchParams.append(key, String(params[key]));
    }
  }
  return `?${searchParams.toString()}`;
};

const httpRequest = async <T>(
  url: string,
  method: HttpMethod,
  options: RequestOptions = {}
): Promise<T> => {
  const { headers = {}, body, params } = options;

  const fullUrl = BASE_URL + url + buildQueryString(params);

  const response = await fetch(fullUrl, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: method === 'GET' || method === 'DELETE' ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
};


export const api = {
  get: <T = any>(url: string, options?: RequestOptions) => httpRequest<T>(url, 'GET', options),
  post: <T = any>(url: string, body?: any, options?: RequestOptions) => httpRequest<T>(url, 'POST', { ...options, body }),
  put: <T = any>(url: string, body?: any, options?: RequestOptions) => httpRequest<T>(url, 'PUT', { ...options, body }),
  patch: <T = any>(url: string, body?: any, options?: RequestOptions) => httpRequest<T>(url, 'PATCH', { ...options, body }),
  delete: <T = any>(url: string, options?: RequestOptions) => httpRequest<T>(url, 'DELETE', options),
};

export default api;
