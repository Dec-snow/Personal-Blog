const JSON_HEADERS = { Accept: "application/json" };

async function parseResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || `HTTP ${res.status}`);
  }
  return data;
}

/**
 * Wraps a fetch call and converts network-level errors (e.g. backend down,
 * CORS blocked) into user-friendly Chinese messages instead of the raw
 * "Failed to fetch" TypeError string.
 */
async function safeFetch(url, options) {
  try {
    return await fetch(url, options);
  } catch (e) {
    if (e instanceof TypeError && e.message.includes("fetch")) {
      throw new Error("网络连接失败，请确认后端服务已启动。");
    }
    throw e;
  }
}

export async function fetchOwnerStatus() {
  const res = await safeFetch("/api/owner/status", {
    credentials: "include",
    headers: JSON_HEADERS,
  });
  return parseResponse(res);
}

export async function fetchOwnerEmails() {
  const res = await safeFetch("/api/owner/emails", {
    credentials: "include",
    headers: JSON_HEADERS,
  });
  return parseResponse(res);
}

export async function fetchOwnerDrafts() {
  const res = await safeFetch("/api/owner/drafts", {
    credentials: "include",
    headers: JSON_HEADERS,
  });
  return parseResponse(res);
}

export async function createOwnerDraft(payload) {
  const res = await safeFetch("/api/owner/drafts", {
    method: "POST",
    credentials: "include",
    headers: {
      ...JSON_HEADERS,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
}

export async function publishOwnerArticle(payload) {
  const res = await safeFetch("/api/owner/publish", {
    method: "POST",
    credentials: "include",
    headers: {
      ...JSON_HEADERS,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
}

export async function markOwnerNotificationRead(id) {
  const res = await safeFetch(`/api/owner/notifications/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
    credentials: "include",
    headers: JSON_HEADERS,
  });
  return parseResponse(res);
}

export async function publishOwnerMoment(payload) {
  const res = await safeFetch("/api/owner/moments", {
    method: "POST",
    credentials: "include",
    headers: {
      ...JSON_HEADERS,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
}

export async function deleteOwnerMoment(payload) {
  const res = await safeFetch("/api/owner/moments", {
    method: "DELETE",
    credentials: "include",
    headers: {
      ...JSON_HEADERS,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return parseResponse(res);
}

export function isPublicImageURL(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function uploadOwnerAsset(file, { kind, album = "" }) {
  const form = new FormData();
  form.append("file", file);
  form.append("kind", kind);
  if (album) {
    form.append("album", album);
  }

  const res = await safeFetch("/api/owner/assets", {
    method: "POST",
    credentials: "include",
    body: form,
  });
  return parseResponse(res);
}

export async function uploadOwnerImage(file) {
  const form = new FormData();
  form.append("file", file);

  const res = await safeFetch("/api/owner/uploads", {
    method: "POST",
    credentials: "include",
    body: form,
  });
  return parseResponse(res);
}

export async function fetchPublicMoments() {
  const res = await safeFetch("/api/moments", {
    headers: JSON_HEADERS,
  });
  return parseResponse(res);
}
