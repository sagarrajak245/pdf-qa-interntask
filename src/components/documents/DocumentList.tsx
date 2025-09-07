'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDocuments } from '@/hooks/useDocuments';
import { formatBytes, formatDate } from '@/lib/utils';
import { AlertCircle, Check, Clock, File } from 'lucide-react';

// This interface now matches the one in the useDocuments hook.
interface Document {
  _id: string;
  originalName: string;
  fileSize: number;
  chunksCount: number;
  status: string; // Changed from the specific union type to string
  createdAt: string;
}

interface DocumentListProps {
  selectedDocuments: string[];
  onDocumentSelect: (documentId: string) => void;
}

export function DocumentList({ selectedDocuments, onDocumentSelect }: DocumentListProps) {
  const { documents, isLoading } = useDocuments();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready':
        return 'Ready';
      case 'processing':
        return 'Processing...';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Loading documents...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Documents ({documents.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="text-center p-8">
            <File className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No documents uploaded yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Upload your first PDF to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc: Document) => (
              <div
                key={doc._id}
                className={`
                  p-4 border rounded-lg cursor-pointer transition-colors
                  ${selectedDocuments.includes(doc._id)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                  ${doc.status !== 'ready' ? 'opacity-60' : ''}
                `}
                onClick={() => doc.status === 'ready' && onDocumentSelect(doc._id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <File className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" title={doc.originalName}>
                        {doc.originalName}
                      </p>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                        <span>{formatBytes(doc.fileSize)}</span>
                        <span>{doc.chunksCount} chunks</span>
                        <span>{formatDate(doc.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 pl-1">
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(doc.status)}
                      <span className="text-xs">{getStatusText(doc.status)}</span>
                    </div>
                    {selectedDocuments.includes(doc._id) && (
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
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
