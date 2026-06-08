import { Module } from '@nestjs/common';
import { MobileLogsController } from '../http/controllers/mobile-logs.controller';

@Module({
  controllers: [MobileLogsController],
})
export class MobileLogsModule {}
