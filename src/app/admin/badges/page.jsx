"use client";
import React from "react";

function MainComponent() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { data: currentUser, loading: userLoading } = useUser();

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/manage-badges");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
      setError("Could not load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleBadgeAction = async (userId, action) => {
    try {
      const response = await fetch("/api/manage-badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action,
          type: "verified_owner",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update badge");
      }

      await fetchUsers();
    } catch (err) {
      console.error(err);
      setError("Failed to update badge");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (userLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!currentUser?.is_admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="mb-4 text-gray-600">Admin access required</p>
          <a
            href="/"
            className="rounded-lg bg-[#357AFF] px-4 py-2 text-white hover:bg-[#2E69DE]"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">
            Manage User Badges
          </h1>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white px-4 py-3 focus-within:border-[#357AFF] focus-within:ring-1 focus-within:ring-[#357AFF]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full bg-transparent text-lg outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-500">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <ul className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <li key={user.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <button
                    onClick={() =>
                      handleBadgeAction(
                        user.id,
                        user.is_verified_owner ? "revoke" : "grant"
                      )
                    }
                    className={`rounded-lg px-4 py-2 text-sm font-medium ${
                      user.is_verified_owner
                        ? "bg-red-50 text-red-600 hover:bg-red-100"
                        : "bg-green-50 text-green-600 hover:bg-green-100"
                    }`}
                  >
                    {user.is_verified_owner ? (
                      <span>
                        <i className="fas fa-times mr-2" />
                        Revoke Badge
                      </span>
                    ) : (
                      <span>
                        <i className="fas fa-check mr-2" />
                        Grant Badge
                      </span>
                    )}
                  </button>
                </div>
              </li>
            ))}
            {filteredUsers.length === 0 && (
              <li className="p-4 text-center text-gray-500">
                No users found matching your search
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;