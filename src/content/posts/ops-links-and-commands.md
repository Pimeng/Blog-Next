---
title: 镜像源和常用命令汇总
published: 2026-04-09
tags: [脚本,地址,命令]
category: '汇总'
draft: false
image: "api"
---

本篇汇总一些常用的镜像源和命令，内容正在持续更新中

## 镜像源

### Python / Pypi 镜像源

更新pip （使用国内镜像源）：

```bash
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple --upgrade pip
```

设置全局默认镜像源：

```bash
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
```

安装包时临时使用镜像源：

```bash
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple numpy
```

:::NOTE
上述 `https://pypi.tuna.tsinghua.edu.cn/simple` 可换成下面任意一个镜像源地址
:::

- 清华大学TUNA镜像源： https://pypi.tuna.tsinghua.edu.cn/simple
- 华为云镜像源： https://repo.huaweicloud.com/repository/pypi/simple
- 阿里云镜像源： http://mirrors.aliyun.com/pypi/simple
- 腾讯云镜像源：https://mirrors.cloud.tencent.com/pypi/simple
- 上海交通大学镜像源：https://mirror.sjtu.edu.cn/pypi/web/simple
- 中国科学技术大学镜像源： https://mirrors.ustc.edu.cn/pypi/simple

### Node.js

#### NVM（官方Node.js管理器）： 

GitHub官方：
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```

志辉制作的 Gitee 国内加速一键安装脚本：

```bash
/bin/bash -c "$(curl -fsSL https://gitee.com/iamzhihuix/nvm-install-cn/raw/main/install.sh)"
```

完成后，安装 Node.js：

```bash
nvm i 24
```

设置默认版本

```bash
nvm use 24
nvm alias default 24
```

#### NPM 镜像源

:::NOTE
推荐使用 [淘宝镜像源](https://npmmirror.com/)，速度快且稳定
:::

- 淘宝镜像源： https://registry.npmmirror.com
- 华为云镜像源： https://mirrors.huaweicloud.com/repository/npm/
- 腾讯云镜像源：https://mirrors.cloud.tencent.com/npm/

换源：

```bash
npm config set registry https://registry.npmmirror.com
```

全局换源：

```bash
npm config -g set registry https://registry.npmmirror.com
```

## Go 模块代理

- 七牛 https://goproxy.cn
- 阿里云 https://mirrors.aliyun.com/goproxy/
- 官方 https://goproxy.io

设置 Go 模块代理：

七牛

```bash
go env -w GOPROXY=https://goproxy.cn,direct
```

阿里云

```bash
go env -w GOPROXY=https://mirrors.aliyun.com/goproxy/,direct

```

官方

```bash
go env -w GOPROXY=https://goproxy.io,direct
```

### Linux 软件源

:::NOTE
推荐使用 LinuxMirrors 换源脚本
:::

```bash
bash <(curl -sSL https://linuxmirrors.cn/main.sh)
```

1. 备份当前的软件源列表：

```bash
sudo cp /etc/apt/sources.list /etc/apt/sources.list_bak
```

2. 编辑软件源列表：

```bash
sudo vim /etc/apt/sources.list
```

:::NOTE
不会用Vim？ 可以使用nano或者查看 [教程](https://www.runoob.com/linux/linux-vim.html)
:::

3. 替换为国内镜像源

阿里云镜像源：

```bash
deb http://mirrors.aliyun.com/ubuntu/ bionic main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ bionic-security main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ bionic-updates main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ bionic-backports main restricted universe multiverse
```

清华大学镜像源：

```bash
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ bionic main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ bionic-security main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ bionic-updates main restricted universe multiverse
deb https://mirrors.tuna.tsinghua.edu.cn/ubuntu/ bionic-backports main restricted universe multiverse
```

中科大镜像源：

```bash
deb https://mirrors.ustc.edu.cn/ubuntu/ bionic main restricted universe multiverse
deb https://mirrors.ustc.edu.cn/ubuntu/ bionic-security main restricted universe multiverse
deb https://mirrors.ustc.edu.cn/ubuntu/ bionic-updates main restricted universe multiverse
deb https://mirrors.ustc.edu.cn/ubuntu/ bionic-backports main restricted universe multiverse
```

## Docker

### 安装脚本

:::NOTE
推荐使用 LinuxMirrors 的 Docker 安装脚本，方便快捷
:::

```bash
bash <(curl -sSL https://linuxmirrors.cn/docker.sh)
```

### 镜像源（仅支持合法镜像）

- ⭐推荐：毫秒镜像： https://docker.1ms.run
- 轩辕镜像：https://docker.xuanyuan.me
- 1Panel：https://docker.1panel.live
- https://docker.gh-proxy.org

临时使用（以nginx示例）：

```bash
docker pull docker.1ms.run/library/nginx:latest
```

## GitHub 代理加速

### 仓库 / Release 加速

:::CAUTION
注：不会提供GitHub能够登录的代理地址，以下地址仅用于加速GitHub的Git克隆和访问，无法登录GitHub账号
:::

- https://gh-proxy.com/
- https://ghproxy.net/
- https://ghfast.top/

使用：

```bash
git clone https://gh-proxy.com/https://github.com/YourName/YourRepo.git
```

我们推荐您基于开源项目搭建自己的GitHub代理加速服务 https://github.com/hunshcn/gh-proxy

### GHCR （GitHub Container Registry） 加速

- ⭐推荐：毫秒镜像： https://ghcr.1ms.run

使用：

```bash
docker pull ghcr.1ms.run/owner/image:tag
```