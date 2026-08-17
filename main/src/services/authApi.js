const JSON_HEADERS = { "Content-Type": "application/json", Accept: "application/json" };

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

/**
 * Wraps a fetch call and converts network-level errors into user-friendly
 * Chinese messages instead of the raw "Failed to fetch" string.
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

export async function authMe() {
  const res = await safeFetch("/api/auth/me", {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  return parseJson(res);
}

export async function authRegister(email, password) {
  const res = await safeFetch("/api/auth/register", {
    method: "POST",
    credentials: "include",
    headers: JSON_HEADERS,
    body: JSON.stringify({ email, password }),
  });
  return parseJson(res);
}

export async function authLogin(email, password) {
  const res = await safeFetch("/api/auth/login", {
    method: "POST",
    credentials: "include",
    headers: JSON_HEADERS,
    body: JSON.stringify({ email, password }),
  });
  return parseJson(res);
}

export async function authLogout() {
  const res = await safeFetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
    headers: JSON_HEADERS,
  });
  return parseJson(res);
}

export async function authUpdateProfile(displayName) {
  const res = await safeFetch("/api/auth/profile", {
    method: "PATCH",
    credentials: "include",
    headers: JSON_HEADERS,
    body: JSON.stringify({ displayName }),
  });
  return parseJson(res);
}
