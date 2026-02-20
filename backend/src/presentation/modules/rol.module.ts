import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/persistence/prisma/prisma.module';
import { RolService } from '../../core/application/services/rol.service';
import { RolController } from '../http/controllers/rol.controller';

@Module({
  imports: [PrismaModule],
  controllers: [RolController],
  providers: [RolService],
  exports: [RolService],
})
export class RolModule {}
