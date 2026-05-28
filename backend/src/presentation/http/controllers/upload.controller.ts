/**
 * @file upload.controller.ts
 * @description Upload de imágenes a Cloudinary
 */

import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { TenantGuard } from '../guards/tenant.guard';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

@Controller('uploads')
@UseGuards(JwtAuthGuard, TenantGuard)
export class UploadController {
  constructor(private config: ConfigService) {
    cloudinary.config({
      cloud_name: this.config.get('CLOUDINARY_CLOUD_NAME', 'dnqkkd5nj'),
      api_key: this.config.get('CLOUDINARY_API_KEY', '388425642996986'),
      api_secret: this.config.get('CLOUDINARY_API_SECRET', 'r_S3rJO1yYVeEKgaIKQad44DWGQ'),
    });
  }

  @Post('imagen')
  @UseInterceptors(
    FileInterceptor('imagen', {
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          return cb(
            new BadRequestException('Solo se permiten imagenes (jpg, jpeg, png, webp, gif)'),
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async uploadImagen(
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No se recibio ninguna imagen');
    }

    try {
      // Subir a Cloudinary desde buffer
      const result = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'pos-productos',
            transformation: [{ width: 800, height: 800, crop: 'fill', quality: 90 }],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );
        stream.end(file.buffer);
      });

      return {
        success: true,
        url: result.secure_url,
        filename: result.public_id,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error) {
      throw new BadRequestException(`Error subiendo imagen: ${error.message}`);
    }
  }
}
