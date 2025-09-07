
// components/chat/ChatHistory.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, FileText, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ChatSession {
    _id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    messages: Array<{
        role: string;
        content: string;
        timestamp: string;
    }>;
    documentIds: Array<{
        _id: string;
        originalName: string;
    }>;
}

interface ChatHistoryProps {
    currentSessionId?: string;
    onSessionSelect: (sessionId: string) => void;
    onNewChat: () => void;
}

export function ChatHistory({ currentSessionId, onSessionSelect, onNewChat }: ChatHistoryProps) {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchSessions = async () => {
        try {
            const response = await fetch('/api/chat');
            if (response.ok) {
                const data = await response.json();
                setSessions(data.sessions);
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'Today';
        if (diffDays === 2) return 'Yesterday';
        if (diffDays <= 7) return `${diffDays - 1} days ago`;

        return date.toLocaleDateString();
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <MessageCircle className="h-5 w-5" />
                        <span>Chat History</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                        <MessageCircle className="h-5 w-5" />
                        <span>Chat History</span>
                    </CardTitle>
                    <Button onClick={onNewChat} size="sm">
                        New Chat
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {sessions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No chat history yet</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {sessions.map((session) => (
                            <div
                                key={session._id}
                                className={`
                  p-3 rounded-lg border cursor-pointer transition-colors
                  ${currentSessionId === session._id
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    }
                `}
                                onClick={() => onSessionSelect(session._id)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate" title={session.title}>
                                            {session.title}
                                        </p>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <Calendar className="h-3 w-3 text-gray-400" />
                                            <span className="text-xs text-gray-500">
                                                {formatDate(session.updatedAt)}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <FileText className="h-3 w-3 text-gray-400" />
                                            <span className="text-xs text-gray-500">
                                                {session.documentIds.length} document{session.documentIds.length !== 1 ? 's' : ''}
                                            </span>
                                            <span className="text-xs text-gray-400">•</span>
                                            <span className="text-xs text-gray-500">
                                                {session.messages.length} message{session.messages.length !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}