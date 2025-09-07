/* eslint-disable prefer-const */

// app/api/chat/route.ts
import { getUserFromRequest } from '@/lib/auth';
import { ChatSession } from '@/lib/models/ChatSession';
import { Document } from '@/lib/models/Document';
import connectDB from '@/lib/mongodb';
import { groqService } from '@/lib/services/groqService';
import { vectorStore } from '@/lib/services/vectorStore';
import { NextRequest, NextResponse } from 'next/server';

// Define a clear type for our chat messages
interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

// Define a type for the incoming request body to ensure type safety
interface ChatRequestBody {
    question?: string | null;
    documentIds: string[];
    sessionId?: string;
}

export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const userId = await getUserFromRequest(request);
        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { question, documentIds, sessionId }: ChatRequestBody = await request.json();

        if (!question) {
            return NextResponse.json(
                { error: 'Question is required' },
                { status: 400 }
            );
        }

        if (!documentIds || documentIds.length === 0) {
            return NextResponse.json(
                { error: 'At least one document must be selected' },
                { status: 400 }
            );
        }

        // Verify user owns the documents
        const documents = await Document.find({
            _id: { $in: documentIds },
            userId,
            status: 'ready',
        });

        if (documents.length !== documentIds.length) {
            return NextResponse.json(
                { error: 'Some documents not found or not ready' },
                { status: 400 }
            );
        }

        // Query vector stores for relevant context
        let allContexts: string[] = [];

        for (const document of documents) {
            if (!document.vectorStoreId) continue; // Ensure vectorStoreId exists
            try {
                const results = await vectorStore.queryCollection(
                    document.vectorStoreId,
                    question,
                    3 // Get top 3 most relevant chunks per document
                );

                // Filter out any potential null values from the documents array before pushing
                const validDocuments = (results.documents || []).filter((doc): doc is string => doc !== null);
                allContexts.push(...validDocuments);
            } catch (error) {
                console.error(`Error querying document ${document._id}:`, error);
            }
        }

        if (allContexts.length === 0) {
            return NextResponse.json(
                { error: 'No relevant content found in the documents' },
                { status: 404 }
            );
        }

        // Get or create chat session
        let chatSession;
        if (sessionId) {
            chatSession = await ChatSession.findOne({
                _id: sessionId,
                userId,
            });
        }

        if (!chatSession) {
            // The check for `!question` at the top now correctly narrows its type to `string`.
            const title = await groqService.generateTitle(question);
            chatSession = await ChatSession.create({
                userId,
                documentIds,
                title,
                messages: [],
            });
        }

        // Get chat history
        const chatHistory = chatSession.messages.map((msg: ChatMessage) => ({
            role: msg.role,
            content: msg.content,
        }));

        // Generate response using Groq
        const context = allContexts.join('\n\n---\n\n');
        const response = await groqService.generateResponse(question, context, chatHistory);

        // Save messages to chat session
        chatSession.messages.push(
            { role: 'user', content: question },
            { role: 'assistant', content: response }
        );

        await chatSession.save();

        return NextResponse.json({
            response,
            sessionId: chatSession._id,
            sessionTitle: chatSession.title,
        });
    } catch (error) {
        console.error('Chat error:', error);
        return NextResponse.json(
            { error: 'Failed to process chat request' },
            { status: 500 }
        );
    }
}

// Get chat sessions
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

        const sessions = await ChatSession.find({ userId })
            .populate('documentIds', 'originalName')
            .select('title createdAt updatedAt messages documentIds')
            .sort({ updatedAt: -1 });

        return NextResponse.json({ sessions });
    } catch (error) {
        console.error('Get sessions error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch chat sessions' },
            { status: 500 }
        );
    }
}

