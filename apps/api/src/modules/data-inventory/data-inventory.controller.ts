import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import type { DeletableDataset } from './data-inventory.service';
import { DataInventoryService } from './data-inventory.service';

@Controller('data')
export class DataInventoryController {
  private readonly allowedDatasets = new Set<DeletableDataset>([
    'games',
    'analyses',
    'puzzle_sessions',
  ]);

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

  @UseGuards(SupabaseAuthGuard)
  @Post('delete-datasets')
  async deleteDatasets(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { dataset_keys?: unknown } = {},
  ) {
    if (!Array.isArray(body.dataset_keys) || body.dataset_keys.length === 0) {
      throw new BadRequestException(
        'dataset_keys must be a non-empty array of strings.',
      );
    }

    const rawKeys = body.dataset_keys;
    if (!rawKeys.every((value): value is string => typeof value === 'string')) {
      throw new BadRequestException(
        'dataset_keys must be a non-empty array of strings.',
      );
    }

    const normalizedKeys = Array.from(
      new Set(rawKeys.map((value) => value.trim().toLowerCase())),
    );

    if (
      normalizedKeys.some(
        (datasetKey) =>
          !this.allowedDatasets.has(datasetKey as DeletableDataset),
      )
    ) {
      throw new BadRequestException(
        'dataset_keys contains unsupported values.',
      );
    }

    const result = await this.dataInventoryService.deleteDatasets({
      user_id: user.local_user_id,
      dataset_keys: normalizedKeys as DeletableDataset[],
    });

    return {
      data: result,
    };
  }
}
