import test from "node:test";
import assert from "node:assert/strict";

import {
  getNotificationTotal,
  ownerConsoleAvatars,
  ownerConsoleModules,
  ownerConsoleNotifications,
  ownerConsoleScreens,
  publishSteps,
} from "./appConsoleBlueprint.js";

test("owner console screens contain home, moments and gallery", () => {
  assert.deepEqual(
    ownerConsoleScreens.map((screen) => screen.id),
    ["home", "moments", "gallery"],
  );
  assert.equal(ownerConsoleScreens[0].title, "后端控制台");
  assert.equal(ownerConsoleScreens[1].title, "发布随笔");
});

test("owner console modules match frontend blog features", () => {
  assert.deepEqual(
    ownerConsoleModules.map((module) => module.title),
    ["发布随笔", "相册图片"],
  );
  assert.deepEqual(ownerConsoleNotifications, []);
  assert.equal(getNotificationTotal(ownerConsoleNotifications), 0);
});

test("defines avatar choices and the original publish automation steps", () => {
  assert.equal(ownerConsoleAvatars.length, 3);
  assert.equal(ownerConsoleAvatars[0].initial, "控");
  assert.deepEqual(publishSteps, [
    "检查内容",
    "上传图片",
    "生成页面",
    "发布到网站",
    "检查线上结果",
  ]);
});
