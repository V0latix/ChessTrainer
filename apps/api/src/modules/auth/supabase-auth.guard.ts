import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RequestWithAuthUser } from '../../common/types/authenticated-user';
import { SupabaseJwtService } from './supabase-jwt.service';
import { UserIdentityService } from './user-identity.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(
    private readonly supabaseJwtService: SupabaseJwtService,
    private readonly userIdentityService: UserIdentityService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAuthUser>();
    const accessToken = this.extractBearerToken(request.headers.authorization);

    if (!accessToken) {
      throw new UnauthorizedException('Missing bearer token.');
    }

    const claims = await this.supabaseJwtService.verifyAccessToken(accessToken);
    const localUser = await this.userIdentityService.upsertFromClaims(claims);

    request.authUser = {
      local_user_id: localUser.id,
      supabase_sub: localUser.supabaseSub,
      email: localUser.email,
      role: localUser.role,
    };

    return true;
  }

  private extractBearerToken(authorizationHeader?: string) {
    if (!authorizationHeader) {
      return null;
    }

    const [type, token] = authorizationHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }
}
