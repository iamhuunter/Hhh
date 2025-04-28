async function handler({ name }, request) {
  const session = getSession();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  if (request.method === "GET") {
    try {
      const rooms = await sql`
        SELECT 
          r.id,
          r.name,
          r.created_at,
          u.name as creator_name,
          u.image as creator_image,
          COUNT(DISTINCT rm.user_id) as member_count
        FROM chat_rooms r
        LEFT JOIN auth_users u ON r.created_by = u.id
        LEFT JOIN room_members rm ON r.id = rm.room_id
        GROUP BY r.id, r.name, r.created_at, u.name, u.image
        ORDER BY r.created_at DESC
      `;

      return { rooms };
    } catch (error) {
      return { error: "Failed to fetch rooms" };
    }
  }

  if (request.method === "POST") {
    if (!session.user.is_admin) {
      return { error: "Only admins can create rooms" };
    }

    if (!name?.trim()) {
      return { error: "Room name is required" };
    }

    try {
      const [room] = await sql`
        INSERT INTO chat_rooms (name, created_by)
        VALUES (${name}, ${session.user.id})
        RETURNING id, name, created_at
      `;

      await sql`
        INSERT INTO room_members (room_id, user_id, role)
        VALUES (${room.id}, ${session.user.id}, 'administrator')
      `;

      return { room };
    } catch (error) {
      return { error: "Failed to create room" };
    }
  }

  return { error: "Method not allowed" };
}
export async function POST(request) {
  return handler(await request.json());
}