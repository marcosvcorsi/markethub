const KEYCLOAK_URL =
  process.env.KEYCLOAK_URL || 'http://localhost:8080';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'markethub';
const KEYCLOAK_ADMIN = process.env.KEYCLOAK_ADMIN || 'admin';
const KEYCLOAK_ADMIN_PASSWORD =
  process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin';

async function getAdminToken(): Promise<string> {
  const res = await fetch(
    `${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: 'admin-cli',
        username: KEYCLOAK_ADMIN,
        password: KEYCLOAK_ADMIN_PASSWORD,
      }),
    },
  );

  if (!res.ok) {
    throw new Error(
      `Failed to get Keycloak admin token: ${res.status} ${res.statusText}`,
    );
  }

  const data = await res.json();
  return data.access_token;
}

export async function getKeycloakUserId(
  username: string,
): Promise<string> {
  const token = await getAdminToken();

  const res = await fetch(
    `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users?username=${username}&exact=true`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (!res.ok) {
    throw new Error(
      `Failed to look up Keycloak user "${username}": ${res.status} ${res.statusText}`,
    );
  }

  const users = await res.json();
  if (users.length === 0) {
    throw new Error(
      `Keycloak user "${username}" not found in realm "${KEYCLOAK_REALM}"`,
    );
  }

  return users[0].id;
}

export async function resolveKeycloakUsers(): Promise<{
  testUserId: string;
  sellerId: string;
  adminId: string;
}> {
  console.log('Resolving Keycloak user IDs...');

  const [testUserId, sellerId, adminId] = await Promise.all([
    getKeycloakUserId('testuser'),
    getKeycloakUserId('seller'),
    getKeycloakUserId('admin'),
  ]);

  console.log(`  testuser → ${testUserId}`);
  console.log(`  seller   → ${sellerId}`);
  console.log(`  admin    → ${adminId}`);

  return { testUserId, sellerId, adminId };
}
