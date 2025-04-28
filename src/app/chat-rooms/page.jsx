"use client";
import React from "react";

function MainComponent() {
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const { data: currentUser, loading: userLoading } = useUser();

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/chat-rooms");
      if (!response.ok) {
        throw new Error("Failed to fetch rooms");
      }
      const data = await response.json();
      setRooms(data.rooms || []);
    } catch (err) {
      console.error(err);
      setError("Could not load chat rooms");
    }
  };

  const fetchMessages = async (roomId) => {
    try {
      const response = await fetch(`/api/chat-rooms/${roomId}/messages`);
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error(err);
      setError("Could not load messages");
    }
  };

  const fetchUsers = async (roomId) => {
    try {
      const response = await fetch(`/api/chat-rooms/${roomId}/users`);
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
      setError("Could not load users");
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchRooms();
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentRoom) {
      fetchMessages(currentRoom.id);
      fetchUsers(currentRoom.id);
      const interval = setInterval(() => {
        fetchMessages(currentRoom.id);
        fetchUsers(currentRoom.id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [currentRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentRoom) return;

    try {
      const response = await fetch(
        `/api/chat-rooms/${currentRoom.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newMessage }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setNewMessage("");
      await fetchMessages(currentRoom.id);
    } catch (err) {
      console.error(err);
      setError("Could not send message");
    }
  };

  const handleUserAction = async (userId, action) => {
    try {
      const response = await fetch(
        `/api/chat-rooms/${currentRoom.id}/users/${userId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to ${action} user`);
      }

      await fetchUsers(currentRoom.id);
    } catch (err) {
      console.error(err);
      setError(`Could not ${action} user`);
    }
  };

  if (userLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="mb-4 text-gray-600">Please sign in to use chat rooms</p>
          <a
            href="/account/signin"
            className="rounded-lg bg-[#357AFF] px-4 py-2 text-white hover:bg-[#2E69DE]"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="w-64 border-r border-gray-200 bg-white p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Chat Rooms</h2>
          {currentUser.is_admin && (
            <button className="mt-2 w-full rounded-lg bg-[#357AFF] px-3 py-2 text-sm text-white hover:bg-[#2E69DE]">
              Create Room
            </button>
          )}
        </div>
        <ul className="space-y-2">
          {rooms.map((room) => (
            <li
              key={room.id}
              onClick={() => setCurrentRoom(room)}
              className={`cursor-pointer rounded-lg p-2 ${
                currentRoom?.id === room.id ? "bg-gray-100" : "hover:bg-gray-50"
              }`}
            >
              {room.name}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-1 flex-col">
        {currentRoom ? (
          <>
            <div className="border-b border-gray-200 bg-white p-4">
              <h1 className="text-xl font-semibold text-gray-900">
                {currentRoom.name}
              </h1>
            </div>

            <div className="flex flex-1">
              <div className="flex-1 overflow-y-auto p-4">
                {error && (
                  <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-500">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className="flex items-start space-x-3"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                        <i className="fas fa-user text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline space-x-2">
                          <span className="font-medium text-gray-900">
                            {message.sender_name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="mt-1 text-gray-700">{message.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="w-64 border-l border-gray-200 bg-white p-4">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Users
                </h2>
                <ul className="space-y-2">
                  {users.map((user) => (
                    <li
                      key={user.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">
                          {user.role === "admin"
                            ? "Admin"
                            : user.role === "moderator"
                            ? "Mod"
                            : "User"}
                        </p>
                      </div>
                      {(currentUser.is_admin || currentUser.is_moderator) &&
                        user.id !== currentUser.id && (
                          <div className="flex space-x-1">
                            <button
                              onClick={() =>
                                handleUserAction(
                                  user.id,
                                  user.is_muted ? "unmute" : "mute"
                                )
                              }
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <i
                                className={`fas fa-${
                                  user.is_muted ? "volume-up" : "volume-mute"
                                }`}
                              />
                            </button>
                            <button
                              onClick={() => handleUserAction(user.id, "kick")}
                              className="text-red-500 hover:text-red-700"
                            >
                              <i className="fas fa-times" />
                            </button>
                          </div>
                        )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-200 bg-white p-4">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-lg border border-gray-200 px-4 py-2 focus:border-[#357AFF] focus:outline-none focus:ring-1 focus:ring-[#357AFF]"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="rounded-lg bg-[#357AFF] px-4 py-2 text-white transition-colors hover:bg-[#2E69DE] focus:outline-none focus:ring-2 focus:ring-[#357AFF] focus:ring-offset-2 disabled:opacity-50"
                >
                  <i className="fas fa-paper-plane" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-gray-500">
              Select a chat room to start messaging
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MainComponent;