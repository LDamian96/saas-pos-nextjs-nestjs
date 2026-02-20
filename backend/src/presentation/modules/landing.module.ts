import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/persistence/prisma/prisma.module';
import { LandingService } from '../../core/application/services/landing.service';
import { LandingController } from '../http/controllers/landing.controller';

@Module({
  imports: [PrismaModule],
  controllers: [LandingController],
  providers: [LandingService],
  exports: [LandingService],
})
export class LandingModule {}
