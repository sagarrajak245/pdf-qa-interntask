/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import { ChatHistory } from '@/components/chat/ChatHistory';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { DocumentList } from '@/components/documents/DocumentList';
import { DocumentUpload } from '@/components/documents/DocumentUpload';
import { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function MainLayout() {
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>();
  const [activeTab, setActiveTab] = useState<'upload' | 'documents' | 'history'>('upload');

  const handleDocumentSelect = (documentId: string) => {
    setSelectedDocuments(prev => {
      if (prev.includes(documentId)) {
        return prev.filter(id => id !== documentId);
      } else {
        return [...prev, documentId];
      }
    });
  };

  const handleSessionSelect = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const handleNewChat = () => {
    setCurrentSessionId(undefined);
  };

  const handleSessionUpdate = (sessionId: string, title: string) => {
    setCurrentSessionId(sessionId);
    // Optionally refresh chat history here
  };

  return (
    <div className="h-screen flex flex-col">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar>
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-4">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-2 text-sm rounded-md ${activeTab === 'upload'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400'
                }`}
            >
              Upload
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-3 py-2 text-sm rounded-md ${activeTab === 'documents'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400'
                }`}
            >
              Documents
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-2 text-sm rounded-md ${activeTab === 'history'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400'
                }`}
            >
              History
            </button>
          </div>

          {/* Tab Content */}
          <div className="space-y-4">
            {activeTab === 'upload' && <DocumentUpload />}

            {activeTab === 'documents' && (
              <DocumentList
                selectedDocuments={selectedDocuments}
                onDocumentSelect={handleDocumentSelect}
              />
            )}

            {activeTab === 'history' && (
              <ChatHistory
                currentSessionId={currentSessionId}
                onSessionSelect={handleSessionSelect}
                onNewChat={handleNewChat}
              />
            )}
          </div>

          {/* Selected Documents Count */}
          {selectedDocuments.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected for chat
              </p>
            </div>
          )}
        </Sidebar>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-800">
          <ChatInterface
            selectedDocuments={selectedDocuments}
            currentSessionId={currentSessionId}
            onSessionUpdate={handleSessionUpdate}
          />
        </div>
      </div>
    </div>
  );
}
