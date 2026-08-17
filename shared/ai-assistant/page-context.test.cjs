const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildPageContext,
  createChatPayload,
  normalizeWhitespace,
} = require("./page-context.js");

test("normalizes noisy visible page text into a compact page context", () => {
  const context = buildPageContext({
    pageUrl: "https://hoarfrost.cloud/about",
    pageTitle: "About hoarfrost",
    pagePath: "/about",
    language: "zh-CN",
    siteSection: "main",
    headings: ["About", "", "  技术栈  "],
    visibleText: "  关于 hoarfrost\n\n这里介绍博客由来、技术栈和联系方式。  ",
  });

  assert.equal(context.pagePath, "/about");
  assert.deepEqual(context.headings, ["About", "技术栈"]);
  assert.equal(
    context.visibleText,
    "关于 hoarfrost 这里介绍博客由来、技术栈和联系方式。"
  );
});

test("chat payload includes structured page context as evidence for the bot", () => {
  const context = buildPageContext({
    pageUrl: "https://hoarfrost.cloud/about",
    pageTitle: "About hoarfrost",
    pagePath: "/about",
    visibleText: "这是关于页面的真实正文。",
  });

  const payload = createChatPayload("这个页面有什么？", context);

  assert.equal(payload.message, "这个页面有什么？");
  assert.equal(payload.pageUrl, "https://hoarfrost.cloud/about");
  assert.equal(payload.pageTitle, "About hoarfrost");
  assert.equal(payload.pageContext.visibleText, "这是关于页面的真实正文。");
});

test("normalizeWhitespace removes repeated whitespace without losing words", () => {
  assert.equal(normalizeWhitespace(" A\n\nB\t C  "), "A B C");
});
