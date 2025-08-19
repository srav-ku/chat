const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'ds1sfucwb';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_PRESET || 'unsigned_preset';

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  resource_type: string;
  bytes: number;
  width?: number;
  height?: number;
}

export class CloudinaryClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}`;
  }

  // Upload file directly from client
  async uploadFile(file: File, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<CloudinaryUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'chat-uploads');
    formData.append('public_id', `chat-media/${Date.now()}-${file.name}`);

    const uploadUrl = `${this.baseUrl}/${resourceType}/upload`;

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result: CloudinaryUploadResult = await response.json();
      return result;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload file to Cloudinary');
    }
  }

  // Get optimized image URL
  getOptimizedUrl(publicId: string, width?: number, height?: number, quality: string = 'auto'): string {
    let transformations = [`q_${quality}`, 'f_auto'];
    
    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    if (width && height) transformations.push('c_fill');

    const transformationString = transformations.join(',');
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformationString}/${publicId}`;
  }

  // Get video thumbnail
  getVideoThumbnail(publicId: string, width: number = 300, height: number = 200): string {
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload/w_${width},h_${height},c_fill,f_jpg,so_auto/${publicId}.jpg`;
  }

  // Check if file type is supported
  isFileTypeSupported(file: File): { supported: boolean; resourceType: 'image' | 'video' | 'raw' } {
    const mimeType = file.type.toLowerCase();
    
    if (mimeType.startsWith('image/')) {
      const supportedImages = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      return {
        supported: supportedImages.includes(mimeType),
        resourceType: 'image'
      };
    }
    
    if (mimeType.startsWith('video/')) {
      const supportedVideos = ['video/mp4', 'video/mov', 'video/avi', 'video/webm'];
      return {
        supported: supportedVideos.includes(mimeType),
        resourceType: 'video'
      };
    }
    
    // For other file types, treat as raw
    return {
      supported: file.size <= 10 * 1024 * 1024, // 10MB limit
      resourceType: 'raw'
    };
  }

  // Upload with progress tracking
  async uploadWithProgress(
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<CloudinaryUploadResult> {
    const { supported, resourceType } = this.isFileTypeSupported(file);
    
    if (!supported) {
      throw new Error('File type not supported or file too large');
    }

    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'chat-uploads');
      formData.append('public_id', `chat-media/${Date.now()}-${file.name}`);

      const xhr = new XMLHttpRequest();
      const uploadUrl = `${this.baseUrl}/${resourceType}/upload`;

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded * 100) / event.total);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const result = JSON.parse(xhr.responseText);
            resolve(result);
          } catch (error) {
            reject(new Error('Invalid response from Cloudinary'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.open('POST', uploadUrl);
      xhr.send(formData);
    });
  }
}

export const cloudinaryClient = new CloudinaryClient();
