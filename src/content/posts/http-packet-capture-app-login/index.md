---
title: 抓包实战之——APP登录篇
published: 2026-04-28
category: 教程
tags: [抓包, 网络, 实战]
description: 本篇介绍了比较详细的抓包实战记录
draft: false
image: "api"
---

## 0x00 被测环境

本篇使用 `Reqable` 双端协同工具进行演示，使用 `Phira` 作为被测APP，使用 `Mumu模拟器` 作为已经被Root的设备（配置SSL证书信任需要）

Mumu模拟器 需要打开可写系统盘，并开启Root权限

![Mumu模拟器 可写系统盘](./mumu-writable-systemdisk.png)
![Mumu模拟器 Root](./mumu-root-permission.png)

## 0x01 安装抓包工具

![Mumu模拟器主页](./mumu-screenshot.png)

安装如图工具（[Reqable](//reqable.com/zh-CN/download/)、[MT管理器](//mt2.cn)）和被测软件

[电脑版 Reqable](//reqable.com/zh-CN/download/)

## 0x02 工具配置

打开 Reqable ，同意用户许可协议

![Reqable APP](./reqable-app-1.png)

工作模式选择 `协同模式`

![Reqable APP](./reqable-app-2.png)

点击左上角三横，打开配置菜单

![Reqable APP](./reqable-app-3.png)

找到 `远程设备`

![Reqable APP](./reqable-app-4.png)

选择 `扫描二维码`

![Reqable APP](./reqable-app-5.png)

然后选择实时截屏，打开电脑的 Reqable ，找到类似手机的图标

![Reqable Desktop](./reqable-desktop-1.png)

将 Mumu模拟器 的扫码框移动到 Reqable 电脑版的二维码上面，此时应该扫码成功，然后提示 `设备已连接`（如下图）

![Reqable APP](./reqable-app-6.png)

> [!IMPORTANT] 重要
> 如果使用真实手机，请别忘了电脑和手机需要保持在一个 WiFi/网络 下

然后点击右上角黄色感叹号，和电脑同步一遍证书（此处不再截图演示）

然后打开三横菜单，找到证书管理，此时顶上 `安装根证书到本机` 底下应为红色的 `证书未安装` 属于正常情况，下面将进行安装证书

点击 `安装根证书到本机`

![Reqable APP Cert](./reqable-app-cert-1.png)

点击红框标记的下划线地方（你的证书名字正常和我的是不一样的，以你那边的为准即可）

然后会弹出一个保存文件名的选项，此时保持默认即可，然后点击保存

![Reqable APP Cert](./reqable-app-cert-2.png)

然后先把 Reqable 关掉，打开 MT管理器

此时应该会自动弹出超级用户访问权限的提示，点击 `永久记住此选择` ，然后选择允许

![MT管理器](./mt-manager-notice.png)

左边列表依次点击 `Download` → `Reqable`，此时应该能见到刚刚你保存的证书文件

![MT管理器](./mt-manager-file-1.png)

然后右侧列表点击上方 `..` 回退到系统根目录（即左上角从 `/storage/emulated/0/` 到 `/` ，往下滑找到 `system` 

![MT管理器](./mt-manager-file-2.png)

依次点击 `etc` → `security` → `cacerts` ，会来到一个很多看起来像 “乱码” 的文件列表，无需理会，接下来，长按左边 Reqable 保存的证书文件，在弹出的提示框点击复制


> [!note] 注意
> 如果出现了 `挂载读写失败` ，则检查 [被测环境](#0x00-%E8%A2%AB%E6%B5%8B%E7%8E%AF%E5%A2%83) 中的 可写系统盘 是否已经配置正确，如果配置正确，请重启一遍 Mumu模拟器 后重试
> ![alt text](./mt-error-1.png)

完成后，右侧列表应多出一个左边的文件

![MT管理器](./mt-manager-file-3.png)

然后打开 Reqable ，此时应该不会出现证书警告

![Reqable APP](./reqable-app-cert-3.png)

## 0x03 实战

点击右下角箭头，此时开始监听http包体

> [!TIP] 小建议
> 可以打开 Mumu模拟器 的分离标签页功能以获得更好的体验

打开被测软件，如果一切正常，在电脑 Reqable 上能看到被测APP的一些请求

![被测APP](./phira-app-1.png)

我们正常尝试这个被测APP的登录操作

## 0x04 收尾

好的，一下就遇到了内置SSL证书的被测APP，先跑路，后面再补充这个文章（（（