import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PuzzlesController } from './puzzles.controller';
import { PuzzlesService } from './puzzles.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PuzzlesController],
  providers: [PuzzlesService],
})
export class PuzzlesModule {}
