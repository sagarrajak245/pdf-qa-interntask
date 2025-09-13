/* eslint-disable @typescript-eslint/no-explicit-any */
// import { InferenceClient } from '@huggingface/inference';
// import { ChromaClient } from 'chromadb';

// class VectorStoreService {
//     private client: ChromaClient;
//     private hf: InferenceClient;

//     constructor() {
//         // Configure ChromaDB client with proper host
//         this.client = new ChromaClient({
//             path: process.env.CHROMA_URL || "http://localhost:8000"
//             url: process.env.UPSTASH_VECTOR_REST_URL,
//           token: process.env.UPSTASH_VECTOR_REST_TOKEN,
//         });
//         this.hf = new InferenceClient(process.env.HUGGINGFACE_API_KEY);
//     }

//     private async generateEmbeddings(texts: string[]): Promise<number[][]> {
//         try {
//             // Use HuggingFace's sentence transformers with rate limiting
//             const embeddings: number[][] = [];

//             for (let i = 0; i < texts.length; i++) {
//                 try {
//                     // Add delay to avoid rate limiting (150ms between requests)
//                     if (i > 0) {
//                         await new Promise(resolve => setTimeout(resolve, 150));
//                     }

//                     console.log(`Generating embedding for chunk ${i + 1}/${texts.length}`);

//                     const response = await this.hf.featureExtraction({
//                         model: 'sentence-transformers/all-MiniLM-L6-v2',
//                         inputs: texts[i],
//                     });

//                     // Handle different response formats
//                     let embedding: number[];
//                     if (Array.isArray(response) && Array.isArray(response[0])) {
//                         embedding = response[0] as number[];
//                     } else {
//                         embedding = response as number[];
//                     }

//                     embeddings.push(embedding);

//                 } catch (chunkError) {
//                     console.error(`Error embedding chunk ${i + 1}:`, chunkError);
//                     // Continue with other chunks instead of failing completely
//                     embeddings.push([] as number[]); // Push empty array as placeholder
//                 }
//             }

//             return embeddings;
//         } catch (error) {
//             console.error('Error generating embeddings:', error);
//             throw new Error('Failed to generate embeddings');
//         }
//     }

//     // Add connection health check (simplified for in-memory)
//     async healthCheck(): Promise<boolean> {
//         try {
//             // For in-memory, we can just check if client exists
//             return !!this.client;
//         } catch (error) {
//             console.error('ChromaDB health check failed:', error);
//             return false;
//         }
//     }

//     async createCollection(collectionName: string, documents: string[], metadatas?: object[]) {
//         try {
//             console.log(`Starting collection creation for: ${collectionName}`);

//             // Check ChromaDB connection first
//             const isHealthy = await this.healthCheck();
//             if (!isHealthy) {
//                 throw new Error('ChromaDB server is not accessible');
//             }

//             // Check if collection exists, delete if it does
//             try {
//                 await this.client.deleteCollection({ name: collectionName });
//                 console.log(`Deleted existing collection: ${collectionName}`);
//             } catch {
//                 // Collection doesn't exist, which is fine
//                 console.log(`Creating new collection: ${collectionName}`);
//             }

//             // Create new collection
//             const collection = await this.client.createCollection({
//                 name: collectionName,
//             });
//             console.log(`Collection created: ${collectionName}`);

//             // Generate embeddings for documents with progress tracking
//             console.log(`Generating embeddings for ${documents.length} chunks...`);
//             const embeddings = await this.generateEmbeddings(documents);
//             console.log('Embeddings generated successfully');

//             // Create document IDs
//             const ids = documents.map((_, index) => `doc_${index}`);

//             // Filter out any failed embeddings
//             const validEmbeddings = embeddings.filter(embedding => embedding.length > 0);
//             const validDocuments = documents.filter((_, index) => embeddings[index].length > 0);
//             const validMetadatas = metadatas ? metadatas.filter((_, index) => embeddings[index].length > 0) : [];
//             const validIds = ids.filter((_, index) => embeddings[index].length > 0);

//             if (validEmbeddings.length === 0) {
//                 throw new Error('No valid embeddings were generated');
//             }

//             console.log(`Adding ${validDocuments.length} documents to collection...`);

//             // Add documents to collection
//             await collection.add({
//                 ids: validIds,
//                 embeddings: validEmbeddings,
//                 documents: validDocuments,
//                 metadatas: validMetadatas.length > 0 ? validMetadatas : validDocuments.map(() => ({})),
//             });

//             console.log('Documents added to vector store successfully');
//             return collection;
//         } catch (error) {
//             console.error('Error creating collection:', error);
//             throw new Error(`Failed to create vector collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
//         }
//     }

//     async queryCollection(collectionName: string, queryText: string, nResults: number = 5) {
//         try {
//             const collection = await this.client.getCollection({ name: collectionName });

//             // Generate embedding for query
//             const queryEmbedding = await this.generateEmbeddings([queryText]);

//             // Query the collection
//             const results = await collection.query({
//                 queryEmbeddings: queryEmbedding,
//                 nResults,
//             });

