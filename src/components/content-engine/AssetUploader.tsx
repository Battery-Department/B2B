'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Image, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}

interface AssetUploaderProps {
  category?: string;
  tags?: string;
  onUploadComplete?: (assets: any[]) => void;
  maxFiles?: number;
}

export function AssetUploader({ 
  category = 'general', 
  tags = '', 
  onUploadComplete,
  maxFiles = 10 
}: AssetUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createFileObject = (file: File): UploadFile => ({
    id: Math.random().toString(36).substr(2, 9),
    file,
    progress: 0,
    status: 'pending',
  });

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles = Array.from(selectedFiles)
      .slice(0, maxFiles - files.length)
      .map(createFileObject);

    setFiles(prev => [...prev, ...newFiles]);
  }, [files.length, maxFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  }, []);

  const uploadFile = async (uploadFile: UploadFile): Promise<void> => {
    try {
      // Update status to uploading
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'uploading' as const } : f
      ));

      const formData = new FormData();
      formData.append('files', uploadFile.file);
      formData.append('category', category);
      formData.append('tags', tags);

      // Simulate progress (since we can't track real progress with FormData)
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => {
          if (f.id === uploadFile.id && f.progress < 90) {
            return { ...f, progress: f.progress + Math.random() * 20 };
          }
          return f;
        }));
      }, 200);

      const response = await fetch('/api/assets/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      if (result.success && result.uploaded.length > 0) {
        const uploadedAsset = result.uploaded[0];
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { 
                ...f, 
                status: 'completed' as const, 
                progress: 100,
                url: uploadedAsset.url 
              } 
            : f
        ));
      } else {
        throw new Error(result.errors?.[0] || 'Upload failed');
      }

    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { 
              ...f, 
              status: 'error' as const, 
              error: error instanceof Error ? error.message : 'Upload failed' 
            } 
          : f
      ));
    }
  };

  const uploadAllFiles = async () => {
    setIsUploading(true);
    
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    // Upload files in batches of 3 for better performance
    const batchSize = 3;
    const batches = [];
    for (let i = 0; i < pendingFiles.length; i += batchSize) {
      batches.push(pendingFiles.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      await Promise.all(batch.map(uploadFile));
    }

    setIsUploading(false);

    // Call completion callback
    const completedAssets = files
      .filter(f => f.status === 'completed')
      .map(f => ({ id: f.id, url: f.url, filename: f.file.name }));
    
    if (onUploadComplete && completedAssets.length > 0) {
      onUploadComplete(completedAssets);
    }
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Image className="h-4 w-4 text-gray-400" />;
    }
  };

  const canUpload = files.some(f => f.status === 'pending') && !isUploading;
  const hasCompleted = files.some(f => f.status === 'completed');

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Baseline Assets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
            ${isDragOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            Drop files here or click to browse
          </p>
          <p className="text-sm text-gray-500">
            Support for JPEG, PNG, WebP files up to 10MB each
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Maximum {maxFiles} files
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Selected Files ({files.length})</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  {getStatusIcon(file.status)}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {file.status === 'error' && (
                      <p className="text-xs text-red-500">{file.error}</p>
                    )}
                  </div>

                  {/* Progress bar for uploading files */}
                  {file.status === 'uploading' && (
                    <div className="w-20">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Remove button */}
                  {file.status !== 'uploading' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Actions */}
        <div className="flex gap-2">
          <Button
            onClick={uploadAllFiles}
            disabled={!canUpload}
            className="flex-1"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload {files.filter(f => f.status === 'pending').length} Files
              </>
            )}
          </Button>

          {hasCompleted && (
            <Button
              variant="outline"
              onClick={() => setFiles([])}
            >
              Clear All
            </Button>
          )}
        </div>

        {/* Upload Summary */}
        {files.length > 0 && (
          <div className="text-xs text-gray-500 pt-2 border-t">
            Status: {files.filter(f => f.status === 'completed').length} completed, {' '}
            {files.filter(f => f.status === 'error').length} failed, {' '}
            {files.filter(f => f.status === 'pending').length} pending
          </div>
        )}
      </CardContent>
    </Card>
  );
}