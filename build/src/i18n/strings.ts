export type Lang = 'zh' | 'en';

export const STR = {
  zh: {
    blogTitle: 'hoarfrost 创作屋',
    navHome: '首页',
    navArchive: '归档',
    navArticle: '文章',
    footerLine: 'hoarfrost © 2026',
    archiveTitle: '归档',
    archiveLead: '时光轴',
    articlesTitle: '文章',
    metaWords: '字',
    metaReads: '阅读',
    metaMinutes: '约',
    metaMinSuffix: '分钟',
    tagDone: '完成',
  },
  en: {
    blogTitle: 'hoarfrost Studio',
    navHome: 'Home',
    navArchive: 'Archives',
    navArticle: 'Posts',
    footerLine: 'hoarfrost © 2026',
    archiveTitle: 'Archives',
    archiveLead: 'Timeline',
    articlesTitle: 'Posts',
    metaWords: 'words',
    metaReads: 'reads',
    metaMinutes: '~',
    metaMinSuffix: 'min read',
    tagDone: 'Done',
  },
} as const;

export type I18nKey = keyof typeof STR.zh;
