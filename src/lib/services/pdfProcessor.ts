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
            // Try primary method with pdf-parse
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
            console.error('pdf-parse failed, attempting raw extraction:', error);

            // Fallback to raw extraction - no external libraries
            return this.rawPDFExtraction(buffer);
        }
    }

    /**
     * Raw PDF text extraction without external libraries
     * This method directly parses the PDF binary structure
     */
    private rawPDFExtraction(buffer: Buffer): ProcessedDocument {
        try {
            console.log('Starting raw PDF extraction...');

            // Convert buffer to string for text extraction
            const pdfString = buffer.toString('latin1');
            let extractedText = '';

            // Method 1: Extract text from PDF text objects (most reliable)
            extractedText = this.extractFromTextObjects(pdfString);

            // Method 2: If no text found, try stream extraction
            if (!extractedText.trim()) {
                extractedText = this.extractFromStreams(pdfString);
            }

            // Method 3: If still no text, try parenthetical extraction
            if (!extractedText.trim()) {
                extractedText = this.extractFromParentheses(pdfString);
            }

            // Method 4: Last resort - extract any readable strings
            if (!extractedText.trim()) {
                extractedText = this.extractReadableText(pdfString);
            }

            if (!extractedText.trim()) {
                throw new Error('No readable text found in PDF');
            }

            // Clean the extracted text
            const cleanedText = this.cleanExtractedText(extractedText);

            // Split into chunks
            const chunks = this.splitTextIntoChunks(cleanedText);

            if (chunks.length === 0) {
                // If no chunks created, create at least one chunk with available text
                chunks.push(cleanedText.substring(0, this.chunkSize));
            }

            return {
                chunks,
                metadata: {
                    totalPages: this.estimatePageCount(pdfString),
                    totalWords: cleanedText.split(/\s+/).filter(w => w.length > 0).length,
                    title: this.extractTitle(pdfString) || 'PDF Document (Raw Extraction)',
                },
            };

        } catch (error) {
            console.error('Raw PDF extraction failed:', error);

            // Final fallback - return error message as chunk
            return {
                chunks: ['Failed to extract text from PDF. The document may be image-based or corrupted.'],
                metadata: {
                    totalPages: 1,
                    totalWords: 0,
                    title: 'Extraction Failed',
                },
            };
        }
    }

    /**
     * Extract text from PDF text objects (Tj, TJ operators)
     */
    private extractFromTextObjects(pdfString: string): string {
        let text = '';

        // Look for text showing operators: Tj, TJ, ', "
        const textPatterns = [
            /\(((?:[^()\\]|\\.)*)?\)\s*Tj/g,
            /\(((?:[^()\\]|\\.)*)?\)\s*'/g,
            /\(((?:[^()\\]|\\.)*)?\)\s*"/g,
            /\[((?:[^\[\]\\]|\\.)*)\]\s*TJ/g,
        ];

        for (const pattern of textPatterns) {
            let match;
            while ((match = pattern.exec(pdfString)) !== null) {
                if (match[1]) {
                    const decodedText = this.decodePDFText(match[1]);
                    if (decodedText && decodedText.trim()) {
                        text += decodedText + ' ';
                    }
                }
            }
        }

        return text;
    }

    /**
     * Extract text from PDF streams
     */
    private extractFromStreams(pdfString: string): string {
        let text = '';

        // Find content streams between 'stream' and 'endstream'
        const streamPattern = /stream\s*([\s\S]*?)\s*endstream/g;
        let match;

        while ((match = streamPattern.exec(pdfString)) !== null) {
            const streamContent = match[1];

            // Look for text operations in the stream
            const textInStream = this.extractTextFromStreamContent(streamContent);
            if (textInStream.trim()) {
                text += textInStream + ' ';
            }
        }

        return text;
    }

    /**
     * Extract text from stream content
     */
    private extractTextFromStreamContent(streamContent: string): string {
        let text = '';

        // Look for BT...ET blocks (text blocks)
        const textBlocks = streamContent.match(/BT([\s\S]*?)ET/g);

        if (textBlocks) {
            for (const block of textBlocks) {
                // Extract text from within parentheses
                const textMatches = block.match(/\(([^)]*)\)/g);
                if (textMatches) {
                    for (const textMatch of textMatches) {
                        const cleanText = textMatch.replace(/[()]/g, '');
                        if (cleanText.trim()) {
                            text += this.decodePDFText(cleanText) + ' ';
                        }
                    }
                }
            }
        }

        return text;
    }

    /**
     * Extract text from parentheses (common PDF text format)
     */
    private extractFromParentheses(pdfString: string): string {
        const textMatches = pdfString.match(/\(([^)]+)\)/g) || [];

        return textMatches
            .map(match => {
                const text = match.replace(/[()]/g, '');
                return this.decodePDFText(text);
            })
            .filter(text => text && text.length > 1 && /[a-zA-Z]/.test(text))
            .join(' ');
    }

    /**
     * Extract any readable text (last resort)
     */
    private extractReadableText(pdfString: string): string {
        // Extract sequences of printable ASCII characters
        const readableStrings = pdfString.match(/[a-zA-Z0-9\s.,!?;:'"()-]{4,}/g) || [];

        return readableStrings
            .filter(str => {
                // Filter out strings that are likely not actual text content
                const cleanStr = str.trim();
                return cleanStr.length > 3 &&
                    /[a-zA-Z]/.test(cleanStr) &&
                    !cleanStr.match(/^[0-9\s.,-]+$/) &&
                    !cleanStr.includes('obj') &&
                    !cleanStr.includes('endobj');
            })
            .join(' ');
    }

    /**
     * Decode PDF text (handle escape sequences and encoding)
     */
    private decodePDFText(text: string): string {
        return text
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\b/g, '\b')
            .replace(/\\f/g, '\f')
            .replace(/\\([\(\)\\])/g, '$1')
            .replace(/\\([0-7]{3})/g, (match, octal) => {
                return String.fromCharCode(parseInt(octal, 8));
            })
            .trim();
    }

    /**
     * Estimate page count from PDF structure
     */
    private estimatePageCount(pdfString: string): number {
        // Count page objects
        const pageMatches = pdfString.match(/\/Type\s*\/Page(?![a-zA-Z])/g);
        const pageCount = pageMatches ? pageMatches.length : 1;

        // Also check for Kids arrays (page tree structure)
        const kidsMatches = pdfString.match(/\/Kids\s*\[/g);
        const kidsCount = kidsMatches ? kidsMatches.length : 0;

        return Math.max(pageCount, kidsCount, 1);
    }

    /**
     * Try to extract document title from PDF metadata
     */
    private extractTitle(pdfString: string): string | null {
        // Look for title in document info dictionary
        const titleMatch = pdfString.match(/\/Title\s*\(([^)]*)\)/);
        if (titleMatch && titleMatch[1]) {
            return this.decodePDFText(titleMatch[1]);
        }

        // Look for title in metadata stream
        const metadataMatch = pdfString.match(/<dc:title[^>]*>([^<]*)<\/dc:title>/i);
        if (metadataMatch && metadataMatch[1]) {
            return metadataMatch[1].trim();
        }

        return null;
    }

    /**
     * Clean extracted text
     */
    private cleanExtractedText(text: string): string {
        return text
            // Normalize line breaks
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            // Remove excessive whitespace
            .replace(/\n{3,}/g, '\n\n')
            .replace(/[ \t]+/g, ' ')
            .replace(/\n[ \t]+/g, '\n')
            .replace(/[ \t]+\n/g, '\n')
            // Remove non-printable characters except newlines and tabs
            .replace(/[^\x20-\x7E\n\t]/g, '')
            // Remove PDF artifacts
            .replace(/\s*(endobj|obj|\d+\s+\d+\s+obj)\s*/g, ' ')
            .replace(/\s*(stream|endstream)\s*/g, ' ')
            .trim();
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