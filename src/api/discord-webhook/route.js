async function handler(body, request) {
  const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;
  const headers = request.headers;
  const signature = headers["x-signature-ed25519"];
  const timestamp = headers["x-signature-timestamp"];

  if (!signature || !timestamp || !body) {
    return { statusCode: 401, body: "Invalid request" };
  }

  const encoder = new TextEncoder();
  const message = encoder.encode(timestamp + JSON.stringify(body));

  try {
    const keyBuffer = hexToUint8Array(PUBLIC_KEY);
    const signatureBuffer = hexToUint8Array(signature);

    const verified = await crypto.subtle.verify(
      "Ed25519",
      await crypto.subtle.importKey(
        "raw",
        keyBuffer,
        { name: "Ed25519" },
        false,
        ["verify"]
      ),
      signatureBuffer,
      message
    );

    if (!verified) {
      return { statusCode: 401, body: "Invalid signature" };
    }
  } catch (err) {
    return { statusCode: 401, body: "Invalid signature" };
  }

  if (body.type === 1) {
    return {
      type: 1,
    };
  }

  if (body.type === 2) {
    const { name } = body.data;

    if (name === "ping") {
      return {
        type: 4,
        data: {
          content: "Pong!",
        },
      };
    } else if (name === "chatgpt") {
      if (!body.data.options || !body.data.options[0]?.value) {
        return { type: 4, data: { content: "⚠️ No message provided." } };
      }

      const message = body.data.options[0].value;
      const { application_id, token } = body;

      // 1️⃣ Immediately defer response
      fetch(
        `https://discord.com/api/v10/interactions/${body.id}/${token}/callback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: 5 }),
        }
      ).catch(console.error);

      try {
        // 2️⃣ Call ChatGPT API
        const response = await fetch(
          "/integrations/chat-gpt/conversationgpt4",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: [{ role: "user", content: message }],
            }),
          }
        );

        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const result = await response.json();

        const reply =
          result.choices?.[0]?.message?.content ||
          "⚠️ No response from ChatGPT.";

        // 3️⃣ Edit the original deferred message
        await fetch(
          `https://discord.com/api/v10/webhooks/${application_id}/${token}/messages/@original`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: reply }),
          }
        );
      } catch (error) {
        console.error("ChatGPT API error:", error);
        // Send an error message if ChatGPT fails
        await fetch(
          `https://discord.com/api/v10/webhooks/${application_id}/${token}/messages/@original`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: "⚠️ Error calling ChatGPT. Please try again later.",
            }),
          }
        );
      }
    } else if (name === "echo") {
      const message = body.data.options[0].value;
      return {
        type: 4,
        data: {
          content: message,
        },
      };
    }
  }

  return { statusCode: 400, body: "Unknown interaction type" };
}

function hexToUint8Array(hex) {
  return new Uint8Array(hex.match(/.{1,2}/g).map((val) => parseInt(val, 16)));
}
export async function POST(request) {
  return handler(await request.json());
}