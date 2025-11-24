import { GameAssets } from '../types';
import { ASSET_URLS } from '../constants';

export const loadAssets = (): Promise<GameAssets> => {
  return new Promise((resolve, reject) => {
    let loadedCount = 0;
    const totalAssets = 7;
    const assets: Partial<GameAssets> = {};

    const checkDone = () => {
      loadedCount++;
      if (loadedCount === totalAssets) {
        resolve(assets as GameAssets);
      }
    };

    const loadImage = (key: keyof GameAssets, src: string) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        assets[key] = img;
        checkDone();
      };
      img.onerror = () => {
        console.warn(`Failed to load asset: ${src}, using fallback.`);
        // Create a dummy canvas as fallback so game doesn't crash
        const canvas = document.createElement('canvas');
        canvas.width = 50;
        canvas.height = 50;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = 'red';
            ctx.fillRect(0,0,50,50);
        }
        assets[key] = canvas as unknown as HTMLImageElement; // Cast for TS
        checkDone();
      };
    };

    // In a real app with the files mentioned in the prompt:
    // Ensure these files exist in your public folder or are imported
    loadImage('logo', ASSET_URLS.LOGO);
    loadImage('box', ASSET_URLS.BOX);
    loadImage('nugget', ASSET_URLS.NUGGET);
    loadImage('boss', ASSET_URLS.BOSS);
    loadImage('ribbon', ASSET_URLS.RIBBON);
    loadImage('banana', ASSET_URLS.BANANA);
    loadImage('apple', ASSET_URLS.APPLE);
  });
};