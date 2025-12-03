import { useState } from 'react';
import { ExportApi, downloadBlob } from '../../lib/utils/exportApi';

interface DataExportProps {
  currentYear?: number;
}

export function DataExport({ currentYear }: DataExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (type: 'json' | 'csv-budget' | 'csv-transactions' | 'summary') => {
    setIsExporting(true);
    setError(null);

    try {
      let blob: Blob;
      let filename: string;

      switch (type) {
        case 'json':
          blob = await ExportApi.exportJSON();
          filename = `budget_export_${new Date().toISOString().split('T')[0]}.json`;
          break;
        
        case 'csv-budget':
          blob = await ExportApi.exportBudgetCSV(currentYear);
          filename = currentYear
            ? `budget_${currentYear}_export_${new Date().toISOString().split('T')[0]}.csv`
            : `budget_export_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        
        case 'csv-transactions':
          blob = await ExportApi.exportTransactionsCSV();
          filename = `transactions_export_${new Date().toISOString().split('T')[0]}.csv`;
          break;
        
        case 'summary':
          blob = await ExportApi.exportSummary();
          filename = `budget_summary_${new Date().toISOString().split('T')[0]}.txt`;
          break;
      }

      downloadBlob(blob, filename);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'export');
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        📥 Exporter les données
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          onClick={() => handleExport('json')}
          disabled={isExporting}
          className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isExporting ? '⏳ Export...' : '📄 JSON Complet'}
        </button>

        <button
          onClick={() => handleExport('csv-budget')}
          disabled={isExporting}
          className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isExporting ? '⏳ Export...' : `📊 Budget CSV${currentYear ? ` (${currentYear})` : ''}`}
        </button>

        <button
          onClick={() => handleExport('csv-transactions')}
          disabled={isExporting}
          className="px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isExporting ? '⏳ Export...' : '💸 Transactions CSV'}
        </button>

        <button
          onClick={() => handleExport('summary')}
          disabled={isExporting}
          className="px-4 py-2 bg-orange-600 dark:bg-orange-500 text-white rounded-lg hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isExporting ? '⏳ Export...' : '📋 Résumé Textuel'}
        </button>
      </div>

      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Les exports incluent toutes vos données budgétaires. JSON = format complet, CSV = compatible Excel/LibreOffice.
      </p>
    </div>
  );
}

