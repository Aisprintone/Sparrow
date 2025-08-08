// Base URL points to Netlify function
const API_BASE = '/.netlify/functions/api-proxy';

export class FinanceAIClient {
    async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;

        const config = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Simulation methods
    async runSimulation(scenarioType, data) {
        return this.request(`/simulation/${scenarioType}`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // RAG methods  
    async queryRAG(profileId, query) {
        return this.request(`/rag/query/${profileId}`, {
            method: 'POST',
            body: JSON.stringify(query)
        });
    }

    // Profile methods
    async getProfiles() {
        return this.request('/profiles');
    }

    // Market data
    async getMarketData() {
        return this.request('/api/market-data');
    }

    // Health check
    async healthCheck() {
        return this.request('/health');
    }
}

export const apiClient = new FinanceAIClient();
