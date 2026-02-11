import { env } from '../config/env';

export async function syncIdentityWithApi(accessToken: string) {
  if (!env.apiBaseUrl) {
    return;
  }

  const response = await fetch(`${env.apiBaseUrl}/auth/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Identity sync failed with status ${response.status}`);
  }
}
