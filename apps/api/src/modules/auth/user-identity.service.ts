import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SupabaseJwtClaims } from './supabase-jwt.service';

@Injectable()
export class UserIdentityService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertFromClaims(claims: SupabaseJwtClaims): Promise<User> {
    const normalizedEmail = claims.email?.toLowerCase() ?? null;

    return this.prisma.user.upsert({
      where: {
        supabaseSub: claims.sub,
      },
      create: {
        supabaseSub: claims.sub,
        email: normalizedEmail,
      },
      update: {
        email: normalizedEmail,
      },
    });
  }
}
