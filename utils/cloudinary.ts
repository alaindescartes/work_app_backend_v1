import { v2 as cloudinary, ConfigOptions } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';
import streamifier from 'streamifier';

const config: ConfigOptions = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
};

cloudinary.config(config);

/**
 * Uploads an image buffer to Cloudinary under a folder path like `baseFolder/subFolder`.
 * @param buffer The image buffer (from multer memoryStorage)
 * @param subFolder The subfolder name inside the base folder
 * @param baseFolder (optional) A base folder name, default is "uploads"
 * @returns Cloudinary Upload response
 */
export const uploadToCloudinary = (
  buffer: Buffer,
  subFolder: string,
  baseFolder: string = 'uploads'
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${baseFolder}/${subFolder}`,
      },
      (error, result) => {
        if (error || !result) {
          return reject(error);
        }
        resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};
export default cloudinary;
