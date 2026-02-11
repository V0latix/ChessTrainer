import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { DataInventoryController } from './data-inventory.controller';
import { DataInventoryService } from './data-inventory.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [DataInventoryController],
  providers: [DataInventoryService],
})
export class DataInventoryModule {}
