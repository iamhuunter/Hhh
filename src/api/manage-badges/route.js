async function handler({ userId, action, type }, request) {
  const session = getSession();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const [admin] = await sql`
    SELECT is_admin FROM auth_users 
    WHERE id = ${session.user.id}
  `;

  if (!admin?.is_admin) {
    return { error: "Unauthorized - Admin access required" };
  }

  if (request.method === "POST") {
    if (!userId || !action || !type) {
      return { error: "Missing required fields" };
    }

    if (type !== "verified_owner") {
      return { error: "Invalid badge type" };
    }

    if (!["grant", "revoke"].includes(action)) {
      return { error: "Invalid action" };
    }

    const value = action === "grant";

    const [updatedUser] = await sql`
      UPDATE auth_users 
      SET is_verified_owner = ${value}
      WHERE id = ${userId}
      RETURNING id, name, email, is_verified_owner
    `;

    if (!updatedUser) {
      return { error: "User not found" };
    }

    return { user: updatedUser };
  }

  if (request.method === "GET") {
    const users = await sql`
      SELECT id, name, email, is_verified_owner 
      FROM auth_users 
      WHERE is_verified_owner = true
      ORDER BY name ASC
    `;

    return { users };
  }

  return { error: "Method not allowed" };
}
export async function POST(request) {
  return handler(await request.json());
}