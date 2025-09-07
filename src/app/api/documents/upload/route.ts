// app/api/documents/upload/route.ts
import { getUserFromRequest } from '@/lib/auth';
import { Document } from '@/lib/models/Document';
import connectDB from '@/lib/mongodb';
import { PDFProcessor } from '@/lib/services/pdfProcessor';
import { vectorStore } from '@/lib/services/vectorStore';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        // Check authentication
        const userId = await getUserFromRequest(request);
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        if (file.type !== 'application/pdf') {
            return NextResponse.json(
                { error: 'Only PDF files are allowed' },
                { status: 400 }
            );
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'File size must be less than 10MB' },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // Create document record
        const document = await Document.create({
            userId,
            filename: `${userId}_${Date.now()}_${file.name}`,
            originalName: file.name,
            fileSize: file.size,
            vectorStoreId: '', // Will be updated after processing
            chunksCount: 0,
            status: 'processing',
        });

        try {
            // Process PDF
            const processor = new PDFProcessor();
            const processed = await processor.processPDF(buffer);

            // Create vector store collection
            const collectionName = `doc_${document._id}`;

            await vectorStore.createCollection(
                collectionName,
                processed.chunks,
                processed.chunks.map((chunk, index) => ({
                    documentId: document._id.toString(),
                    chunkIndex: index,
                    pageInfo: processed.metadata,
                }))
            );

            // Update document record
            await Document.findByIdAndUpdate(document._id, {
                vectorStoreId: collectionName,
                chunksCount: processed.chunks.length,
                status: 'ready',
            });

            return NextResponse.json({
                message: 'Document uploaded and processed successfully',
                document: {
                    id: document._id,
                    originalName: document.originalName,
                    chunksCount: processed.chunks.length,
                    metadata: processed.metadata,
                },
            });
        } catch (processingError) {
            // Update document status to error
            await Document.findByIdAndUpdate(document._id, {
                status: 'error',
            });

            throw processingError;
        }
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Failed to process document' },
            { status: 500 }
        );
    }
}

// Get user documents
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const userId = await getUserFromRequest(request);
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const documents = await Document.find({ userId })
            .select('-__v')
            .sort({ createdAt: -1 });

        return NextResponse.json({ documents });
    } catch (error) {
        console.error('Get documents error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch documents' },
            { status: 500 }
        );
    }
}  