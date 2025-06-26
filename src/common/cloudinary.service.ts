import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

@Injectable()
export class CloudinaryService {
  async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'image' },
        (error, result) => {
          if (error) {
            const msg =
              error && typeof error === 'object'
                ? error.message || JSON.stringify(error)
                : String(error || 'Unknown error');
            return reject(new Error(msg));
          }
          if (!result) {
            return reject(new Error('No result returned from Cloudinary.'));
          }
          resolve(result);
        },
      );
      // pipe the buffer into Cloudinary
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }
}
