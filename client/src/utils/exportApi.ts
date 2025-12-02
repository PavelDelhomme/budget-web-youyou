/**
 * API utility for data export
 */

export const ExportApi = {
  /**
   * Export all data as JSON
   */
  exportJSON: async (): Promise<Blob> => {
    const response = await fetch('/api/export/json', {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to export JSON');
    }
    
    return response.blob();
  },

  /**
   * Export budget as CSV
   */
  exportBudgetCSV: async (year?: number): Promise<Blob> => {
    const url = year 
      ? `/api/export/csv/budget?year=${year}`
      : '/api/export/csv/budget';
    
    const response = await fetch(url, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to export budget CSV');
    }
    
    return response.blob();
  },

  /**
   * Export transactions as CSV
   */
  exportTransactionsCSV: async (): Promise<Blob> => {
    const response = await fetch('/api/export/csv/transactions', {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to export transactions CSV');
    }
    
    return response.blob();
  },

  /**
   * Export summary as text
   */
  exportSummary: async (): Promise<Blob> => {
    const response = await fetch('/api/export/summary', {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to export summary');
    }
    
    return response.blob();
  },
};

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

