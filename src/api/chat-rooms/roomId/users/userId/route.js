async function handler({ roomId, userId, action, role }, request) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const [requesterRole] = await sql`
    SELECT role FROM room_members 
    WHERE room_id = ${roomId} 
    AND user_id = ${session.user.id}
  `;

  if (
    !requesterRole ||
    !["administrator", "moderator"].includes(requesterRole.role)
  ) {
    return { error: "Insufficient permissions" };
  }

  if (request.method === "GET") {
    const users = await sql`
      SELECT 
        rm.user_id,
        rm.role,
        rm.is_muted,
        rm.joined_at,
        u.name,
        u.email,
        u.image,
        u.is_verified_owner
      FROM room_members rm
      JOIN auth_users u ON rm.user_id = u.id
      WHERE rm.room_id = ${roomId}
      ORDER BY rm.joined_at DESC
    `;
    return { users };
  }

  if (request.method === "POST") {
    if (action === "kick") {
      await sql`
        DELETE FROM room_members 
        WHERE room_id = ${roomId} 
        AND user_id = ${userId}
      `;
      return { message: "User kicked from room" };
    }

    if (action === "mute" || action === "unmute") {
      await sql`
        UPDATE room_members 
        SET is_muted = ${action === "mute"}
        WHERE room_id = ${roomId} 
        AND user_id = ${userId}
      `;
      return { message: `User ${action}d` };
    }

    return { error: "Invalid action" };
  }

  if (request.method === "PUT") {
    if (!role || !["user", "moderator"].includes(role)) {
      return { error: "Invalid role" };
    }

    await sql`
      UPDATE room_members 
      SET role = ${role}::user_role
      WHERE room_id = ${roomId} 
      AND user_id = ${userId}
    `;
    return { message: "User role updated" };
  }

  return { error: "Method not allowed" };
}
export async function POST(request) {
  return handler(await request.json());
}