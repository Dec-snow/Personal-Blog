import { mockBangumiList } from "../data/acgMock.js";

export async function getBangumiList() {
  // 静态番剧数据，不调用后端 API，不启用同步功能
  return mockBangumiList;
}
