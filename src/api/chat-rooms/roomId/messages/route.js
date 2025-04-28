async function handler({ content, roomId }, request) {
  const session = getSession();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const [membership] = await sql`
    SELECT role, is_muted 
    FROM room_members 
    WHERE room_id = ${roomId} 
    AND user_id = ${session.user.id}
  `;

  if (!membership) {
    return { error: "Not a member of this room" };
  }

  if (request.method === "POST") {
    if (membership.is_muted) {
      return { error: "You are muted in this room" };
    }

    if (!content?.trim()) {
      return { error: "Message content is required" };
    }

    const [message] = await sql`
      INSERT INTO chat_messages (sender_id, content, room_id)
      VALUES (${session.user.id}, ${content}, ${roomId})
      RETURNING id, content, created_at
    `;

    return { message };
  }

  if (request.method === "GET") {
    const messages = await sql`
      SELECT 
        m.id,
        m.content,
        m.created_at,
        m.sender_id,
        u.name as sender_name,
        u.image as sender_image,
        u.is_verified_owner
      FROM chat_messages m
      JOIN auth_users u ON m.sender_id = u.id
      WHERE m.room_id = ${roomId}
      ORDER BY m.created_at DESC
      LIMIT 50
    `;

    return { messages: messages.reverse() };
  }

  return { error: "Method not allowed" };
}
export async function POST(request) {
  return handler(await request.json());
}