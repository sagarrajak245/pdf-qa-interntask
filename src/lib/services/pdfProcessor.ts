// lib/services/pdfProcessor.ts
import pdf from 'pdf-parse';

export interface ProcessedDocument {
    chunks: string[];
    metadata: {
        totalPages: number;
        totalWords: number;
        title?: string;
    };
}

export class PDFProcessor {
    private chunkSize: number = 1000;
    private chunkOverlap: number = 100;

    constructor(chunkSize?: number, chunkOverlap?: number) {
        if (chunkSize) this.chunkSize = chunkSize;
        if (chunkOverlap) this.chunkOverlap = chunkOverlap;
    }

    async processPDF(buffer: Buffer): Promise<ProcessedDocument> {
        try {
            // Parse PDF
            const data = await pdf(buffer);
            const text = data.text;

            if (!text || text.trim().length === 0) {
                throw new Error('No text content found in PDF');
            }

            // Split text into chunks
            const chunks = this.splitTextIntoChunks(text);

            return {
                chunks,
                metadata: {
                    totalPages: data.numpages || 1,
                    totalWords: text.split(/\s+/).length,
                    title: data.info?.Title || 'Untitled Document',
                },
            };
        } catch (error) {
            console.error('Error processing PDF:', error);
            throw new Error('Failed to process PDF file');
        }
    }

    private splitTextIntoChunks(text: string): string[] {
        const chunks: string[] = [];
        const sentences = this.splitIntoSentences(text);

        let currentChunk = '';

        for (const sentence of sentences) {
            const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + sentence;

            if (potentialChunk.length <= this.chunkSize) {
                currentChunk = potentialChunk;
            } else {
                if (currentChunk) {
                    chunks.push(currentChunk);

                    // Create overlap with previous chunk
                    const words = currentChunk.split(' ');
                    const overlapWords = words.slice(-Math.floor(this.chunkOverlap / 10));
                    currentChunk = overlapWords.join(' ') + ' ' + sentence;
                } else {
                    // Single sentence is too long, split by character limit
                    chunks.push(sentence.substring(0, this.chunkSize));
                    currentChunk = sentence.substring(this.chunkSize - this.chunkOverlap);
                }
            }
        }

        if (currentChunk) {
            chunks.push(currentChunk);
        }

        return chunks.filter(chunk => chunk.trim().length > 0);
    }

    private splitIntoSentences(text: string): string[] {
        // Clean and normalize text
        const cleanText = text
            .replace(/\s+/g, ' ')
            .replace(/\n+/g, ' ')
            .trim();

        // Split by sentence endings
        const sentences = cleanText
            .split(/(?<=[.!?])\s+/)
            .filter(sentence => sentence.trim().length > 0);

        return sentences;
    }
}