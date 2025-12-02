/**
 * Système de batching pour optimiser les requêtes API
 * Regroupe plusieurs requêtes en une seule pour améliorer les performances
 */

interface BatchedRequest {
  id: string;
  path: string;
  method: string;
  body?: any;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

class APIBatcher {
  private queue: BatchedRequest[] = [];
  private batchTimeout: number = 50; // ms
  private maxBatchSize: number = 10;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  /**
   * Ajouter une requête au batch
   */
  addRequest(
    path: string,
    method: string = 'GET',
    body?: any
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const request: BatchedRequest = {
        id: `${Date.now()}-${Math.random()}`,
        path,
        method,
        body,
        resolve,
        reject,
      };

      this.queue.push(request);

      // Si le batch est plein, l'envoyer immédiatement
      if (this.queue.length >= this.maxBatchSize) {
        this.flush();
      } else {
        // Sinon, programmer un flush après le timeout
        this.scheduleFlush();
      }
    });
  }

  /**
   * Programmer un flush du batch
   */
  private scheduleFlush(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.flush();
    }, this.batchTimeout);
  }

  /**
   * Envoyer toutes les requêtes en batch
   */
  private async flush(): Promise<void> {
    if (this.queue.length === 0) {
      return;
    }

    const requests = [...this.queue];
    this.queue = [];

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    try {
      // Envoyer toutes les requêtes en parallèle
      const responses = await Promise.allSettled(
        requests.map((req) => this.executeRequest(req))
      );

      // Résoudre ou rejeter chaque promesse
      responses.forEach((result, index) => {
        const request = requests[index];
        if (result.status === 'fulfilled') {
          request.resolve(result.value);
        } else {
          request.reject(result.reason);
        }
      });
    } catch (error) {
      // En cas d'erreur globale, rejeter toutes les requêtes
      requests.forEach((req) => req.reject(error));
    }
  }

  /**
   * Exécuter une requête individuelle
   */
  private async executeRequest(request: BatchedRequest): Promise<any> {
    const options: RequestInit = {
      method: request.method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (request.body && request.method !== 'GET') {
      options.body = JSON.stringify(request.body);
    }

    const response = await fetch(`/api/${request.path}`, options);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return response.text();
  }

  /**
   * Forcer le flush immédiat du batch
   */
  forceFlush(): void {
    this.flush();
  }
}

// Instance globale du batcher
export const apiBatcher = new APIBatcher();

/**
 * Fonction helper pour utiliser le batcher
 */
export function batchedApi(
  path: string,
  method: string = 'GET',
  body?: any
): Promise<any> {
  return apiBatcher.addRequest(path, method, body);
}

