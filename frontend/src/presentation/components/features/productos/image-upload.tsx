'use client';

import { useState, useRef } from 'react';
import { ImagePlus, X, Loader2, Camera } from 'lucide-react';
import { api } from '@/infrastructure/api/axios-instance';
import { toast } from 'sonner';

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  className?: string;
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imagenes');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede pesar mas de 5MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('imagen', file);
      const { data } = await api.post('/uploads/imagen', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(data.url);
      toast.success('Imagen subida');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al subir imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  return (
    <div className={className}>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {value ? (
        <div className="relative group w-full h-full">
          <img
            src={value}
            alt="Producto"
            className="w-full h-full object-cover rounded-xl border-2 border-gray-200 dark:border-zinc-700"
            onError={(e) => { (e.target as HTMLImageElement).src = ''; }}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="p-2 bg-white/90 rounded-lg text-gray-700 hover:bg-white transition-colors"
            >
              <Camera className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="p-2 bg-red-500/90 rounded-lg text-white hover:bg-red-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !uploading && fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`w-full h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
            dragOver
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-zinc-600 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-zinc-800'
          } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="text-sm text-gray-500">Subiendo...</span>
            </>
          ) : (
            <>
              <ImagePlus className="w-8 h-8 text-gray-400" />
              <span className="text-sm text-gray-500 text-center px-4">
                Toca para subir imagen o arrastra aqui
              </span>
              <span className="text-xs text-gray-400">JPG, PNG, WebP - Max 5MB</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
