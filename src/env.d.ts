/// <reference path="../.astro/types.d.ts" />

/**
 * 全局类型声明
 * Astro 环境类型由框架自动注入
 */

declare module "colorthief" {
  export default class ColorThief {
    getColor(source: HTMLImageElement | string, quality?: number): Promise<[number, number, number]>;
    getPalette(source: HTMLImageElement | string, colorCount?: number, quality?: number): Promise<[number, number, number][]>;
  }
}
