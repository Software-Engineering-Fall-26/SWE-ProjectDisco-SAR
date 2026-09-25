//THIS FILE OCONTAINS ALL THE BACKEND COMMUNICATION STUFF


const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

async function sendRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options);

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "The request failed.");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function getIdeas() {
  const data = await sendRequest("/ideas");
  return data.ideas_list;
}

export function createIdea(idea) {
  return sendRequest("/ideas", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(idea),
  });
}

export function updateIdea(id, idea) {
  return sendRequest(`/ideas/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(idea),
  });
}

export function deleteIdea(id) {
  return sendRequest(`/ideas/${id}`, {
    method: "DELETE",
  });
}