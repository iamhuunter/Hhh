async function handler({ name, description, required }) {
  const applicationId = process.env.DISCORD_APP_ID;
  const guildId = process.env.DISCORD_GUILD_ID;
  const token = process.env.DISCORD_BOT_TOKEN;

  if (!applicationId || !guildId || !token) {
    return {
      error: "Missing required environment variables",
    };
  }

  const commandData = {
    name,
    description,
    options: [
      {
        name: "message",
        description: "The message to reply to",
        type: 3,
        required,
      },
    ],
  };

  try {
    const response = await fetch(
      `https://discord.com/api/v10/applications/${applicationId}/guilds/${guildId}/commands`,
      {
        method: "POST",
        headers: {
          Authorization: `Bot ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(commandData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Discord API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return {
      success: true,
      message: "Command registered successfully",
      command: data,
    };
  } catch (error) {
    return {
      error: error.message,
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}