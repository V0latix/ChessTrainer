import { Module } from '@nestjs/common';
import { ChessComService } from '../../integrations/chess-com/chess-com.service';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';

@Module({
  controllers: [ImportsController],
  providers: [ImportsService, ChessComService],
})
export class ImportsModule {}
