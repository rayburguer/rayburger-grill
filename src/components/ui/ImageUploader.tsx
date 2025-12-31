import React, { useCallback, useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { generateUuid } from '../../utils/helpers';

interface ImageUploaderProps {
    currentImage?: string;
    onImageUploaded: (url: string) => void;
    folder?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
    currentImage,
    onImageUploaded,
    folder = 'products'
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(currentImage || null);
    const [error, setError] = useState<string | null>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    }, []);

    const uploadImage = useCallback(async (file: File) => {
        // 1. Validation
        if (!file.type.startsWith('image/')) {
            setError('Solo archivos de imagen (JPG, PNG, WEBP)');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setError('La imagen no debe pesar más de 2MB');
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            if (!supabase) throw new Error("No hay conexión con Supabase");

            // 2. Generate unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${folder}/${generateUuid()}.${fileExt}`;

            // 3. Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // 4. Get Public URL
            const { data } = supabase.storage
                .from('product-images')
                .getPublicUrl(fileName);

            const publicUrl = data.publicUrl;

            setPreview(publicUrl);
            onImageUploaded(publicUrl);

        } catch (err: any) {
            console.error("Upload failed:", err);
            setError(err.message || 'Error al subir imagen');
        } finally {
            setIsUploading(false);
            setIsDragging(false);
        }
    }, [folder, onImageUploaded]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            uploadImage(e.dataTransfer.files[0]);
        }
    }, [uploadImage]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            uploadImage(e.target.files[0]);
        }
    };

    const clearImage = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent bubbling if inside a form button
        e.stopPropagation();
        setPreview(null);
        onImageUploaded('');
    };

    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-gray-400 mb-1">
                Foto del Producto
            </label>

            {preview ? (
                <div className="relative group rounded-lg overflow-hidden border-2 border-gray-700 bg-gray-800">
                    <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                            onClick={clearImage}
                            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transform hover:scale-110 transition-transform"
                            title="Eliminar imagen"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`
                        relative border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors
                        ${isDragging ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700 hover:border-gray-500 bg-gray-800/50'}
                        ${error ? 'border-red-500 bg-red-500/10' : ''}
                    `}
                >
                    <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleChange}
                        accept="image/*"
                        disabled={isUploading}
                    />

                    {isUploading ? (
                        <>
                            <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-2" />
                            <p className="text-sm text-gray-300">Optimizando y subiendo...</p>
                        </>
                    ) : (
                        <>
                            <Upload className={`w-10 h-10 mb-2 ${isDragging ? 'text-orange-500' : 'text-gray-400'}`} />
                            <p className="text-sm text-gray-300 font-medium">
                                Arrastra tu imagen aquí
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                o haz clic para seleccionar (Max 2MB)
                            </p>
                        </>
                    )}
                </div>
            )}

            {error && (
                <p className="text-red-400 text-xs mt-2 flex items-center">
                    <X size={12} className="mr-1" /> {error}
                </p>
            )}
        </div>
    );
};
