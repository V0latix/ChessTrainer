import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CoachContextController } from './coach-context.controller';
import { CoachContextService } from './coach-context.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CoachContextController],
  providers: [CoachContextService],
})
export class CoachContextModule {}
