---
title: Yunzai安装的踩坑记录
published: 2026-09-29
category: 记录
tags: [推文]
description: 踩坑记录
draft: false
image: "api"
---

## 0x01

首先是一键安装指令

```bash
sudo apt update
sudo apt install git curl wget redis-server -y
```

这样能装上Yunzai必须的 git redis ，剩下的慢慢装

安装完之后装一下国内源的 Nvm，具体可参考 [这里](https://gitee.com/RubyMetric/nvm-cn)，这里不过多介绍，直接贴指令

```bash
bash -c "$(curl -fsSL https://gitee.com/RubyMetric/nvm-cn/raw/main/install.sh)"
```

安装完成之后可以重启一下Shell或者直接

```bash
source ~/.nvm/nvm.sh
```

如果要卸载，可执行

```bash
bash -c "$(curl -fsSL https://gitee.com/RubyMetric/nvm-cn/raw/main/uninstall.sh)"
```

然后下载目前最稳的一个版本

```bash
nvm i 22
nvm use 22
```

换源~

```bash
npm config set registry https://registry.npmmirror.com
```

接下来是 pnpm

```bash
npm install -g pnpm
```

pnpm 换源

```bash
pnpm config set registry https://registry.npmmirror.com
```

然后接下来是 clone Yunzai本体，这里使用TRSS-Yunzai

```bash
git clone --depth=1 https://github.com/TimeRainStarSky/Yunzai
```

> [!NOTE]
> depth=1 是最小化安装，确保不拉所有的历史

> [!TIP]
> 如果安装过慢（通常发生在国内服务器），可以在链接头部加 `https://gh-proxy.com` ，例如： `https://gh-proxy.com/https://github.com/TimeRainStarSky/Yunzai`

然后进入目录

```bash
cd Yunzai
```

安装依赖

```bash
pnpm i
```

这里如果出现需要让你 approve-build 的，先不要着急，这一步就是安装浏览器（不推荐直接用apt去安装，国内服务器安装贼慢，而且snap特别屎）

先下载最新版Chrome

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
```

然后安装

```bash
sudo apt install ./google-chrome-stable_current_amd64.deb
```

安装完成之后，再执行

```bash
pnpm approve-builds
```

这时会弹出一个选项，按空格选中那两个，然后回车确认就行了

然后你可以愉快的使用 `node .` 启动辣