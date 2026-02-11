import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { AnalysisJobsModule } from './modules/analysis-jobs/analysis-jobs.module';
import { ImportsModule } from './modules/imports/imports.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, AuthModule, ImportsModule, AnalysisJobsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
