async function api(path: string, opts: RequestInit = {}) {
  try {
    const res = await fetch(`/api/${path}`, {
      credentials: "include",
      ...opts,
    });
    
    if (!res.ok) {
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
    // If network error or connection refused, throw a more meaningful error
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      throw new Error('Le serveur backend n\'est pas disponible. Assurez-vous qu\'il est démarré.');
    }
    throw error;
  }
}

export const Api = {
  login: (email: string, password: string) =>
    api("login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  
  logout: () =>
    api("logout", {
      method: "POST",
    }),
  
  getYears: () => api("years"),
  
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
  
  putYearData: (year: number, payload: { categories: any[]; expenses: any[]; subs: any[]; annualFixedExpenses?: any[]; monthlySalary?: number; currentSavings?: number; savingsTransactions?: any[] }) =>
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
};

