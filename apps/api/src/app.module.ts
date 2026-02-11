import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { AnalysisJobsModule } from './modules/analysis-jobs/analysis-jobs.module';
import { CoachContextModule } from './modules/coach-context/coach-context.module';
import { ImportsModule } from './modules/imports/imports.module';
import { PuzzlesModule } from './modules/puzzles/puzzles.module';
import { ProgressModule } from './modules/progress/progress.module';
import { DataInventoryModule } from './modules/data-inventory/data-inventory.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    CoachContextModule,
    ImportsModule,
    AnalysisJobsModule,
    PuzzlesModule,
    ProgressModule,
    DataInventoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
