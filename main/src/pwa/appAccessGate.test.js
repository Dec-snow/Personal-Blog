import test from "node:test";
import assert from "node:assert/strict";

import {
  PWA_AUTH_HOSTNAME,
  getAppAccessState,
  shouldShowOwnerLoginActions,
  shouldExposeAppConsole,
  shouldOpenAppConsoleAtRoot,
  shouldRequireOwnerLogin,
  userHasOwnerAppAccess,
} from "./appAccessGate.js";

test("requires owner login only on the PWA app host", () => {
  assert.equal(shouldRequireOwnerLogin({ hostname: PWA_AUTH_HOSTNAME }), true);
  assert.equal(shouldRequireOwnerLogin({ hostname: "hoarfrost.cloud" }), false);
  assert.equal(shouldRequireOwnerLogin({ hostname: "www.hoarfrost.cloud" }), false);
  assert.equal(shouldRequireOwnerLogin({ hostname: "localhost" }), false);
});

test("allows only owner sessions to enter the PWA app", () => {
  assert.equal(
    userHasOwnerAppAccess({ loggedIn: true, unlimited: true, user: { isOwner: true } }),
    true,
  );
  assert.equal(
    userHasOwnerAppAccess({ loggedIn: true, unlimited: false, user: { isOwner: true } }),
    false,
  );
  assert.equal(
    userHasOwnerAppAccess({ loggedIn: true, unlimited: true, user: { isOwner: false } }),
    false,
  );
  assert.equal(userHasOwnerAppAccess({ loggedIn: false }), false);
});

test("keeps public site open while blocking non-owner app sessions", () => {
  assert.equal(
    getAppAccessState({
      hostname: "hoarfrost.cloud",
      auth: { loggedIn: false },
      isLoading: false,
    }),
    "allowed",
  );
  assert.equal(
    getAppAccessState({
      hostname: PWA_AUTH_HOSTNAME,
      auth: { loggedIn: false },
      isLoading: false,
    }),
    "blocked",
  );
  assert.equal(
    getAppAccessState({
      hostname: PWA_AUTH_HOSTNAME,
      auth: { loggedIn: true, unlimited: true, user: { isOwner: true } },
      isLoading: false,
    }),
    "allowed",
  );
});

test("reports loading while checking PWA app auth", () => {
  assert.equal(
    getAppAccessState({
      hostname: PWA_AUTH_HOSTNAME,
      auth: null,
      isLoading: true,
    }),
    "loading",
  );
});

test("keeps the app visible while an allowed owner session is rechecked", () => {
  assert.equal(
    getAppAccessState({
      hostname: PWA_AUTH_HOSTNAME,
      auth: { loggedIn: true, unlimited: true, user: { isOwner: true } },
      isLoading: true,
    }),
    "allowed",
  );
});

test("shows login actions only after auth check blocks access", () => {
  assert.equal(shouldShowOwnerLoginActions("loading"), false);
  assert.equal(shouldShowOwnerLoginActions("allowed"), false);
  assert.equal(shouldShowOwnerLoginActions("blocked"), true);
});

test("opens the app console from the PWA host root only", () => {
  assert.equal(
    shouldOpenAppConsoleAtRoot({ hostname: PWA_AUTH_HOSTNAME, pathname: "/" }),
    true,
  );
  assert.equal(
    shouldOpenAppConsoleAtRoot({ hostname: PWA_AUTH_HOSTNAME, pathname: "/app" }),
    false,
  );
  assert.equal(
    shouldOpenAppConsoleAtRoot({ hostname: "hoarfrost.cloud", pathname: "/" }),
    false,
  );
  assert.equal(
    shouldOpenAppConsoleAtRoot({ hostname: "localhost", pathname: "/" }),
    false,
  );
});

test("exposes the app console only on the PWA host and local development", () => {
  assert.equal(shouldExposeAppConsole({ hostname: PWA_AUTH_HOSTNAME }), true);
  assert.equal(shouldExposeAppConsole({ hostname: "localhost" }), true);
  assert.equal(shouldExposeAppConsole({ hostname: "127.0.0.1" }), true);
  assert.equal(shouldExposeAppConsole({ hostname: "::1" }), true);
  assert.equal(shouldExposeAppConsole({ hostname: "hoarfrost.cloud" }), false);
  assert.equal(shouldExposeAppConsole({ hostname: "www.hoarfrost.cloud" }), false);
});
