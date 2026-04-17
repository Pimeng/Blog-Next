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

### Linux 软件源

:::NOTE
推荐使用 LinuxMirrors 换源脚本
:::

::code-group{title="换源脚本" description="按你当前环境选择命令，适合在同一位置切换 curl / wget 等不同写法" language="bash" default="curl" options='[{"label":"curl","description":"适用于已安装 curl 的环境","code":"bash <(curl -sSL https://linuxmirrors.cn/main.sh)"},{"label":"wget","description":"适用于已安装 wget 的环境。","code":"bash <(wget -qO- https://linuxmirrors.cn/main.sh)"}]'}

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

::mirror-switcher{title="Ubuntu 镜像源探测与切换" description="会将 sources.list 中的 Ubuntu 源地址批量替换为所选镜像并执行 apt update；结果仅代表你当前网络环境。" language="bash" default="清华" timeout="3500" options='[{"label":"阿里云","value":"http://mirrors.aliyun.com/ubuntu/","probe":"http://mirrors.aliyun.com/ubuntu/","code":"sudo sed -Ei \"s|https?://[^ ]+/ubuntu/|http://mirrors.aliyun.com/ubuntu/|g\" /etc/apt/sources.list && sudo apt update"},{"label":"清华","value":"https://mirrors.tuna.tsinghua.edu.cn/ubuntu/","probe":"https://mirrors.tuna.tsinghua.edu.cn/ubuntu/","code":"sudo sed -Ei \"s|https?://[^ ]+/ubuntu/|https://mirrors.tuna.tsinghua.edu.cn/ubuntu/|g\" /etc/apt/sources.list && sudo apt update"},{"label":"中科大","value":"https://mirrors.ustc.edu.cn/ubuntu/","probe":"https://mirrors.ustc.edu.cn/ubuntu/","code":"sudo sed -Ei \"s|https?://[^ ]+/ubuntu/|https://mirrors.ustc.edu.cn/ubuntu/|g\" /etc/apt/sources.list && sudo apt update"}]'}

### Python / Pypi 镜像源

::mirror-switcher{title="Python / PyPI 镜像源探测与切换" description="绿色圆点表示当前浏览器可以连通，红色感叹号表示超时或失败；结果仅代表你当前网络环境。" language="bash" default="清华 TUNA" timeout="3500" options='[{"label":"清华 TUNA","value":"https://pypi.tuna.tsinghua.edu.cn/simple","probe":"https://pypi.tuna.tsinghua.edu.cn/simple","code":"pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple"},{"label":"华为云","value":"https://repo.huaweicloud.com/repository/pypi/simple","probe":"https://repo.huaweicloud.com/repository/pypi/simple","code":"pip config set global.index-url https://repo.huaweicloud.com/repository/pypi/simple"},{"label":"阿里云","value":"http://mirrors.aliyun.com/pypi/simple","probe":"http://mirrors.aliyun.com/pypi/simple","code":"pip config set global.index-url http://mirrors.aliyun.com/pypi/simple"},{"label":"腾讯云","value":"https://mirrors.cloud.tencent.com/pypi/simple","probe":"https://mirrors.cloud.tencent.com/pypi/simple","code":"pip config set global.index-url https://mirrors.cloud.tencent.com/pypi/simple"},{"label":"上海交大","value":"https://mirror.sjtu.edu.cn/pypi/web/simple","probe":"https://mirror.sjtu.edu.cn/pypi/web/simple","code":"pip config set global.index-url https://mirror.sjtu.edu.cn/pypi/web/simple"},{"label":"中科大","value":"https://mirrors.ustc.edu.cn/pypi/simple","probe":"https://mirrors.ustc.edu.cn/pypi/simple","code":"pip config set global.index-url https://mirrors.ustc.edu.cn/pypi/simple"}]'}

如果你只想手动执行，也可以直接复制：

```bash
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple --upgrade pip
pip install -i <MIRROR_URL> numpy
```

### Node.js

#### NVM（官方Node.js管理器）： 

::mirror-switcher{title="NVM 安装脚本地址探测与切换" description="用于选择 NVM 安装脚本下载地址；结果仅代表你当前网络环境。" language="bash" default="GitHub 官方" timeout="3500" options='[{"label":"GitHub 官方","value":"https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh","probe":"https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh","code":"curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash"},{"label":"Gitee 加速脚本","value":"https://gitee.com/iamzhihuix/nvm-install-cn/raw/main/install.sh","probe":"https://gitee.com/iamzhihuix/nvm-install-cn/raw/main/install.sh","code":"/bin/bash -c \"$(curl -fsSL https://gitee.com/iamzhihuix/nvm-install-cn/raw/main/install.sh)\""}]'}

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

::mirror-switcher{title="NPM 镜像源探测与切换（当前用户）" description="绿色圆点表示当前浏览器可以连通，红色感叹号表示超时或失败；结果仅代表你当前网络环境。" language="bash" default="npmmirror" timeout="3500" options='[{"label":"npmmirror","value":"https://registry.npmmirror.com","probe":"https://registry.npmmirror.com","code":"npm config set registry https://registry.npmmirror.com"},{"label":"华为云","value":"https://mirrors.huaweicloud.com/repository/npm/","probe":"https://mirrors.huaweicloud.com/repository/npm/","code":"npm config set registry https://mirrors.huaweicloud.com/repository/npm/"},{"label":"腾讯云","value":"https://mirrors.cloud.tencent.com/npm/","probe":"https://mirrors.cloud.tencent.com/npm/","code":"npm config set registry https://mirrors.cloud.tencent.com/npm/"}]'}

