import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { DataInventoryService } from './data-inventory.service';

@Controller('data')
export class DataInventoryController {
  constructor(private readonly dataInventoryService: DataInventoryService) {}

  @UseGuards(SupabaseAuthGuard)
  @Get('inventory')
  async getInventory(@CurrentUser() user: AuthenticatedUser) {
    const result = await this.dataInventoryService.getInventory({
      user_id: user.local_user_id,
    });

    return {
      data: result,
    };
  }
}