//             return {
//                 documents: results.documents?.[0] || [],
//                 distances: results.distances?.[0] || [],
//                 metadatas: results.metadatas?.[0] || [],
//             };
//         } catch (error) {
//             console.error('Error querying collection:', error);
//             throw new Error('Failed to query vector collection');
//         }
//     }

//     async deleteCollection(collectionName: string) {
//         try {  
//             await this.client.deleteCollection({ name: collectionName });
//             console.log(`Collection deleted: ${collectionName}`);  
//         } catch (error) {
//             console.error('Error deleting collection:', error);
//         }
//     }
// }

// export const vectorStore = new VectorStoreService();

// src/lib/services/vectorStore.ts
import { InferenceClient } from '@huggingface/inference';
import { Index } from '@upstash/vector';

// Define a type for our metadata to satisfy the Upstash client's requirements
// This ensures that our metadata object has string keys and can hold any value. 
type DocumentMetadata = {
    documentId: string;
    chunkIndex: number;
    text: string;
    [key: string]: any; // Allows for other properties from pdfProcessor metadata
};

// Define the exact vector type that Upstash expects
type UpstashVector = {
    id: string;
    vector: number[];
    metadata?: DocumentMetadata;
};

class VectorStoreService {
    private client: Index<DocumentMetadata>;
    private hf: InferenceClient;

    constructor() {
        if (!process.env.UPSTASH_VECTOR_REST_URL || !process.env.UPSTASH_VECTOR_REST_TOKEN) {
            throw new Error("Upstash URL or Token is not defined in environment variables.");
        }
        this.client = new Index<DocumentMetadata>({
            url: process.env.UPSTASH_VECTOR_REST_URL,
            token: process.env.UPSTASH_VECTOR_REST_TOKEN,
        });
        this.hf = new InferenceClient(process.env.HUGGINGFACE_API_KEY);
    }

    private async generateEmbeddings(texts: string[]): Promise<number[][]> {
        try {
            const embeddings: number[][] = [];
            for (let i = 0; i < texts.length; i++) {
                if (i > 0) {
                    await new Promise(resolve => setTimeout(resolve, 150));
                }
                const response = await this.hf.featureExtraction({
                    model: 'sentence-transformers/all-MiniLM-L6-v2',
                    inputs: texts[i],
                });
                let embedding: number[];
                if (Array.isArray(response) && Array.isArray(response[0])) {
                    embedding = response[0] as number[];
                } else {
                    embedding = response as number[];
                }
                embeddings.push(embedding);
            }
            return embeddings;
        } catch (error) {
            console.error('Error generating embeddings:', error);
            throw new Error('Failed to generate embeddings');
        }
    }

    async createCollection(collectionName: string, documents: string[], metadatas?: Record<string, any>[]) {
        try {
            console.log(`Starting to process documents for: ${collectionName}`);

            const embeddings = await this.generateEmbeddings(documents);

            // FIXED: Use the correct type and ensure vector is always defined
            const vectors: UpstashVector[] = documents.map((doc, index) => ({
                id: `${collectionName}_${index}`,
                vector: embeddings[index], // This is guaranteed to be number[] from generateEmbeddings
                metadata: {
                    ...(metadatas ? metadatas[index] : {}),
                    text: doc, // Storing the original text chunk in metadata is crucial for retrieval
                    documentId: collectionName,
                    chunkIndex: index,
                }
            }));

            // Upsert vectors in batches to avoid overwhelming the service
            const batchSize = 100;
            for (let i = 0; i < vectors.length; i += batchSize) {
                const batch = vectors.slice(i, i + batchSize);
                await this.client.upsert(batch);
            }

            console.log('Documents added to Upstash Vector successfully');
            return { success: true };

        } catch (error) {
            console.error('Error creating collection in Upstash:', error);
            throw new Error(`Failed to create vector collection: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async queryCollection(collectionName: string, queryText: string, nResults: number = 5) {
        try {
            const queryEmbedding = await this.generateEmbeddings([queryText]);

            const results = await this.client.query({
                vector: queryEmbedding[0],
                topK: nResults,
                includeMetadata: true,
                // Upstash's query doesn't filter by a collection name in the same way Chroma does.
                // We ensure uniqueness by prefixing our vector IDs. If you need strict separation,
                // you would use different Upstash Indexes (databases). For this app, the ID prefix is sufficient.
            });

            // Transform the Upstash response to match the structure your app expects
            const documents = results.map(result => result.metadata?.text || '');
            const distances = results.map(result => 1 - result.score); // Convert similarity score to distance
            const metadatas = results.map(result => result.metadata);

            return {
                documents,
                distances,
                metadatas,
            };
        } catch (error) {
            console.error('Error querying collection:', error);
            throw new Error('Failed to query vector collection');
        }
    }

    async deleteCollection(collectionName: string) {
        try {
            // Note: Upstash doesn't have a "delete collection" API. 
            // Deletion is done by vector ID. A more advanced implementation
            // could fetch all IDs with a given prefix and delete them.
            // For now, this is a placeholder.
            console.log(`Deletion requested for collection: ${collectionName}. Manual cleanup may be required in Upstash console.`);
        } catch (error) {
            console.error('Error deleting collection:', error);
        }
    }
}

export const vectorStore = new VectorStoreService();