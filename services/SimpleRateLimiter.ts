export class SimpleRateLimiter {
    private static instance: SimpleRateLimiter;
    private requestQueue: (() => Promise<any>)[] = [];
    private isProcessing = false;
    private maxConcurrentRequests = 4;
    private currentRequests = 0;
    private retryDelay = 1000;

    static getInstance(): SimpleRateLimiter {
        if (!SimpleRateLimiter.instance) {
            SimpleRateLimiter.instance = new SimpleRateLimiter();
        }
        return SimpleRateLimiter.instance;
    }

    async addRequest<T>(requestFn: () => Promise<T> | PromiseLike<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.requestQueue.push(async () => {
                try {
                    this.currentRequests++;
                    const result = await requestFn();
                    this.currentRequests--;
                    resolve(result);
                } catch (error) {
                    this.currentRequests--;
                    reject(error);
                }
            });
            this.processQueue();
        });
    }

    private async processQueue() {
        if (this.isProcessing || this.requestQueue.length === 0) return;
        
        this.isProcessing = true;
        
        while (this.requestQueue.length > 0 && this.currentRequests < this.maxConcurrentRequests) {
            const request = this.requestQueue.shift();
            if (request) {
                request().catch(() => {});
            }
            // Pequeno delay entre requisições
            await this.delay(50);
        }
        
        this.isProcessing = false;
        
        if (this.requestQueue.length > 0) {
            setTimeout(() => this.processQueue(), 100);
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async batchRequests<T>(requests: (() => Promise<any> | PromiseLike<any>)[]): Promise<T[]> {
        const promises = requests.map(request => this.addRequest(request));
        return Promise.all(promises);
    }
}

export const rateLimiter = SimpleRateLimiter.getInstance();
