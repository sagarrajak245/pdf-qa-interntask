// src/components/documents/DocumentUpload.tsx

'use client'; 

import { Card, CardContent } from '@/components/ui/card';
import { useDocuments } from '@/hooks/useDocuments';
import { Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';

export function DocumentUpload() {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadDocument } = useDocuments();

  // --- REVISED FUNCTION ---
  const handleFiles = async (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      if (file.type !== 'application/pdf') {
        toast.error(`${file.name} is not a PDF file`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);

    // Create an array of upload promises
    const uploadPromises = validFiles.map(file => 
      uploadDocument(file)
        .then(() => toast.success(`${file.name} uploaded successfully`))
        .catch(error => toast.error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`))
    );

    try {
      // Wait for all uploads to complete in parallel
      await Promise.all(uploadPromises);
    } finally {
      // Reset the input so the same file can be uploaded again
      if (inputRef.current) {
        inputRef.current.value = '';
      }
      setUploading(false);
    }
  };
  // --- END REVISED FUNCTION ---

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }
            ${uploading ? 'pointer-events-none opacity-50' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
          />

          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />

          <div className="space-y-2">
            <p className="text-lg font-medium">
              {uploading ? 'Uploading PDFs...' : 'Upload PDF Documents'}
            </p>
            <p className="text-sm text-gray-500">
              Drag and drop your PDF files here, or{' '}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-blue-600 hover:text-blue-700 font-medium"
                disabled={uploading}
              >
                browse
              </button>
            </p>
            <p className="text-xs text-gray-400">
              Maximum file size: 10MB per file
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}