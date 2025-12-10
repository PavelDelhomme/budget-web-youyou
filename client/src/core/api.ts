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
    
    let res: Response;
    try {
      res = await fetch(`/api/${path}`, {
        credentials: "include",
        ...opts,
        headers,
      });
    } catch (fetchError: any) {
      // Intercepter les erreurs de fetch avant qu'elles soient loggées
      const isConnectionError = fetchError?.message?.includes("Failed to fetch") || 
                                fetchError?.message?.includes("ERR_CONNECTION_REFUSED") ||
                                fetchError?.name === "TypeError" ||
                                fetchError?.message?.includes("NetworkError");
      
      if (isConnectionError && path === "session-check") {
        // Pour session-check, retourner une réponse silencieuse
        fetchError.silent = true;
        fetchError.expected = true;
      }
      throw fetchError;
    }
    
    if (!res.ok) {
      // For 401 errors, check if it's a getYearData request for a future year
      // Those might return 401 if the year doesn't exist yet (normal for predicted years)
      if (res.status === 401) {
        const isYearDataRequest = path.startsWith('get?year=');
        const error = new Error('Not authenticated');
        (error as any).status = 401;
        (error as any).silent = isYearDataRequest; // Silent for year data requests (might be future years)
        (error as any).sessionExpired = !isYearDataRequest; // Only session expired if not a year data request
        (error as any).expected = isYearDataRequest; // Expected for year data requests (future years don't exist)
        throw error;
      }
      
      // For 404 errors on endpoints that might not exist (like fiscal endpoints)
      // Don't log them as errors if they're expected
      if (res.status === 404) {
        const error = new Error(`Endpoint not found: ${path}`);
        (error as any).status = 404;
        (error as any).silent = silent; // Only silent if requested
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
    
    // Ne pas logger les erreurs de connexion répétées (ERR_CONNECTION_REFUSED)
    // pour éviter la pollution de la console
    const isConnectionError = error?.message?.includes("Failed to fetch") || 
                              error?.message?.includes("ERR_CONNECTION_REFUSED") ||
                              error?.name === "TypeError" ||
                              error?.message?.includes("NetworkError");
    
    // Pour les erreurs de connexion sur session-check, marquer comme silencieuse
    if (isConnectionError && path === "session-check") {
      error.silent = true;
    }
    
    // Log errors only if they're not expected, silent, or connection errors
    if (!error?.silent && !error?.expected && !isConnectionError) {
      console.error(`API Error [${path}]:`, error.message || error);
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
  
  // Admin routes - WAF statistics and management
  getWAFStats: () => api("waf/stats"),
  getWAFBlockedIPs: () => api("waf/blocked-ips"),
  getWAFThreats: (limit?: number) => 
    api(`waf/threats${limit ? `?limit=${limit}` : ''}`),
};

