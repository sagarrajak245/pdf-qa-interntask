import { InferenceClient } from '@huggingface/inference';
import { ChromaClient } from 'chromadb';

class VectorStoreService {
    private client: ChromaClient;
    private hf: InferenceClient;

    constructor() {
        this.client = new ChromaClient();
        this.hf = new InferenceClient(process.env.HUGGINGFACE_API_KEY);
    }

    private async generateEmbeddings(texts: string[]): Promise<number[][]> {
        try {
            // Use HuggingFace's sentence transformers
            const embeddings = await Promise.all(
                texts.map(async (text) => {
                    const response = await this.hf.featureExtraction({
                        model: 'sentence-transformers/all-MiniLM-L6-v2',
                        inputs: text,
                    });

                    // Handle different response formats
                    if (Array.isArray(response) && Array.isArray(response[0])) {
                        return response[0] as number[];
                    }
                    return response as number[];
                })
            );

            return embeddings;
        } catch (error) {
            console.error('Error generating embeddings:', error);
            throw new Error('Failed to generate embeddings');
        }
    }

    async createCollection(collectionName: string, documents: string[], metadatas?: object[]) {
        try {
            // Check if collection exists, delete if it does
            try {
                await this.client.deleteCollection({ name: collectionName });
            } catch {
                // Collection doesn't exist, which is fine
            }

            // Create new collection
            const collection = await this.client.createCollection({
                name: collectionName,
            });

            // Generate embeddings for documents
            const embeddings = await this.generateEmbeddings(documents);

            // Create document IDs
            const ids = documents.map((_, index) => `doc_${index}`);

            // Add documents to collection
            await collection.add({
                ids,
                embeddings,
                documents,
                metadatas: metadatas || documents.map(() => ({})),
            });

            return collection;
        } catch (error) {
            console.error('Error creating collection:', error);
            throw new Error('Failed to create vector collection');
        }
    }

    async queryCollection(collectionName: string, queryText: string, nResults: number = 5) {
        try {
            const collection = await this.client.getCollection({ name: collectionName });

            // Generate embedding for query
            const queryEmbedding = await this.generateEmbeddings([queryText]);

            // Query the collection
            const results = await collection.query({
                queryEmbeddings: queryEmbedding,
                nResults,
            });

            return {
                documents: results.documents?.[0] || [],
                distances: results.distances?.[0] || [],
                metadatas: results.metadatas?.[0] || [],
            };
        } catch (error) {
            console.error('Error querying collection:', error);
            throw new Error('Failed to query vector collection');
        }
    }

    async deleteCollection(collectionName: string) {
        try {
            await this.client.deleteCollection({ name: collectionName });
        } catch (error) {
            console.error('Error deleting collection:', error);
        }
    }
}

export const vectorStore = new VectorStoreService();