::mirror-switcher{title="NPM 镜像源探测与切换（全局）" description="需要管理员权限时请在命令前加 sudo；结果仅代表你当前网络环境。" language="bash" default="npmmirror" timeout="3500" options='[{"label":"npmmirror","value":"https://registry.npmmirror.com","probe":"https://registry.npmmirror.com","code":"npm config -g set registry https://registry.npmmirror.com"},{"label":"华为云","value":"https://mirrors.huaweicloud.com/repository/npm/","probe":"https://mirrors.huaweicloud.com/repository/npm/","code":"npm config -g set registry https://mirrors.huaweicloud.com/repository/npm/"},{"label":"腾讯云","value":"https://mirrors.cloud.tencent.com/npm/","probe":"https://mirrors.cloud.tencent.com/npm/","code":"npm config -g set registry https://mirrors.cloud.tencent.com/npm/"}]'}

### Go 模块代理

::mirror-switcher{title="Go 模块代理探测与切换" description="绿色圆点表示当前浏览器可以连通，红色感叹号表示超时或失败；结果仅代表你当前网络环境。" language="bash" default="七牛" timeout="3500" options='[{"label":"官方","value":"https://goproxy.io","probe":"https://goproxy.io","code":"go env -w GOPROXY=https://goproxy.io,direct"},{"label":"七牛","value":"https://goproxy.cn","probe":"https://goproxy.cn","code":"go env -w GOPROXY=https://goproxy.cn,direct"},{"label":"阿里云","value":"https://mirrors.aliyun.com/goproxy/","probe":"https://mirrors.aliyun.com/goproxy/","code":"go env -w GOPROXY=https://mirrors.aliyun.com/goproxy/,direct"}]'}

如果你只想手动执行，也可以直接复制下面任意一条：

```bash
go env -w GOPROXY=https://goproxy.cn,direct
go env -w GOPROXY=https://mirrors.aliyun.com/goproxy/,direct
go env -w GOPROXY=https://goproxy.io,direct
```


### Docker

#### 安装脚本

:::NOTE
推荐使用 LinuxMirrors 的 Docker 安装脚本，方便快捷
:::

::code-group{title="安装脚本" description="按你当前环境选择命令，适合在同一位置切换 curl / wget 等不同写法。" language="bash" default="curl" options='[{"label":"curl","description":"适用于已安装 curl 的环境。","code":"bash <(curl -sSL https://linuxmirrors.cn/docker.sh)"},{"label":"wget","description":"适用于已安装 wget 的环境。","code":"bash <(wget -qO- https://linuxmirrors.cn/docker.sh)"}]'}

#### 镜像源（仅支持合法镜像）

::mirror-switcher{title="Docker 镜像地址探测与切换（临时拉取）" description="选择镜像前缀后会生成 docker pull 示例命令；结果仅代表你当前网络环境。" language="bash" default="毫秒镜像" timeout="3500" options='[{"label":"毫秒镜像","value":"https://docker.1ms.run","probe":"https://docker.1ms.run","code":"docker pull docker.1ms.run/library/nginx:latest"},{"label":"轩辕镜像","value":"https://docker.xuanyuan.me","probe":"https://docker.xuanyuan.me","code":"docker pull docker.xuanyuan.me/library/nginx:latest"},{"label":"1Panel","value":"https://docker.1panel.live","probe":"https://docker.1panel.live","code":"docker pull docker.1panel.live/library/nginx:latest"},{"label":"gh-proxy","value":"https://docker.gh-proxy.org","probe":"https://docker.gh-proxy.org","code":"docker pull docker.gh-proxy.org/library/nginx:latest"}]'}

### GitHub

#### 仓库 / Release 加速

:::CAUTION
注：不会提供GitHub能够登录的代理地址，以下地址仅用于加速GitHub的Git克隆和访问，无法登录GitHub账号
:::

::mirror-switcher{title="GitHub 代理地址探测与切换" description="用于加速公开仓库访问与克隆，不支持 GitHub 账号登录；结果仅代表你当前网络环境。" language="bash" default="gh-proxy.com" timeout="3500" options='[{"label":"gh-proxy.com","value":"https://gh-proxy.com/","probe":"https://gh-proxy.com/","code":"git clone https://gh-proxy.com/https://github.com/YourName/YourRepo.git"},{"label":"ghproxy.net","value":"https://ghproxy.net/","probe":"https://ghproxy.net/","code":"git clone https://ghproxy.net/https://github.com/YourName/YourRepo.git"},{"label":"ghfast.top","value":"https://ghfast.top/","probe":"https://ghfast.top/","code":"git clone https://ghfast.top/https://github.com/YourName/YourRepo.git"}]'}

我们推荐您基于开源项目搭建自己的GitHub代理加速服务 https://github.com/hunshcn/gh-proxy
    
#### GHCR （GitHub Container Registry） 加速

::mirror-switcher{title="GHCR 镜像地址探测与切换" description="用于选择 GHCR 拉取加速地址；结果仅代表你当前网络环境。" language="bash" default="毫秒镜像" timeout="3500" options='[{"label":"毫秒镜像","value":"https://ghcr.1ms.run","probe":"https://ghcr.1ms.run","code":"docker pull ghcr.1ms.run/owner/image:tag"},{"label":"米露云","value":"https://ghcr.milu.moe","probe":"https://ghcr.milu.moe","code":"docker pull ghcr.milu.moe/owner/image:tag"},{"label":"南京大学","value":"https://ghcr.nju.edu.cn","probe":"https://ghcr.nju.edu.cn","code":"docker pull ghcr.nju.edu.cn/owner/image:tag"}]'}
