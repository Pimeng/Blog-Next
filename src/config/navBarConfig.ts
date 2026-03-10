import I18nKey from "../i18n/i18nKey";
import { i18n } from "../i18n/translation";
import type { NavBarConfig } from "../types/config";
import { LinkPreset } from "../types/config";

export const navBarConfig: NavBarConfig = {
  links: [
    LinkPreset.Home,
    LinkPreset.Archive,
    // 工具下拉菜单
    {
      name: i18n(I18nKey.tools),
      url: "/tools/",
      icon: "material-symbols:build",
      children: [
        {
          name: i18n(I18nKey.scheduleConverter),
          url: "/schedule_converter/",
          icon: "material-symbols:calendar-month",
        },
      ],
    },
    // 支持自定义导航栏链接,并且支持多级菜单
    {
      name: "链接",
      url: "/links/",
      icon: "material-symbols:link",
      children: [
        {
          name: "GitHub",
          url: "https://github.com/Pimeng",
          external: true,
          icon: "fa6-brands:github",
        },
        {
          name: "Bilibili",
          url: "https://space.bilibili.com/36191664",
          external: true,
          icon: "fa6-brands:bilibili",
        },
      ],
    },
    {
      name: "关于",
      url: "/content/",
      icon: "material-symbols:info",
      children: [LinkPreset.About, LinkPreset.Friends],
    },
  ],
};
