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
  };
}
