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
如果是局域网联机跳过安装直接到[游戏联机](#%E6%B8%B8%E7%8E%A9%E6%AD%A5%E9%AA%A4)步骤）
:::

## 异地联机组网步骤（同一网络跳过这个步骤）

房主创建一个Radmin网络

![Radmin1](/assets/images/raft-link/radmin1.png)

网络名字和密码随意，需要记住然后发送给朋友用于加入网络
![alt text](/assets/images/raft-link/radmin2.png)

朋友这边加入同一个Radmin网络（相当于加入同一局域网，游戏会自动识别然后进入同一局域网的房间）

组网之后如下图所示
![Radmin](/assets/images/raft-link/radmin.png)

## 游玩步骤

房主创建世界，难度、世界名自选，然后选择好友可以加入

:::note
此处如果选择 “无人可以加入” 那么相当于单人游戏了
:::

![游戏界面](/assets/images/raft-link/game.png)

然后好友方面点击加入世界，然后选择你好友的名字的房间，点击 “加入世界” 即可，此方案可以适用于异地联机（Radmin Lan）和局域网联机（直接联机即可）

<p style="font-size:30px;text-align: center;">祝游玩愉快！</p>