export const PWA_AUTH_HOSTNAME = "app.hoarfrost.cloud";

function isLocalhost(hostname = "") {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function shouldRequireOwnerLogin({ hostname = "" } = {}) {
  return hostname === PWA_AUTH_HOSTNAME;
}

export function shouldOpenAppConsoleAtRoot({ hostname = "", pathname = "" } = {}) {
  return shouldRequireOwnerLogin({ hostname }) && pathname === "/";
}

function extraConsoleHosts() {
  // Allow configuring additional console hosts via env (comma-separated).
  // Injected at build time by Vite (import.meta.env).
  if (import.meta.env && import.meta.env.VITE_CONSOLE_HOSTS) {
    return import.meta.env.VITE_CONSOLE_HOSTS.split(",").map((h) => h.trim()).filter(Boolean);
  }
  return [];
}

export function shouldExposeAppConsole({ hostname = "" } = {}) {
  if (shouldRequireOwnerLogin({ hostname })) return true;
  if (isLocalhost(hostname)) return true;
  const extra = extraConsoleHosts();
  if (extra.includes(hostname)) return true;
  // Legacy hardcoded fallback
  return hostname === "hoarfrost.cloud" || hostname === "www.hoarfrost.cloud";
}

export function userHasOwnerAppAccess(auth) {
  return Boolean(auth?.loggedIn && auth?.unlimited && auth?.user?.isOwner);
}

export function getAppAccessState({ hostname = "", auth, isLoading = false } = {}) {
  if (!shouldRequireOwnerLogin({ hostname })) return "allowed";
  if (userHasOwnerAppAccess(auth)) return "allowed";
  if (isLoading) return "loading";
  return "blocked";
}

export function shouldShowOwnerLoginActions(accessState) {
  return accessState === "blocked";
}
