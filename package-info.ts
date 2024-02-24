import { resolve } from 'node:path';
import type { MonkeyUserScript } from "vite-plugin-monkey";
import packageInfo from "./package.json" assert { type: "json" };

export interface BuildInfo {
    entryPoint: string;
    version: string;
    fileName: string;
    userscriptConfig: MonkeyUserScript;
}
const entryPoint = resolve('./src/index.ts');
const githubRepo = packageInfo.repository.url;
const fileName = "maps_addons.user.js";

const userscriptConfig: MonkeyUserScript = {
    name: {
        "": packageInfo.displayName,
        ko: "원신 맵스 부가기능",
    },
    description: {
        "": packageInfo.description,
        ko: "원신 맵스에 여러 부가기능을 추가합니다.",
    },
    version: packageInfo.version,
    icon: "https://genshin.gamedot.org/asset/xapp-icon128.png.pagespeed.ic.zyAE0ntk9a.webp",
    namespace: "genshin-maps-app/addons",
    match: ["https://genshin.gamedot.org/?mid=genshinmaps"],
    downloadURL: `${githubRepo}/raw/gh-pages/userscript/${fileName}`,
    updateURL: `${githubRepo}/raw/gh-pages/userscript/${fileName}`,
};

export const buildInfo: BuildInfo = {
    entryPoint: resolve('./src/index.ts'),
    version: packageInfo.version,
    fileName,
    userscriptConfig,
};