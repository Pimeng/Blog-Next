---
title: 关于vivo健康的数据，我是如何获取的
published: 2026-03-31
category: 教程
tags: [vivo, 健康数据, API, 抓包, 逆向]
description: 本篇介绍了如何逆向vivo健康获取所有个人健康数据
draft: false
image: cover.png
---

> [!CAUTION] 警告
> 禁止大范围分享这篇文章！！！
>
> 如果造成vivo修改接口或者封号等后果自负！！！
>
> 求你了哥我好不容易弄到的接口了，别给我搞坏了！！

## 引言

起初，我看到 [u.chongxi.us](//u.chongxi.us) 中，有心率、步数、睡眠状态的指标，他使用的三星手表，它利用了三星健康的 Webhook 功能（隐藏的开发者选项），能够实时获取数据并进行处理。

## 正文

受其启发，我也想制作一个公开的 API 来获取健康数据，但是我发现，vivo 健康loT平台/开发者平台 不支持个人开发者去获取个人健康数据。

正在思考破局的办法时，我突然想到了 `家人共享` 功能，vivo 健康支持家人共享功能，允许用户将自己的健康数据共享给家人，这样家人就可以通过手机上 `vivo 健康` 应用查看共享的健康数据，于是我就在想，能不能通过这个功能来获取数据呢？

然后我就安装了 `Mumu模拟器` ，然后打开了Root权限，安装了 `Reqable` 这个抓包工具，和电脑上的 `Reqable` 进行联动，新建了一个 `vivo账号` 共享给我自己这个新的账号，然后在模拟器上登录这个新的账号，打开 `vivo 健康` 应用，进入 `家人共享` 页面，点击 `接受邀请`，然后果不其然，在 `Reqable` 上就看到了大量的请求，其中就有获取健康数据的请求 `https://health.vivo.com/dailyStatus/solicitude` 它返回的是一个仪表盘的数据，只包含大致的健康数据，比如步数、心率、睡眠状态等。

没想到啊没想到，vivo 你还给我留了一手，你猜怎么着，这个接口请求的时候还得带一堆请求体，还要账号认证 Token （不过还好这个 Token 是长期有效的，不然我真要骂街了，还得写登录获取Token的函数）

请求体：

``` javascript
{
  appVersion: '64216',
  androidVer: '12',
  openId: 'd3b576c3f8efa9f7',
  appName: 'health',
  appVer: '64216',
  sysVer: 'unknown',
  platform: 'android',
  'app-locale': 'zh_CN',
  vendor: '23117114514', // 模拟器的型号
  model: '23117114514', // 模拟器的型号
  brand: 'Mumu',
  'Request-Id': '1145141919810', // 请求ID
  Connection: 'close',
  'Cache-Control': 'no-cache',
  Host: 'health.vivo.com',
  'Accept-Encoding': 'gzip',
  'User-Agent': 'okhttp/4.11.0'
}
```

然后带上我的 vivo 账号的分享ID标识符，终于成功获取了我的健康数据，话又说回来了，实时记录的心率数据的包体是真nm的大啊，给我 Reqable 直接炸了，不过反正不是给我看的，直接让浏览器给我处理，嘻嘻，我只需要转发（肯定不能给前端展示这个Token，不然给我干了我就死了）就能美美的获取数据了

所以，你就能在 [皮梦死了没](//alive.07210700.xyz) 上看到我的健康数据了哈哈，美美收工

顺便附上一些你可能用得上的东西

数据类型和对应的接口路径

``` javascript
{
  pressure: { path: 'pressure', description: '压力详细数据' },
  calorie: { path: 'calorie', description: '卡路里详细数据' },
  distance: { path: 'distance', description: '距离详细数据' },
  rate: { path: 'rate', description: '心率详细数据' },
  saO2: { path: 'saO2', description: '血氧详细数据' },
  step: { path: 'step', description: '步数详细数据' }
}
```

实际应该给 `vivo健康` 请求头

```javascript
{
...FIXED_HEADERS, // 上面提到的固定请求头
'Content-Type': 'application/x-www-form-urlencoded',
timestamp: Date.now().toString(),  // 动态生成毫秒时间戳
'Content-Length': new TextEncoder().encode(bodyString).length.toString(),  // 动态计算内容长度
token: token // 你的新的账号的长期有效Token
};
```

还漏了一个 URL的查询需要带上你的 `sharerOpenId`（此处为你抓包获得的绑定了手表的账号的 openId，注意是你从分享后的请求头，不是你的 vivo ID！！！）

就这么多，再多的都没有了（

你只需要抓个包然后结合这个文章完事就能懂了欸

![给你扔个可爱的橘雪莉](/assets/images/face/46cb1e9bad260bdf805e903f52190673.jpg)
