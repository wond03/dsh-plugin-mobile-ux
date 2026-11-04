/**
 * dsh-plugin-mobile-ux —— 宿主侧（Node）半身。
 * 本插件只做浏览器端表现增强，服务端不需要任何行为：
 * 空 apply 让 Loader 有一行宿主条目，浏览器半身通过 exports["./client"] 下发。
 */
export function apply() {}

export const name = "dsh-plugin-mobile-ux";

export const inject = [];
