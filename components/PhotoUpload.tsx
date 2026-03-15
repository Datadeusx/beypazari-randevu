'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { validateImageFile } from '@/lib/storage/setup';
import { formatFileSize } from '@/lib/storage/image-utils';

interface PhotoUploadProps {
  salonId: string;
  onUploadSuccess?: () => void;
  onUploadError?: (error: string) => void;
}

interface FilePreview {
  file: File;
  preview: string;
  uploading: boolean;
  progress: number;
  error?: string;
}

export default function PhotoUpload({
  salonId,
  onUploadSuccess,
  onUploadError,
}: PhotoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [globalError, setGlobalError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  };

  const handleFiles = (newFiles: File[]) => {
    setGlobalError('');

    const validFiles: FilePreview[] = [];

    for (const file of newFiles) {
      const validation = validateImageFile(file);

      if (!validation.valid) {
        setGlobalError(validation.error || 'Geçersiz dosya');
        continue;
      }

      validFiles.push({
        file,
        preview: URL.createObjectURL(file),
        uploading: false,
        progress: 0,
      });
    }

    setFiles((prev) => [...prev, ...validFiles]);
  };

  const handleUpload = async (index: number) => {
    const filePreview = files[index];
    if (!filePreview || filePreview.uploading) return;

    // Update status to uploading
    setFiles((prev) =>
      prev.map((f, i) =>
        i === index ? { ...f, uploading: true, progress: 0, error: undefined } : f
      )
    );

    try {
      const formData = new FormData();
      formData.append('file', filePreview.file);
      formData.append('salon_id', salonId);

      const response = await fetch('/api/upload-photo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Remove uploaded file from preview list
      setFiles((prev) => prev.filter((_, i) => i !== index));

      // Clean up preview URL
      URL.revokeObjectURL(filePreview.preview);

      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Yükleme başarısız';

      setFiles((prev) =>
        prev.map((f, i) =>
          i === index
            ? { ...f, uploading: false, progress: 0, error: errorMessage }
            : f
        )
      );

      if (onUploadError) {
        onUploadError(errorMessage);
      }
    }
  };

  const handleUploadAll = async () => {
    for (let i = 0; i < files.length; i++) {
      await handleUpload(i);
    }
  };

  const removeFile = (index: number) => {
    const filePreview = files[index];
    URL.revokeObjectURL(filePreview.preview);
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Drag and Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
        style={{
          border: isDragging ? '2px solid #111827' : '2px dashed #d1d5db',
          borderRadius: 20,
          padding: 40,
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragging ? '#f9fafb' : '#ffffff',
          transition: 'all 0.2s',
          marginBottom: 24,
        }}
      >
        <svg
          style={{
            width: 48,
            height: 48,
            margin: '0 auto 16px',
            color: '#9ca3af',
          }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>

        <h3
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 700,
            color: '#111827',
            marginBottom: 8,
          }}
        >
          Fotoğraf Yükle
        </h3>

        <p
          style={{
            margin: 0,
            color: '#6b7280',
            fontSize: 14,
            marginBottom: 12,
          }}
        >
          Fotoğrafları sürükleyip bırakın veya seçmek için tıklayın
        </p>

        <p
          style={{
            margin: 0,
            color: '#9ca3af',
            fontSize: 13,
          }}
        >
          JPG, PNG veya WebP • Maksimum 5MB
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {/* Global Error */}
      {globalError && (
        <div
          style={{
            border: '1px solid #fecaca',
            background: '#fef2f2',
            color: '#b91c1c',
            borderRadius: 16,
            padding: '14px 16px',
            marginBottom: 16,
          }}
        >
          {globalError}
        </div>
      )}

      {/* File Preview Grid */}
      {files.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              Seçilen Fotoğraflar ({files.length})
            </h4>

            <button
              onClick={handleUploadAll}
              disabled={files.some((f) => f.uploading)}
              style={{
                padding: '10px 20px',
                borderRadius: 12,
                border: 'none',
                background: '#111827',
                color: '#ffffff',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Tümünü Yükle
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16,
            }}
          >
            {files.map((filePreview, index) => (
              <div
                key={index}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 16,
                  overflow: 'hidden',
                  background: '#ffffff',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    paddingTop: '100%',
                    background: '#f3f4f6',
                  }}
                >
                  <img
                    src={filePreview.preview}
                    alt="Preview"
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />

                  {!filePreview.uploading && !filePreview.error && (
                    <button
                      onClick={() => removeFile(index)}
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        width: 28,
                        height: 28,
                        borderRadius: 999,
                        border: 'none',
                        background: 'rgba(0,0,0,0.6)',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>

                <div style={{ padding: 12 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#111827',
                      marginBottom: 4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {filePreview.file.name}
                  </div>

                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>
                    {formatFileSize(filePreview.file.size)}
                  </div>

                  {filePreview.error && (
                    <div
                      style={{
                        fontSize: 12,
                        color: '#b91c1c',
                        marginBottom: 8,
                      }}
                    >
                      {filePreview.error}
                    </div>
                  )}

                  {filePreview.uploading ? (
                    <div
                      style={{
                        fontSize: 12,
                        color: '#6b7280',
                        fontWeight: 600,
                      }}
                    >
                      Yükleniyor...
                    </div>
                  ) : filePreview.error ? (
                    <button
                      onClick={() => handleUpload(index)}
                      style={{
                        width: '100%',
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: '1px solid #b91c1c',
                        background: '#ffffff',
                        color: '#b91c1c',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Tekrar Dene
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpload(index)}
                      style={{
                        width: '100%',
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: 'none',
                        background: '#111827',
                        color: '#ffffff',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Yükle
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
