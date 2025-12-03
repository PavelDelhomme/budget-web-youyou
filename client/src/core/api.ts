async function api(path: string, opts: RequestInit = {}, silent: boolean = false) {
  // For state-changing methods (PUT, POST, DELETE), add CSRF token
  // Exception: login and statistical endpoints don't need CSRF token (not authenticated yet)
  const method = opts.method || 'GET';
  const needsCSRF = ['PUT', 'POST', 'DELETE'].includes(method.toUpperCase()) 
    && path !== 'login' 
    && !path.startsWith('statistical/');
  
  try {
    const headers: HeadersInit = {
      ...(opts.headers || {}),
    };
    
    if (needsCSRF) {
      const token = await getCSRFToken();
      if (token) {
        headers['X-CSRF-Token'] = token;
      }
    }
    
    const res = await fetch(`/api/${path}`, {
      credentials: "include",
      ...opts,
      headers,
    });
    
    if (!res.ok) {
      // For 401 errors, always treat them as silent to avoid console pollution
      // It's normal if user is not authenticated
      if (res.status === 401) {
        // Si c'est une requête qui nécessite une authentification, signaler que la session a expiré
        const error = new Error('Not authenticated');
        (error as any).status = 401;
        (error as any).silent = true;
        (error as any).sessionExpired = true;
        throw error;
      }
      
      // If CSRF token is invalid (403), try to fetch a new one and retry once
      if (res.status === 403 && needsCSRF) {
        csrfToken = null; // Reset token
        const newToken = await fetchCSRFToken();
        if (newToken) {
          csrfToken = newToken;
          // Retry the request with new token
          const retryHeaders: HeadersInit = {
            ...(opts.headers || {}),
            'X-CSRF-Token': newToken,
          };
          const retryRes = await fetch(`/api/${path}`, {
            credentials: "include",
            ...opts,
            headers: retryHeaders,
          });
          if (retryRes.ok) {
            const ct = retryRes.headers.get("content-type") || "";
            return ct.includes("application/json") ? retryRes.json() : retryRes.text();
          }
        }
      }
      
      let errorMessage = res.statusText;
      try {
        const errorData = await res.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        const text = await res.text().catch(() => res.statusText);
        errorMessage = text || errorMessage;
      }
      const error = new Error(errorMessage);
      (error as any).status = res.status;
      throw error;
    }
    
    const ct = res.headers.get("content-type") || "";
    return ct.includes("application/json") ? res.json() : res.text();
  } catch (error: any) {
    // In silent mode, rethrow without modification to avoid console logging
    if (silent && error?.silent) {
      throw error;
    }
    
    // If network error or connection refused, throw a more meaningful error
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      throw new Error('Le serveur backend n\'est pas disponible. Assurez-vous qu\'il est démarré.');
    }
    throw error;
  }
}

/**
 * Silent API call that doesn't log 401 errors to console
 * Used for session checks where 401 is expected
 */
async function apiSilent(path: string, opts: RequestInit = {}) {
  return api(path, opts, true);
}

// Store CSRF token in memory
let csrfToken: string | null = null;

/**
 * Get CSRF token from server
 */
async function fetchCSRFToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/csrf-token', {
      credentials: 'include',
    });
    if (response.ok) {
      const data = await response.json();
      return data.csrf_token || null;
    }
  } catch (err) {
    console.debug('Could not fetch CSRF token:', err);
  }
  return null;
}

/**
 * Get CSRF token, fetch from server if not cached
 */
async function getCSRFToken(): Promise<string | null> {
  if (csrfToken) {
    return csrfToken;
  }
  csrfToken = await fetchCSRFToken();
  return csrfToken;
}

export const Api = {
  login: async (email: string, password: string) => {
    // Reset CSRF token before login
    csrfToken = null;
    const result = await api("login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    // Store CSRF token from login response
    if (result.csrf_token) {
      csrfToken = result.csrf_token;
    }
    return result;
  },
  
  logout: async () => {
    const result = await api("logout", {
      method: "POST",
    });
    // Clear CSRF token after logout
    csrfToken = null;
    return result;
  },
  
  getYears: () => api("years"),
  
  // Check session without generating 401 errors - always returns 200
  checkSession: async () => {
    const result = await api("session-check");
    // If session is authenticated, fetch CSRF token
    if (result.authenticated && !csrfToken) {
      csrfToken = await fetchCSRFToken();
    }
    return result;
  },
  
  // Get CSRF token explicitly
  getCSRFToken: async () => {
    return await getCSRFToken();
  },
  
  addYear: (year: number) =>
    api("years", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year }),
    }),
  
  deleteYear: (year: number) =>
    api(`years?year=${encodeURIComponent(year)}`, {
      method: "DELETE",
    }),
  
  getYearData: (year: number) =>
    api(`get?year=${encodeURIComponent(year)}`),
  
  putYearData: (year: number, payload: { categories: any[]; expenses: any[]; subs: any[]; annualFixedExpenses?: any[]; monthlySalary?: number; variableMonthlyIncomes?: number[]; additionalMonthlyIncomes?: any[]; currentSavings?: number; savingsTransactions?: any[] }) =>
    api(`put?year=${encodeURIComponent(year)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  
  getGlobalData: () => api("global"),
  
  putGlobalData: (payload: any) =>
    api("global", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  
  // Statistical budget generation (no auth required for signup)
  generateStatisticalBudget: (profile: any) =>
    api("statistical/generate-budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    }, false), // Don't require CSRF token - used during signup
};

