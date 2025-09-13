/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
// components/chat/ChatInterface.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Download, Send, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface ChatInterfaceProps {
    selectedDocuments: string[];
    currentSessionId?: string;
    onSessionUpdate?: (sessionId: string, title: string) => void;
}

export function ChatInterface({
    selectedDocuments,
    currentSessionId,
    onSessionUpdate
}: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | undefined>(currentSessionId);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (currentSessionId !== sessionId) {
            setMessages([]);
            setSessionId(currentSessionId);
        }
    }, [currentSessionId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!input.trim() || isLoading) return;

        if (selectedDocuments.length === 0) {
            toast.error('Please select at least one document');
            return;
        }

        const userMessage: Message = {
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: userMessage.content,
                    documentIds: selectedDocuments,
                    sessionId: sessionId,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to get response');
            }

            const data = await response.json();

            const assistantMessage: Message = {
                role: 'assistant',
                content: data.response,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);

            // Update session info
            if (data.sessionId && data.sessionId !== sessionId) {
                setSessionId(data.sessionId);
                onSessionUpdate?.(data.sessionId, data.sessionTitle);
            }

        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to send message');

            // Remove the user message on error
            setMessages(prev => prev.slice(0, -1));
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const exportChat = async (format: 'text' | 'json') => {
        if (!sessionId) {
            toast.error('No chat session to export');
            return;
        }

        try {
            const response = await fetch('/api/chat/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, format }),
            });

            if (!response.ok) {
                throw new Error('Export failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `chat_export.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            toast.success(`Chat exported as ${format.toUpperCase()}`);
        } catch (error) {
            toast.error('Failed to export chat');
        }
    };

    return (
        <div className="h-full w-full flex flex-col bg-white dark:bg-gray-800">
            {/* Fixed Chat Header */}
            <div className="flex-shrink-0 border-b bg-white dark:bg-gray-900">
                <div className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Chat</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected
                            </p>
                        </div>
                        {messages.length > 0 && sessionId && (
                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => exportChat('text')}
                                >
                                    <Download className="h-4 w-4 mr-1" />
                                    TXT
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => exportChat('json')}
                                >
                                    <Download className="h-4 w-4 mr-1" />
                                    JSON
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-800">
                <div className="h-full overflow-y-auto">
                    <div className="p-4">
                        {messages.length === 0 ? (
                            <div className="h-full flex items-center justify-center min-h-[400px]">
                                <div className="text-center text-gray-500 dark:text-gray-400">
                                    <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg mb-2">Start a conversation about your documents</p>
                                    <p className="text-sm">Ask questions and I will help you find answers!</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6 pb-4">
                                {messages.map((message, index) => (
                                    <div key={`${message.role}-${index}-${message.timestamp.getTime()}`} className="flex space-x-4">
                                        <div className={`
                                            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                                            ${message.role === 'user'
                                                ? 'bg-blue-100 dark:bg-blue-900'
                                                : 'bg-gray-200 dark:bg-gray-700'
                                            }
                                        `}>
                                            {message.role === 'user' ? (
                                                <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            ) : (
                                                <Bot className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`
                                                rounded-lg p-4 max-w-none
                                                ${message.role === 'user'
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100'
                                                }
                                            `}>
                                                <div className="prose prose-sm max-w-none">
                                                    <p className="whitespace-pre-wrap break-words m-0">{message.content}</p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-2 ml-1">
                                                {message.timestamp.toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="flex space-x-4">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                            <Bot className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                                <div className="flex space-x-2">
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} className="h-4" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Fixed Input Form */}
            <div className="flex-shrink-0 border-t bg-white dark:bg-gray-900">
                <div className="p-4">
                    <form onSubmit={handleSubmit} className="flex gap-3">
                        <div className="flex-1">
                            <Textarea
                                ref={textareaRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={
                                    selectedDocuments.length === 0
                                        ? "Select documents first..."
                                        : "Ask a question about your documents..."
                                }
                                disabled={isLoading || selectedDocuments.length === 0}
                                className="min-h-[48px] max-h-32 resize-none"
                                rows={1}
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={!input.trim() || isLoading || selectedDocuments.length === 0}
                            className="h-12 px-4 self-end"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}      