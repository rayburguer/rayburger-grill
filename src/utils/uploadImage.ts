import { supabase } from '../lib/supabase';

/**
 * Uploads an image file to the 'products' bucket in Supabase Storage.
 * Returns the public URL of the uploaded image.
 * 
 * @param file The file object to upload
 * @returns Promise resolving to the public URL string
 */
export const uploadProductImage = async (file: File): Promise<string | null> => {
    if (!supabase) {
        console.error('Supabase not initialized');
        return null;
    }

    try {
        // 1. Generate a unique file name
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        // 2. Upload to 'products' bucket
        const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(filePath, file);

        if (uploadError) {
            console.error('Error uploading image:', uploadError.message);
            // If bucket doesn't exist, this will fail. User needs to create it.
            throw uploadError;
        }

        // 3. Get Public URL
        const { data } = supabase.storage
            .from('products')
            .getPublicUrl(filePath);

        return data.publicUrl;

    } catch (error) {
        console.error('Upload failed:', error);
        alert('Error subiendo imagen. ¿Creaste el bucket "products" en Supabase como público?');
        return null;
    }
};
