---
title: 记一次简单木筏求生联机
published: 2025-10-14
tags: [联机,raft]
category: '游戏'
draft: false
---

## 游戏资源

先下载这个联机修复的版本

天翼网盘：https://cloud.189.cn/t/bEz2yqFvYzua   
（访问码：bw4e）

> 或者使用二维码保存到自己的云盘先
> ![天翼云盘二维码](/assets/images/raft-link/163cloud.qrCode.jfif)

## 游戏安装步骤

解压完之后会见到如下的文件列表

![压缩包](/assets/images/raft-link/rar.png)

```bash
Raft.v1.09.rar
│  Radmin_LAN_1.4.4642.1.exe # 联机组网工具（异地联机用）
└─Raft.v1.09
  │  dlllist.txt
  │  OnlineFix.ini
  │  OnlineFix64.dll
  │  Raft.exe # 游戏文件（建议放到英文目录，打开这个即可游玩）
  │  SteamOverlay64.dll
  │  steam_api64.dll
  │  steam_appid.txt
  │  StubDRM64.dll
  │  UnityCrashHandler64.exe
  │  UnityPlayer.dll
  │  winmm.dll
  │  游戏启动说明.txt
  ├─MonoBleedingEdge
  └─Raft_Data
```

:::note
如果是局域网联机，可跳过安装，直接前往[游玩步骤](#%E6%B8%B8%E7%8E%A9%E6%AD%A5%E9%AA%A4)。
:::

## 异地联机组网步骤（同一网络跳过这个步骤）

房主创建一个 Radmin 网络

![Radmin1](/assets/images/raft-link/radmin1.png)

网络名字和密码随意，需要记住然后发送给朋友用于加入网络
![alt text](/assets/images/raft-link/radmin2.png)

朋友这边加入同一个 Radmin 网络（相当于加入同一局域网，游戏会自动识别然后进入同一局域网的房间）。

组网之后如下图所示
![Radmin](/assets/images/raft-link/radmin.png)

## 游玩步骤

首先下载 Steam，因为木筏求生这款游戏是基于 Steam 联机的。需要注意的是，不需要实际购买该游戏，只需后台运行 Steam 即可。然后房主和玩家互相添加好友即可，玩家之间无需互加。

（如果不知道如何安装 Steam，可以看这个视频 [哔哩哔哩上的 Steam 安装保姆级教程](https://www.bilibili.com/video/BV1D6N7eTE9k)，这里就不过多赘述了。Steam 国内加速下载地址：[点我下载安装 Windows Steam](https://xzz.pmnet.work/d/%E8%BD%AF%E4%BB%B6%20Software/%E7%94%B5%E8%84%91%20PC/Steam/SteamSetup.exe)、[UU加速器](https://uu.163.com/)）

:::warning
房主、房客（其他玩家）需要互相添加 Steam 好友，否则将无法加入/搜索房间。
:::

房主创建世界，难度、世界名自选，然后选择好友的名字即可加入房间。

:::note
此处如果选择“无人可以加入”，那么相当于单人游戏。
:::

![游戏界面](/assets/images/raft-link/game.png)

好友点击“加入世界”，选择你好友的房间，点击“加入世界”即可。此方案适用于异地联机（Radmin LAN）和局域网联机（直接联机即可）。

<p style="font-size:30px;text-align: center;">祝游玩愉快！</p>