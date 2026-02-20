import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/persistence/prisma/prisma.module';
import { SeoService } from '../../core/application/services/seo.service';
import { SeoController } from '../http/controllers/seo.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SeoController],
  providers: [SeoService],
  exports: [SeoService],
})
export class SeoModule {}
