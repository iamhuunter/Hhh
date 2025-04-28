async function handler({ content }, request) {
  const session = getSession();

  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  if (request.method === "POST") {
    if (!content?.trim()) {
      return { error: "Message content is required" };
    }

    try {
      const [message] = await sql`
        INSERT INTO chat_messages (sender_id, content)
        VALUES (${session.user.id}, ${content})
        RETURNING id, content, created_at
      `;

      return { message };
    } catch (error) {
      return { error: "Failed to send message" };
    }
  }

  if (request.method === "GET") {
    try {
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
        ORDER BY m.created_at DESC
        LIMIT 50
      `;

      return { messages: messages.reverse() };
    } catch (error) {
      return { error: "Failed to fetch messages" };
    }
  }

  return { error: "Method not allowed" };
}
export async function POST(request) {
  return handler(await request.json());
}