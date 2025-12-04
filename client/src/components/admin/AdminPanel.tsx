import { useState, useEffect } from 'react';
import { Modal } from '../layout/Modal';
import { Api } from '../../core/api';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sessionEmail: string;
  adminEmail: string;
}

interface WAFStats {
  total_threats_detected: number;
  blocked_ips: number;
  threats_by_type: Record<string, number>;
  top_threatening_ips: Record<string, number>;
}

interface BlockedIP {
  blocked_until: string;
  remaining_seconds: number;
}

interface Threat {
  timestamp: string;
  ip: string;
  threat_type: string;
  method: string;
  path: string;
  user_agent: string;
  details: any;
}

export function AdminPanel({ isOpen, onClose, sessionEmail, adminEmail }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'waf' | 'blocked' | 'threats' | 'logs'>('overview');
  const [wafStats, setWafStats] = useState<WAFStats | null>(null);
  const [blockedIPs, setBlockedIPs] = useState<Record<string, BlockedIP>>({});
  const [threats, setThreats] = useState<Threat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threatsLimit, setThreatsLimit] = useState(50);

  // Vérifier si l'utilisateur est admin
  const isAdmin = sessionEmail.toLowerCase() === adminEmail.toLowerCase();

  useEffect(() => {
    if (!isOpen || !isAdmin) return;
    loadWAFData();
  }, [isOpen, isAdmin, activeTab, threatsLimit]);

  const loadWAFData = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    setError(null);
    
    try {
      if (activeTab === 'waf' || activeTab === 'overview') {
        const stats = await Api.getWAFStats();
        setWafStats(stats);
      }
      
      if (activeTab === 'blocked' || activeTab === 'overview') {
        const blocked = await Api.getWAFBlockedIPs();
        setBlockedIPs(blocked.blocked_ips || {});
      }
      
      if (activeTab === 'threats') {
        const threatsData = await Api.getWAFThreats(threatsLimit);
        setThreats(threatsData.threats || []);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données');
      console.error('Erreur chargement admin:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return null; // Ne pas afficher si l'utilisateur n'est pas admin
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🔐 Interface d'Administration" closeable={true}>
      <div className="max-h-[90vh] overflow-y-auto">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            📊 Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveTab('waf')}
            className={`px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'waf'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            🛡️ Statistiques WAF
          </button>
          <button
            onClick={() => setActiveTab('blocked')}
            className={`px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'blocked'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            🚫 IPs Bloquées
          </button>
          <button
            onClick={() => setActiveTab('threats')}
            className={`px-4 py-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === 'threats'
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            ⚠️ Menaces Détectées
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">❌ {error}</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Chargement...</p>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && !loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                  Menaces Totales
                </h3>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {wafStats?.total_threats_detected || 0}
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <h3 className="text-sm font-medium text-red-900 dark:text-red-200 mb-1">
                  IPs Bloquées
                </h3>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {wafStats?.blocked_ips || 0}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <h3 className="text-sm font-medium text-green-900 dark:text-green-200 mb-1">
                  Statut WAF
                </h3>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  🟢 Actif
                </p>
              </div>
            </div>

            {wafStats?.threats_by_type && Object.keys(wafStats.threats_by_type).length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Répartition par Type de Menace
                </h3>
                <div className="space-y-2">
                  {Object.entries(wafStats.threats_by_type).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                        {type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* WAF Stats Tab */}
        {activeTab === 'waf' && !loading && wafStats && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Statistiques WAF
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Menaces totales détectées</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {wafStats.total_threats_detected}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">IPs actuellement bloquées</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {wafStats.blocked_ips}
                  </p>
                </div>
              </div>

              {wafStats.threats_by_type && Object.keys(wafStats.threats_by_type).length > 0 && (
                <div className="mt-6">
                  <h4 className="text-md font-semibold mb-3 text-gray-900 dark:text-white">
                    Menaces par Type
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(wafStats.threats_by_type)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                            {type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {count}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Blocked IPs Tab */}
        {activeTab === 'blocked' && !loading && (
          <div className="space-y-4">
            {Object.keys(blockedIPs).length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>Aucune IP bloquée actuellement</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        IP
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Bloqué jusqu'à
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Temps restant
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {Object.entries(blockedIPs).map(([ip, data]) => (
                      <tr key={ip} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 text-sm font-mono text-gray-900 dark:text-white">
                          {ip}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(data.blocked_until).toLocaleString('fr-FR')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {Math.floor(data.remaining_seconds / 60)} min {data.remaining_seconds % 60} s
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Threats Tab */}
        {activeTab === 'threats' && !loading && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm text-gray-600 dark:text-gray-400">
                Nombre de menaces à afficher :
                <input
                  type="number"
                  min="10"
                  max="500"
                  value={threatsLimit}
                  onChange={(e) => setThreatsLimit(parseInt(e.target.value) || 50)}
                  className="ml-2 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white w-20"
                />
              </label>
              <button
                onClick={loadWAFData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                🔄 Actualiser
              </button>
            </div>

            {threats.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>Aucune menace détectée récemment</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {threats.map((threat, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${
                            threat.threat_type === 'sql_injection' || threat.threat_type === 'command_injection'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              : threat.threat_type === 'xss'
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {threat.threat_type.replace(/_/g, ' ').toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(threat.timestamp).toLocaleString('fr-FR')}
                          </span>
                        </div>
                        <p className="text-sm font-mono text-gray-600 dark:text-gray-400 mb-1">
                          IP: {threat.ip}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {threat.method} {threat.path}
                        </p>
                      </div>
                    </div>
                    {threat.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                          Détails
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs overflow-x-auto">
                          {JSON.stringify(threat.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

