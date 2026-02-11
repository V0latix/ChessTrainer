import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { JWTPayload, createRemoteJWKSet, jwtVerify } from 'jose';

export type SupabaseJwtClaims = JWTPayload & {
  sub: string;
  email?: string;
};

type RemoteJwkSet = ReturnType<typeof createRemoteJWKSet>;
type JwtVerifyFn = typeof jwtVerify;

@Injectable()
export class SupabaseJwtService {
  private jwksCache: RemoteJwkSet | null = null;
  private issuerCache: string | null = null;

  private async getJoseHelpers(): Promise<{
    createRemoteJWKSet: typeof createRemoteJWKSet;
    jwtVerify: JwtVerifyFn;
  }> {
    const jose = await import('jose');
    return {
      createRemoteJWKSet: jose.createRemoteJWKSet,
      jwtVerify: jose.jwtVerify,
    };
  }

  private async getConfig() {
    const supabaseUrl = process.env.SUPABASE_URL;

    if (!supabaseUrl) {
      throw new UnauthorizedException('SUPABASE_URL is not configured on API.');
    }

    const issuer = `${supabaseUrl.replace(/\/$/, '')}/auth/v1`;
    const audience = process.env.SUPABASE_JWT_AUDIENCE ?? 'authenticated';

    if (!this.jwksCache || this.issuerCache !== issuer) {
      const { createRemoteJWKSet } = await this.getJoseHelpers();
      const jwksUrl = new URL(`${issuer}/.well-known/jwks.json`);
      this.jwksCache = createRemoteJWKSet(jwksUrl);
      this.issuerCache = issuer;
    }

    return {
      issuer,
      audience,
      jwks: this.jwksCache,
    };
  }

  async verifyAccessToken(token: string): Promise<SupabaseJwtClaims> {
    const { jwtVerify } = await this.getJoseHelpers();
    const { issuer, audience, jwks } = await this.getConfig();

    try {
      const { payload } = await jwtVerify(token, jwks, {
        issuer,
        audience,
      });

      if (!payload.sub) {
        throw new UnauthorizedException(
          'Token payload does not include sub claim.',
        );
      }

      return payload as SupabaseJwtClaims;
    } catch (error) {
      throw new UnauthorizedException(
        error instanceof Error
          ? `Invalid Supabase token: ${error.message}`
          : 'Invalid Supabase token',
      );
    }
  }
}
