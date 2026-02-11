import { env } from '../config/env';

export async function deleteAccountFromApi(accessToken: string) {
  if (!env.apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is missing.');
  }

  const response = await fetch(`${env.apiBaseUrl}/auth/delete-account`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      confirm_deletion: true,
    }),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Account deletion failed (${response.status}): ${responseText}`);
  }
}
