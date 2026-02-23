---
title: Phira-MP多人服务器测活脚本
published: 2026-02-08
tags: [联机,phira,音游,脚本]
category: '脚本'
draft: false
---

:::caution
请勿将本脚本用于任何形式的非法活动,包括但不限于:
- 攻击服务器
- 破坏服务器
- 窃取服务器数据
:::

## 为什么会有这个脚本

因为知周所众的原因，`Rust` 的 `Phira-MP` 服务端没有提供一个简单的测活接口，而其他的版本(如C#，见下图)又不好测活，于是我就基于MP接受连接时的协议，写了一个简单的测活脚本

![其他](/assets/images/check-phira-mp/other.png)
[原文档](https://docs.dmocken.top/mp_build_guide/)

## v2.0 脚本

点击展开查看代码
:::details
```javascript
import { connect } from 'cloudflare:sockets';

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === "/") {
      return json({
        service: "Phira Server Checker API",
        version: "2.0.0-cloudflare",
        usage: "/api/check?domain='host'&port='port'",
        endpoints: {
          check: "/api/check",
          health: "/health"
        }
      })
    }

    if (url.pathname === "/health") {
      return json({
        status: "healthy",
        timestamp: new Date().toISOString()
      })
    }

    if (url.pathname === "/api/check") {
      return handleCheck(url, env)
    }

    return new Response("Not Found", { status: 404 })
  }
}

/* ================= 工具函数 ================= */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" }
  })
}

function encodeVarint(value) {
  const bytes = []
  while (true) {
    let b = value & 0x7f
    value >>= 7
    if (value !== 0) b |= 0x80
    bytes.push(b)
    if (value === 0) break
  }
  return Uint8Array.from(bytes)
}

function concatUint8(...arrays) {
  const len = arrays.reduce((a, b) => a + b.length, 0)
  const out = new Uint8Array(len)
  let offset = 0
  for (const arr of arrays) {
    out.set(arr, offset)
    offset += arr.length
  }
  return out
}

/* ================= Token 缓存 ================= */

const tokenCache = new Map()

async function login(email, password) {
  const key = `${email}:${password}`
  const cached = tokenCache.get(key)

  if (cached && cached.expires > Date.now()) {
    return cached.token
  }

  const body = JSON.stringify({ email, password })
  
  const res = await fetch("https://phira.5wyxi.com/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json", 
      "User-Agent": "PhiraChecker/2.0"
    },
    body: body
  })

  if (!res.ok) {
      // 获取详细的错误信息
      const statusCode = res.status
      const statusText = res.statusText
      
      // 尝试解析错误响应体
      let errorBody = null
      const contentType = res.headers.get('content-type')
      
      try {
          if (contentType && contentType.includes('application/json')) {
              errorBody = await res.json()
          } else {
              errorBody = await res.text()
          }
      } catch (e) {
          errorBody = '无法解析响应体'
      }
      
      // 构建详细的错误信息
      let errorMessage = `登录失败 [HTTP ${statusCode} ${statusText}]`
      
      if (errorBody) {
          if (typeof errorBody === 'object') {
              // 如果返回的是 JSON，提取其中的错误信息字段（根据实际 API 调整）
              errorMessage += `: ${errorBody.message || errorBody.error || errorBody.detail || JSON.stringify(errorBody)}`
          } else {
              errorMessage += `: ${errorBody}`
          }
      }
      
      throw new Error(errorMessage)
  }

  const data = await res.json()
  if (!data.token) {
    throw new Error("未返回 token")
  }

  tokenCache.set(key, {
    token: data.token,
    expires: Date.now() + 60 * 60 * 1000
  })

  return data.token
}

/* ================= TCP 检测 ================= */

async function testConnection(host, port, token) {
  let socket = null;
  const timeoutMs = 3000;

  // 创建一个超时 Promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("TIMEOUT_ERROR")), timeoutMs);
  });

  try {
    // 使用 Promise.race 竞争
    socket = await Promise.race([
      connect({ hostname: host, port }),
      timeoutPromise
    ]);

    const writer = socket.writable.getWriter();
    const reader = socket.readable.getReader();

    try {
      // 写入数据
      const tokenBytes = new TextEncoder().encode(token);
      const packet = concatUint8(
        new Uint8Array([0x01]),
        encodeVarint(tokenBytes.length),
        tokenBytes
      );
      
      await writer.write(new Uint8Array([0x01]));
      await writer.write(concatUint8(encodeVarint(packet.length), packet));

      // 读取响应（同样包裹在 race 中防止读取卡死）
      const { value, done } = await Promise.race([
        reader.read(),
        timeoutPromise
      ]);

      if (done) {
        return { success: false, message: "服务端在握手阶段主动断开连接 (FIN)", stage: "PROTOCOL_REJECT" };
      }

      if (value && value.length > 0) {
        return { success: true, message: "连接成功" };
      }
      
      return { success: false, message: "收到空响应", stage: "EMPTY_RESPONSE" };

    } finally {
      writer.releaseLock();
      reader.releaseLock();
    }

  } catch (err) {
    if (err.message === "TIMEOUT_ERROR") {
      return { success: false, message: `连接或响应超时 (${timeoutMs}ms)`, stage: "TIMEOUT" };
    }
    // 捕获具体的网络错误，如 Connection Refused
    return { success: false, message: `网络异常: ${err.message}`, stage: "NETWORK_ERROR" };
  } finally {
    if (socket) {
      try { socket.close(); } catch {}
    }
  }
}

/* ================= API 主逻辑 ================= */

async function handleCheck(url, env) {
  const domain = url.searchParams.get("domain")
  const portStr = url.searchParams.get("port")

  if (!domain || !portStr) {
    return json({ success: false, error: "缺少 domain 或 port" }, 400)
  }

  const port = Number(portStr)
  if (!Number.isInteger(port)) {
    return json({ success: false, error: "port 必须是整数" }, 400)
  }

  // 必须填写此处获取token才能正常测试
  const email = "test" // 账号
  const password = "test" // 密码

  const start = Date.now()

  try {
    const token = await login(email, password)
    const result = await testConnection(domain, port, token)

    return json({
      domain,
      port,
      timestamp: new Date().toISOString(),
      response_time: Date.now() - start,
      ...result
    }, result.success ? 200 : 502)

  } catch (e) {
    return json({
      success: false,
      error: e.message,
      response_time: Date.now() - start
    }, 502)
  }
}
```
:::

## v2.1 脚本

因为 v2.0 脚本有一些未知的问题，所以我又进行了一次改良，能在 `Cloudflare Workers` 中运行，希望能好上一些吧

并且允许了仅传入 server 参数，自动解析域名和端口，方便一些

现在大AI时代，这个脚本你只需要拿去喂AI改一下，都可以拿去做任意Bot的插件，注意保留原作者（

如果这个脚本有问题，欢迎在 [GitHub](https://github.com/Pimeng/Pimeng) 主页联系我

点击展开查看代码
:::details
```javascript
import { connect } from 'cloudflare:sockets';

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === "/") {
      return json({
        service: "Phira Server Checker API",
        version: "2.1.0-cloudflare",
        usage: [
            {
                method: "GET",
                path: "/api/check",
                query: "server='host:port' OR domain='host'&port='port'"
            }
        ],
        endpoints: {
          check: "/api/check",
          health: "/health"
        }
      })
    }

    if (url.pathname === "/health") {
      return json({
        status: "healthy",
        timestamp: new Date().toISOString()
      })
    }

    if (url.pathname === "/api/check") {
      return handleCheck(url, env)
    }

    return new Response("Not Found", { status: 404 })
  }
}

/* ================= 工具函数 ================= */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" }
  })
}

function encodeVarint(value) {
  const bytes = []
  while (true) {
    let b = value & 0x7f
    value >>= 7
    if (value !== 0) b |= 0x80
    bytes.push(b)
    if (value === 0) break
  }
  return Uint8Array.from(bytes)
}

function concatUint8(...arrays) {
  const len = arrays.reduce((a, b) => a + b.length, 0)
  const out = new Uint8Array(len)
  let offset = 0
  for (const arr of arrays) {
    out.set(arr, offset)
    offset += arr.length
  }
  return out
}

/* ================= Token 缓存 ================= */

const tokenCache = new Map()

async function login(email, password) {
  const key = `${email}:${password}`
  const cached = tokenCache.get(key)

  if (cached && cached.expires > Date.now()) {
    return cached.token
  }

  const body = JSON.stringify({ email, password })
  
  const res = await fetch("https://phira.5wyxi.com/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": "PhiraChecker/2.1"
    },
    body: body
  })

  if (!res.ok) {
      const statusCode = res.status
      const statusText = res.statusText
      
      let errorBody = null
      const contentType = res.headers.get('content-type')
      
      try {
          if (contentType && contentType.includes('application/json')) {
              errorBody = await res.json()
          } else {
              errorBody = await res.text()
          }
      } catch (e) {
          errorBody = '无法解析响应体'
      }
      
      let errorMessage = `登录失败 [HTTP ${statusCode} ${statusText}]`
      
      if (errorBody) {
          if (typeof errorBody === 'object') {
              errorMessage += `: ${errorBody.message || errorBody.error || errorBody.detail || JSON.stringify(errorBody)}`
          } else {
              errorMessage += `: ${errorBody}`
          }
      }
      
      throw new Error(errorMessage)
  }

  const data = await res.json()
  if (!data.token) {
    throw new Error("未返回 token")
  }

  tokenCache.set(key, {
    token: data.token,
    expires: Date.now() + 60 * 60 * 1000
  })

  return data.token
}

/* ================= TCP 检测 ================= */

async function testConnection(host, port, token) {
  let socket = null;
  const timeoutMs = 3000;

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("TIMEOUT_ERROR")), timeoutMs);
  });

  try {
    socket = await Promise.race([
      connect({ hostname: host, port }),
      timeoutPromise
    ]);

    const writer = socket.writable.getWriter();
    const reader = socket.readable.getReader();

    try {
      const tokenBytes = new TextEncoder().encode(token);
      const packet = concatUint8(
        new Uint8Array([0x01]),
        encodeVarint(tokenBytes.length),
        tokenBytes
      );
      
      await writer.write(new Uint8Array([0x01]));
      await writer.write(concatUint8(encodeVarint(packet.length), packet));

      const { value, done } = await Promise.race([
        reader.read(),
        timeoutPromise
      ]);

      if (done) {
        return { success: false, message: "服务端在握手阶段主动断开连接 (FIN)", stage: "PROTOCOL_REJECT" };
      }

      if (value && value.length > 0) {
        return { success: true, message: "连接成功" };
      }
      
      return { success: false, message: "收到空响应", stage: "EMPTY_RESPONSE" };

    } finally {
      writer.releaseLock();
      reader.releaseLock();
    }

  } catch (err) {
    if (err.message === "TIMEOUT_ERROR") {
      return { success: false, message: `连接或响应超时 (${timeoutMs}ms)`, stage: "TIMEOUT" };
    }
    return { success: false, message: `网络异常: ${err.message}`, stage: "NETWORK_ERROR" };
  } finally {
    if (socket) {
      try { socket.close(); } catch {}
    }
  }
}

/* ================= API 主逻辑 ================= */

async function handleCheck(url, env) {
  // 1. 获取参数
  let domain = url.searchParams.get("domain")
  let portStr = url.searchParams.get("port")
  const server = url.searchParams.get("server")

  // 2. 如果传入了 server 参数，优先解析 server
  // 格式如: mp2.phira.cn:12346
  if (server) {
    const lastColonIndex = server.lastIndexOf(':')
    if (lastColonIndex !== -1) {
      // 分割 host 和 port
      domain = server.substring(0, lastColonIndex)
      portStr = server.substring(lastColonIndex + 1)
    } else {
      // 如果没有冒号，假设整个字符串是 domain，仍然需要检查 port 是否存在
      domain = server
    }
  }

  // 3. 校验参数完整性
  if (!domain) {
    return json({ success: false, error: "缺少 server 或 domain 参数" }, 400)
  }

  if (!portStr) {
    return json({ success: false, error: "缺少 port (包含在 server 中或单独传递)" }, 400)
  }

  const port = Number(portStr)
  if (!Number.isInteger(port)) {
    return json({ success: false, error: "port 必须是整数" }, 400)
  }


  // 注意修改此处的邮箱和密码,否则无法登录拿到token测试连接
  const email = "test"
  const password = "test"

  const start = Date.now()

  try {
    const token = await login(email, password)
    // 这里的 domain 变量实际上就是 host
    const result = await testConnection(domain, port, token)

    return json({
      server: `${domain}:${port}`, // 返回完整的 server 格式
      domain,
      port,
      timestamp: new Date().toISOString(),
      response_time: Date.now() - start,
      ...result
    }, result.success ? 200 : 502)

  } catch (e) {
    return json({
      success: false,
      error: e.message,
      response_time: Date.now() - start
    }, 502)
  }
}
```

成功返回示例

```json
{
  "server": "mp2.phira.cn:12346",
  "domain": "mp2.phira.cn",
  "port": 12346,
  "timestamp": "2023-10-27T10:00:00.000Z",
  "response_time": 450,
  "success": true,
  "message": "连接成功"
}
```
:::

## v2.3 脚本

这个版本估计是真的最后一个版本了，没啥问题，调试日志也比较详细，有问题再说吧，我安眠了

点击展开查看代码
:::details

```javascript
import { connect } from 'cloudflare:sockets';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;

    // 只允许 GET 请求
    if (method !== 'GET') {
      return json({ 
        error: 'Method not allowed',
        allowed: ['GET']
      }, 405);
    }

    if (url.pathname === "/") {
      return json({
        service: "Phira-MP Alive Test API",
        version: "2.3-cloudflare",
        usage: [
          {
            method: "GET",
            path: "/api/check",
            query: "server='host:port' OR domain='host'&port='port'"
          }
        ],
        endpoints: {
          check: "/api/check",
          health: "/health"
        },
        note: "该API仅供测试使用，请勿用于非法等用途"
      });
    }

    if (url.pathname === "/health") {
      return json({
        status: "healthy",
        timestamp: new Date().toISOString(),
      });
    }

    if (url.pathname === "/api/check") {
      return handleCheck(url, env);
    }

    return json({ error: "Not Found" }, 404);
  }
};

/* ================= 工具函数 ================= */

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "cache-control": "no-store, max-age=0"
    }
  });
}

function encodeVarint(value) {
  if (value < 0) {
    throw new Error("Varint cannot encode negative numbers");
  }
  
  const bytes = [];
  while (true) {
    let b = value & 0x7f;
    value >>>= 7; // 使用无符号右移
    if (value !== 0) b |= 0x80;
    bytes.push(b);
    if (value === 0) break;
  }
  return Uint8Array.from(bytes);
}

function concatUint8(...arrays) {
  const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  
  return result;
}

function validateHostname(hostname) {
  if (!hostname || typeof hostname !== 'string') return false;
  
  // 简单的域名/IP验证
  const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?)*$/;
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  
  return hostnameRegex.test(hostname) || ipRegex.test(hostname);
}

function sanitizePort(port) {
  const portNum = Number.parseInt(port, 10);
  if (!Number.isInteger(portNum) || portNum < 1 || portNum > 65535) {
    throw new Error(`Invalid port number: ${port}. Must be 1-65535`);
  }
  return portNum;
}

/* ================= Token 缓存 ================= */

// 使用简单的内存缓存（在 Cloudflare Workers 中，全局变量会在热启动时保留）
const tokenCache = new Map();
const CACHE_TTL = 55 * 60 * 1000; // 55 分钟，略小于 token 有效期

async function login() {
  const email = ""; // 请修改此处的账号和密码，否则无法正常登录
  const password = "";
  const cacheKey = `${email}:${password}`;
  const now = Date.now();
  
  // 检查缓存
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expires > now) {
    return cached.token;
  }
  
  // 清理过期缓存
  for (const [key, value] of tokenCache.entries()) {
    if (value.expires <= now) {
      tokenCache.delete(key);
    }
  }

  try {
    const body = JSON.stringify({ email, password });
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const res = await fetch("https://phira.5wyxi.com/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "PhiraChecker/2.1.0"
      },
      body: body,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!res.ok) {
      let errorMessage = `登录失败 [HTTP ${res.status} ${res.statusText}]`;
      
      try {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json();
          errorMessage += `: ${errorData.message || errorData.error || JSON.stringify(errorData)}`;
        } else {
          errorMessage += `: ${await res.text()}`;
        }
      } catch (e) {
        errorMessage += " (无法解析响应)";
      }
      
      throw new Error(errorMessage);
    }

    const data = await res.json();
    if (!data.token || typeof data.token !== 'string') {
      throw new Error("登录响应中未包含有效的 token");
    }

    // 缓存 token
    tokenCache.set(cacheKey, {
      token: data.token,
      expires: now + CACHE_TTL
    });

    return data.token;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error("登录请求超时");
    }
    throw error;
  }
}

/* ================= TCP 检测 ================= */

async function testConnection(host, port, token) {
  let socket = null;
  let writer = null;
  let reader = null;
  
  const timeoutMs = 5000;
  const startTime = Date.now();
  const buf = []; // 字节缓冲区

  // 内部辅助函数：从 Reader 中读取数据并补充到缓冲区
  async function fillBuffer(targetReader) {
    const { value, done } = await targetReader.read();
    if (done) return false;
    if (value) {
      // 使用 spread 展开运算符将 Uint8Array 加入数组（适用于小数据包）
      buf.push(...value);
    }
    return true;
  }

  try {
    socket = connect({ hostname: host, port: port });
    
    // 连接超时控制
    await Promise.race([
      socket.opened,
      new Promise((_, reject) => setTimeout(() => reject(new Error("连接超时")), timeoutMs))
    ]);

    writer = socket.writable.getWriter();
    reader = socket.readable.getReader();

    // 1. 发送握手包 (保持原有逻辑)
    const tokenBytes = new TextEncoder().encode(token);
    const innerPacket = concatUint8(new Uint8Array([0x01]), encodeVarint(tokenBytes.length), tokenBytes);
    const handshakePacket = concatUint8(new Uint8Array([0x01]), encodeVarint(innerPacket.length), innerPacket);
    await writer.write(handshakePacket);

    // 2. 开始流式解析响应
    const readLogic = async () => {
      // --- A. 解析总长度 (VarInt) ---
      let totalLength = 0;
      let shift = 0;
      while (true) {
        if (buf.length === 0) {
          if (!(await fillBuffer(reader))) throw new Error("连接在读取 VarInt 时关闭");
        }
        const byte = buf.shift(); 
        totalLength |= (byte & 0x7F) << shift;
        if ((byte & 0x80) === 0) break;
        shift += 7;
        if (shift > 35) throw new Error("无效的 VarInt 长度");
      }

      // --- B. 确保缓冲区有足够的 Payload 数据 (至少 2 字节) ---
      // 即使 totalLength 很大，我们通常只需要前两个字节来判定状态
      while (buf.length < 2) {
        if (!(await fillBuffer(reader))) {
          // 如果总长度宣称有数据但流结束了，说明包不完整
          throw new Error("连接在读取 Payload 时意外关闭（分包丢失）");
        }
      }

      // --- C. 校验包体前缀 (0x01 0x01) ---
      const b1 = buf[0];
      const b2 = buf[1];

      if (b1 === 0x01 && b2 === 0x01) {
        return { 
          success: true, 
          message: "连接成功并收到有效响应",
          connection_time: Date.now() - startTime 
        };
      } else {
        return { 
          success: false, 
          message: `服务器响应格式错误: 实际收到 0x${b1.toString(16).padStart(2, '0')} 0x${b2.toString(16).padStart(2, '0')}`, 
          stage: "PROTOCOL_MISMATCH",
          connection_time: Date.now() - startTime
        };
      }
    };

    // 3. 运行逻辑并带上整体超时
    return await Promise.race([
      readLogic(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("读取响应超时")), timeoutMs))
    ]);

  } catch (error) {
    const connectionTime = Date.now() - startTime;
    return { 
      success: false, 
      message: error.message, 
      stage: error.message.includes("超时") ? "TIMEOUT" : "NETWORK_ERROR",
      connection_time: connectionTime
    };
  } finally {
    // 释放资源
    if (reader) try { reader.releaseLock(); } catch {}
    if (writer) try { writer.releaseLock(); } catch {}
    if (socket) try { socket.close(); } catch {}
  }
}

/* ================= API 主逻辑 ================= */

async function handleCheck(url, env) {
  const startTime = Date.now();
  
  try {
    // 1. 获取并验证参数
    const serverParam = url.searchParams.get("server");
    let host = url.searchParams.get("domain");
    let portStr = url.searchParams.get("port");

    // 2. 解析参数
    if (serverParam) {
      // 从 server 参数解析 host:port
      const lastColonIndex = serverParam.lastIndexOf(':');
      if (lastColonIndex === -1 || lastColonIndex === 0 || lastColonIndex === serverParam.length - 1) {
        return json({ 
          success: false, 
          error: "server 参数格式错误，应为 'host:port'",
          example: "mp2.phira.cn:12346"
        }, 400);
      }
      
      host = serverParam.substring(0, lastColonIndex);
      portStr = serverParam.substring(lastColonIndex + 1);
    }

    // 3. 验证参数存在
    if (!host) {
      return json({ 
        success: false, 
        error: "缺少主机名参数",
        usage: "提供 server='host:port' 或 domain='host'&port='port'"
      }, 400);
    }

    if (!portStr) {
      return json({ 
        success: false, 
        error: "缺少端口参数",
        usage: "提供 server='host:port' 或 domain='host'&port='port'"
      }, 400);
    }

    // 4. 清理和验证输入
    const cleanHost = host.trim().toLowerCase();
    if (!validateHostname(cleanHost)) {
      return json({ 
        success: false, 
        error: `无效的主机名: ${host}`,
        note: "主机名只能包含字母、数字、连字符和点号"
      }, 400);
    }

    let port;
    try {
      port = sanitizePort(portStr);
    } catch (portError) {
      return json({ 
        success: false, 
        error: portError.message 
      }, 400);
    }

    // 5. 获取认证令牌
    const token = await login();
    
    // 6. 测试连接
    const testResult = await testConnection(cleanHost, port, token);
    
    // 7. 返回结果
    const responseTime = Date.now() - startTime;
    
    const response = {
      success: testResult.success,
      server: `${cleanHost}:${port}`,
      timestamp: new Date().toISOString(),
      total_response_time: responseTime,
      connection_time: testResult.connection_time,
      message: testResult.message,
      stage: testResult.stage || (testResult.success ? "SUCCESS" : "UNKNOWN_ERROR")
    };
    
    // 添加额外的成功信息
    if (testResult.success && testResult.bytes_received) {
      response.bytes_received = testResult.bytes_received;
    }
    
    return json(response, testResult.success ? 200 : 502);
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // 记录错误但不暴露过多内部信息
    console.error(`API Error: ${error.message}`, {
      url: url.toString(),
      time: responseTime
    });
    
    return json({
      success: false,
      error: error.message || "内部服务器错误",
      response_time: responseTime,
      timestamp: new Date().toISOString()
    }, 500);
  }
}
```

响应示例：
```json
{
  "success": true,
  "server": "mp2.phira.cn:12346",
  "timestamp": "2026-02-23T15:52:03.809Z",
  "total_response_time": 583,
  "connection_time": 402,
  "message": "连接成功并收到有效响应",
  "stage": "SUCCESS"
}
```

:::