import { useEffect, useState } from 'react';

interface Document {
  _id: string;
  originalName: string;
  fileSize: number;
  chunksCount: number;
  status: string;
  createdAt: string;
}

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents/upload');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const uploadDocument = async (file: File): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const data = await response.json();
    await fetchDocuments(); // Refresh list
    return data.document;
  };

  return {
    documents,
    isLoading,
    uploadDocument,
    refetch: fetchDocuments,
  };
}
