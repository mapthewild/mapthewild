import { assetPath } from './assetPath';

export const siteAssets = {
  compassHero: assetPath('assets/images/italian-compass.png'),

  territories: {
    nowbrary: assetPath('assets/images/territories/nowbrary-cover.png'),
    map: assetPath('assets/images/territories/map-cover.png'),
    sundayRitual: assetPath('assets/images/territories/sunday-ritual-cover.png'),
  },

  articles: {
    spotifyWrapped: assetPath('assets/images/articles/spotify-wrapped-lighthouse.png'),
  },

  mapIcons: {
    start: assetPath('assets/icons/compass-marker.png'),
    territory: assetPath('assets/icons/banner-marker.png'),
    subcategory: assetPath('assets/icons/ship-marker.png'),
    article: assetPath('assets/icons/feather-marker.png'),
  },

  voyageIcons: {
    home: assetPath('assets/icons/compass-marker.png'),
    territory: assetPath('assets/icons/banner-marker.png'),
    post: assetPath('assets/icons/feather-marker.png'),
    ship: assetPath('assets/icons/ship-marker.png'),
  },
} as const;

export type MapAssetNodeType = keyof typeof siteAssets.mapIcons;
