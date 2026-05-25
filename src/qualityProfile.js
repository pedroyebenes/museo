const isMobile =
  window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;

export function getQualityProfile() {
  if (isMobile) {
    return {
      isMobile: true,
      antialias: false,
      maxPixelRatio: 1,
      maxTextureSize: 1024,
      floorSegments: 48,
      domeWidthSegments: 48,
      domeHeightSegments: 24,
      torusSegments: 48,
      columnSegments: 12,
      architectureTextureSize: {
        wall: 512,
        wainscotW: 512,
        wainscotH: 256,
        floor: 1024,
        ceiling: 512,
        hubMarble: 1024,
      },
      anisotropy: 4,
      enableNormalMaps: false,
    };
  }
  return {
    isMobile: false,
    antialias: true,
    maxPixelRatio: 2,
    maxTextureSize: 2048,
    floorSegments: 72,
    domeWidthSegments: 72,
    domeHeightSegments: 40,
    torusSegments: 96,
    columnSegments: 16,
    architectureTextureSize: {
      wall: 1024,
      wainscotW: 1024,
      wainscotH: 512,
      floor: 2048,
      ceiling: 1024,
      hubMarble: 2048,
    },
    anisotropy: 8,
    enableNormalMaps: true,
  };
}
