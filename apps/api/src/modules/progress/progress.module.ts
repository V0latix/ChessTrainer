import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ProgressController],
  providers: [ProgressService],
})
export class ProgressModule {}
