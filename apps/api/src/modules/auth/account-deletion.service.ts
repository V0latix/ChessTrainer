import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AccountDeletionService {
  constructor(private readonly prisma: PrismaService) {}

  async deleteAccount(localUserId: string, supabaseSub: string): Promise<void> {
    await this.deleteSupabaseAuthUser(supabaseSub);

    await this.prisma.$transaction(async (tx) => {
      // Future domain tables will be deleted here before deleting the user row.
      await tx.user.delete({
        where: {
          id: localUserId,
        },
      });
    });
  }

  private async deleteSupabaseAuthUser(supabaseSub: string): Promise<void> {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new InternalServerErrorException(
        'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing for account deletion.',
      );
    }

    const endpoint = `${supabaseUrl.replace(/\/$/, '')}/auth/v1/admin/users/${supabaseSub}`;

    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new InternalServerErrorException(
        `Supabase account deletion failed (${response.status}): ${responseText}`,
      );
    }
  }
}
