import legalContentData from './legal-content.json';

export const legalContent = legalContentData;
export type LegalContentType = typeof legalContent;
export type LanguageKey = keyof typeof legalContent;
export type DocumentKey = keyof typeof legalContent.en;
