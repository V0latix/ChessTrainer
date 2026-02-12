import { Module } from '@nestjs/common';
import { ChessComService } from '../../integrations/chess-com/chess-com.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ImportsController],
  providers: [ImportsService, ChessComService],
  exports: [ImportsService],
})
export class ImportsModule {}
