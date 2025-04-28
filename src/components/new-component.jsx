"use client";
import React from "react";



export default function Index() {
  return (function MainComponent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [nameError, setNameError] = useState("");

  const validateCommandName = (name) => {
    if (!name.match(/^[a-z0-9]+$/)) {
      return "Command name must be lowercase alphanumeric only";
    }
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.target);
    const name = formData.get("name");

    const error = validateCommandName(name);
    if (error) {
      setNameError(error);
      setLoading(false);
      return;
    }

    try {
      const data = {
        name,
        description: formData.get("description"),
        required: formData.get("messageRequired") === "on",
      };

      const response = await fetch("/api/create-command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to create command");
      }

      e.target.reset();
      setSuccess(true);
      setNameError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm font-inter">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm font-inter">
          Command created successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-900 dark:text-gray-100 font-inter mb-2 text-sm">
            Command Name
          </label>
          <input
            type="text"
            name="name"
            required
            maxLength={32}
            pattern="[a-z0-9]+"
            onChange={(e) => setNameError(validateCommandName(e.target.value))}
            className={`w-full px-4 py-2 rounded-lg border ${
              nameError
                ? "border-red-500"
                : "border-gray-200 dark:border-gray-700"
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-inter text-sm focus:outline-none focus:border-gray-900 dark:focus:border-gray-100`}
            placeholder="e.g., greet"
          />
          {nameError ? (
            <p className="mt-1 text-xs text-red-500 font-inter">{nameError}</p>
          ) : (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-inter">
              Lowercase letters and numbers only, max 32 characters
            </p>
          )}
        </div>

        <div>
          <label className="block text-gray-900 dark:text-gray-100 font-inter mb-2 text-sm">
            Description
          </label>
          <textarea
            name="description"
            required
            maxLength={100}
            rows={3}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-inter text-sm focus:outline-none focus:border-gray-900 dark:focus:border-gray-100"
            placeholder="e.g., Sends a friendly greeting"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-inter">
            Max 100 characters
          </p>
        </div>

        <div>
          <label className="flex items-center space-x-3 text-gray-900 dark:text-gray-100 font-inter text-sm">
            <input
              type="checkbox"
              name="messageRequired"
              defaultChecked={true}
              className="w-4 h-4 border-gray-200 dark:border-gray-700 rounded"
            />
            <span>Message input required?</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || !!nameError}
          className="inline-flex justify-center items-center px-4 py-2 rounded bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-inter text-sm hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="inline-flex items-center">
              <i className="fas fa-spinner fa-spin mr-2" />
              Creating...
            </span>
          ) : (
            "Create Discord Command"
          )}
        </button>
      </form>
    </div>
  );
}

function StoryComponent() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <MainComponent />
    </div>
  );
});
}