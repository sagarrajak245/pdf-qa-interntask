/* eslint-disable @typescript-eslint/no-explicit-any */

// app/api/chat/export/route.ts
import { getUserFromRequest } from '@/lib/auth';
import { ChatSession } from '@/lib/models/ChatSession';
import connectDB from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

// Define a type for the chat messages within the session for type safety
interface SessionMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string | Date;
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

        const { sessionId, format } = await request.json();

        if (!sessionId || !format) {
            return NextResponse.json(
                { error: 'Session ID and format are required' },
                { status: 400 }
            );
        }

        // Get chat session
        const session = await ChatSession.findOne({
            _id: sessionId,
            userId,
        }).populate('documentIds', 'originalName');

        if (!session) {
            return NextResponse.json(
                { error: 'Chat session not found' },
                { status: 404 }
            );
        }

        // Format data based on requested format
        if (format === 'text') {
            let textContent = `Chat Session: ${session.title}\n`;
            textContent += `Date: ${new Date(session.createdAt).toLocaleDateString()}\n`;
            textContent += `Documents: ${session.documentIds.map((doc: any) => doc.originalName).join(', ')}\n\n`;
            textContent += '--- CONVERSATION ---\n\n';

            session.messages.forEach((message: SessionMessage) => {
                const timestamp = new Date(message.timestamp).toLocaleTimeString();
                const role = message.role === 'user' ? 'Question' : 'Answer';
                textContent += `[${timestamp}] ${role}:\n${message.content}\n\n`;
            });

            return new NextResponse(textContent, {
                headers: {
                    'Content-Type': 'text/plain',
                    'Content-Disposition': `attachment; filename="${session.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt"`,
                },
            });
        }

        if (format === 'json') {
            const jsonData = {
                sessionId: session._id,
                title: session.title,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt,
                documents: session.documentIds.map((doc: any) => ({
                    id: doc._id,
                    name: doc.originalName,
                })),
                messages: session.messages,
            };

            return new NextResponse(JSON.stringify(jsonData, null, 2), {
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Disposition': `attachment; filename="${session.title.replace(/[^a-zA-Z0-9]/g, '_')}.json"`,
                },
            });
        }

        return NextResponse.json(
            { error: 'Invalid format. Use "text" or "json"' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json(
            { error: 'Failed to export chat session' },
            { status: 500 }
        );
    }
}
