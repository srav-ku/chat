import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'ds1sfucwb',
  api_key: process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY_ENV_VAR || 'default_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET_ENV_VAR || 'default_secret'
});

const CLOUDINARY_URL = process.env.CLOUDINARY_URL || 'https://api.cloudinary.com/v1_1/ds1sfucwb/auto/upload';
const CLOUDINARY_PRESET = process.env.CLOUDINARY_PRESET || 'unsigned_preset';

export interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  resourceType: string;
  bytes: number;
  width?: number;
  height?: number;
}

export class CloudinaryService {
  // Upload media file to Cloudinary
  async uploadMedia(fileBuffer: Buffer, fileName: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<UploadResult> {
    try {
      const result = await cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          public_id: `chat-media/${Date.now()}-${fileName}`,
          upload_preset: CLOUDINARY_PRESET,
          folder: 'chat-uploads'
        },
        (error, result) => {
          if (error) throw error;
          return result;
        }
      );

      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: resourceType,
            public_id: `chat-media/${Date.now()}-${fileName}`,
            upload_preset: CLOUDINARY_PRESET,
            folder: 'chat-uploads'
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else if (result) {
              resolve({
                url: result.secure_url,
                publicId: result.public_id,
                format: result.format,
                resourceType: result.resource_type,
                bytes: result.bytes,
                width: result.width,
                height: result.height
              });
            }
          }
        );
        
        stream.write(fileBuffer);
        stream.end();
      });
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload media to Cloudinary');
    }
  }

  // Upload via URL (for client-side uploads)
  async uploadFromUrl(fileUrl: string, resourceType: 'image' | 'video' | 'raw' = 'image'): Promise<UploadResult> {
    try {
      const result = await cloudinary.uploader.upload(fileUrl, {
        resource_type: resourceType,
        folder: 'chat-uploads',
        upload_preset: CLOUDINARY_PRESET
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        resourceType: result.resource_type,
        bytes: result.bytes,
        width: result.width,
        height: result.height
      };
    } catch (error) {
      console.error('Cloudinary URL upload error:', error);
      throw new Error('Failed to upload media from URL');
    }
  }

  // Get optimized image URL
  getOptimizedUrl(publicId: string, width?: number, height?: number, quality: string = 'auto'): string {
    return cloudinary.url(publicId, {
      width,
      height,
      crop: 'fill',
      quality,
      fetch_format: 'auto'
    });
  }

  // Delete media from Cloudinary (optional - for admin cleanup)
  async deleteMedia(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return false;
    }
  }

  // Get media info
  async getMediaInfo(publicId: string): Promise<any> {
    try {
      return await cloudinary.api.resource(publicId);
    } catch (error) {
      console.error('Cloudinary info error:', error);
      return null;
    }
  }
}

export const cloudinaryService = new CloudinaryService();
