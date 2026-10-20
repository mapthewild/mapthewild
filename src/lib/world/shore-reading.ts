/** The essays are rendered from their original MDX in explore.astro. */
export const SHORE_ESSAY_SLUGS=['nowbrary-living-constellation','starting-your-nowbrary'] as const;
export type ShoreEssaySlug=typeof SHORE_ESSAY_SLUGS[number];
export type ShoreEssay={slug:ShoreEssaySlug;title:string;description:string;minutes:number};
export type LensOrigin={x:number;y:number};
