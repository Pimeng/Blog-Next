---
title: 使用 Python 实现 Windows Hello 鉴权
published: 2026-05-11
tags: [脚本, Python, Windows Hello, 鉴权]
category: 'Python'
description: 本篇记录如何使用 Python 调起 Windows 凭据对话框，并结合 Windows Hello / PIN / 密码完成本机身份确认
draft: false
image: "api"
---

> [!CAUTION] 前排提醒
> 本篇由AI编写

> [!WARNING] 免责说明
> 本文只讨论在自己的 Windows 设备上做本机身份确认。
>
> 它不是绕过系统验证，也不是提权工具。不要把它用在窃取、保存、转发他人凭据的场景里。

## 0x00 前言

有些小工具会遇到这种需求：

- 打开加密文件前，确认一下当前操作者是不是本人
- 执行敏感操作前，弹一次系统级验证
- 写桌面脚本时，不想自己做一套密码输入框
- 希望优先使用 Windows Hello、PIN、指纹或人脸识别

在 Windows 上，比较合适的方式是直接调系统提供的凭据 UI。

这样做的好处是：密码框、PIN、指纹、人脸这些入口都由系统接管，脚本本身不需要自己画登录框，也不用处理一堆奇怪的输入法、焦点、遮挡问题。

源码下载：<a href="/downloads/python-windows-hello/windows-hello.py" download="windows hello.py" data-no-swup>windows hello.py</a>

## 0x01 效果

直接运行脚本：

```powershell
python ".\windows hello.py"
```

如果系统已经配置了 Windows Hello，正常情况下会弹出 Windows 安全验证窗口。用户可以按系统支持的方式验证身份：

- Windows Hello PIN
- 指纹
- 面部识别
- 当前账户密码
- Microsoft 账户或本地账户凭据

验证完成后，脚本会输出类似结果：

```text
Windows Hello 身份验证
------------------------------
提示：如果系统配置了指纹/人脸/PIN，对话框会显示相应选项

结果: 身份验证通过
用户: Alice
验证通过，执行敏感操作...
```

如果用户点了取消，脚本会停止后续敏感操作。

## 0x02 实现思路

整套流程可以分成 4 步：

1. 使用 `CredUIPromptForWindowsCredentialsW` 弹出 Windows 凭据 / Windows Hello 对话框
2. 使用 `CredUnPackAuthenticationBufferW` 解包系统返回的认证数据
3. 使用 `LogonUserW` 尝试验证用户名和密码
4. 及时释放系统分配的内存和登录 token 句柄

脚本里主要用到了 3 个系统 DLL：

| DLL | 作用 |
| --- | --- |
| `credui.dll` | 弹出 Windows 凭据 UI，并解包认证缓冲区 |
| `advapi32.dll` | 调用 `LogonUserW` 验证凭据 |
| `kernel32.dll` | 释放句柄、释放系统分配的内存 |

Python 这边不需要安装第三方库，直接用标准库里的 `ctypes` 调 Windows API。

## 0x03 定义 Windows API 结构体

Windows API 通常不是 Python 风格的函数，它更像 C 语言接口。调用前要把结构体、缓冲区和指针都准备好。

这里的 `CREDUI_INFO` 对应 Windows 凭据窗口的基本信息：

```python
class CREDUI_INFO(ctypes.Structure):
    """对应 Windows API 的 CREDUI_INFO 结构体。"""

    _fields_ = [
        ("cbSize", wintypes.DWORD),
        ("hwndParent", wintypes.HWND),
        ("pszMessageText", wintypes.LPCWSTR),
        ("pszCaptionText", wintypes.LPCWSTR),
        ("hbmBanner", wintypes.HBITMAP),
    ]
```

几个字段的作用也比较直观：

- `cbSize`：结构体大小，Windows API 用它判断传入结构是否正确
- `hwndParent`：父窗口句柄，脚本里没有 GUI，所以传 `None`
- `pszMessageText`：窗口正文提示
- `pszCaptionText`：窗口标题
- `hbmBanner`：横幅图片，这里不使用

调用前要给 `cbSize` 赋值：

```python
ui_info = CREDUI_INFO()
ui_info.cbSize = ctypes.sizeof(CREDUI_INFO)
ui_info.hwndParent = None
ui_info.pszMessageText = message
ui_info.pszCaptionText = caption
ui_info.hbmBanner = None
```

这一步少了的话，API 很容易直接返回参数错误。

## 0x04 弹出 Windows Hello / 凭据窗口

核心调用在这里：

```python
result = credui.CredUIPromptForWindowsCredentialsW(
    ctypes.byref(ui_info), 0, ctypes.byref(auth_package),
    None, 0, ctypes.byref(out_buffer), ctypes.byref(out_size),
    ctypes.byref(save), flags
)
```

比较关键的是 `flags`：

```python
CREDUIWIN_AUTHPACKAGE_ONLY = 0x10
CREDUIWIN_ENUMERATE_CURRENT_USER = 0x200

flags = CREDUIWIN_AUTHPACKAGE_ONLY | CREDUIWIN_ENUMERATE_CURRENT_USER
```

其中：

- `CREDUIWIN_AUTHPACKAGE_ONLY`：让系统使用合适的认证包
- `CREDUIWIN_ENUMERATE_CURRENT_USER`：优先枚举当前登录用户

如果用户取消窗口，Windows 会返回 `1223`：

```python
if result == ERROR_CANCELLED:
    return False, "用户取消了验证", None
```

如果返回值不是 `0`，说明对话框调用失败。

```python
if result != 0:
    return False, f"对话框调用失败 (错误码: {result})", None
```

> [!NOTE] 小提示
> `CredUIPromptForWindowsCredentialsW` 只是负责弹出系统验证窗口，并返回认证缓冲区。
>
> 真正要不要继续执行后面的敏感操作，应该由你自己的程序逻辑决定。

## 0x05 解包用户名和密码

凭据窗口返回的不是普通字符串，而是一块打包后的认证缓冲区。要继续处理，需要用 `CredUnPackAuthenticationBufferW` 拆出来：

```python
username = ctypes.create_unicode_buffer(CREDUI_MAX_USERNAME_LENGTH)
domain = ctypes.create_unicode_buffer(CREDUI_MAX_DOMAIN_LENGTH)
password = ctypes.create_unicode_buffer(CREDUI_MAX_PASSWORD_LENGTH)

username_size = wintypes.DWORD(CREDUI_MAX_USERNAME_LENGTH)
domain_size = wintypes.DWORD(CREDUI_MAX_DOMAIN_LENGTH)
password_size = wintypes.DWORD(CREDUI_MAX_PASSWORD_LENGTH)

credui.CredUnPackAuthenticationBufferW(
    0, out_buffer, out_size.value,
    username, ctypes.byref(username_size),
    domain, ctypes.byref(domain_size),
    password, ctypes.byref(password_size)
)
```

这里用到的缓冲区长度来自 Windows SDK 里的 `CREDUI_MAX_*` 常量：

```python
CREDUI_MAX_USERNAME_LENGTH = 513
CREDUI_MAX_DOMAIN_LENGTH = 256
CREDUI_MAX_PASSWORD_LENGTH = 256
```

有些账户名会带域名，例如：

```text
DESKTOP-123456\Alice
```

所以脚本里加了一个小函数，把 `domain\user` 拆成两段：

```python
def parse_username(full_username):
    if '\\' in full_username:
        domain, user = full_username.rsplit('\\', 1)
        return domain, user
    return None, full_username
```

这样后面调用 `LogonUserW` 时就能分别传入 `domain` 和 `username`。

## 0x06 验证凭据

拿到用户名、域和密码之后，就可以用 `LogonUserW` 做一次显式验证：

```python
result = advapi32.LogonUserW(
    ctypes.c_wchar_p(username),
    ctypes.c_wchar_p(domain) if domain else None,
    ctypes.c_wchar_p(password) if password else None,
    2,
    0,
    ctypes.byref(token)
)
```

这里的两个数字分别是：

- `2`：`LOGON32_LOGON_INTERACTIVE`，按交互式登录方式验证
- `0`：`LOGON32_PROVIDER_DEFAULT`，使用系统默认认证提供程序

如果验证成功，系统会返回一个 token 句柄。这个句柄用完一定要关掉：

```python
if result:
    kernel32.CloseHandle(token)
    return True, 0
```

不关闭句柄的话，短脚本一般不明显，但长时间运行的程序可能会泄漏系统资源。

## 0x07 错误处理

Windows API 返回的通常是错误码，不太适合直接给用户看，所以脚本做了一层中文提示：

```python
def get_error_message(code):
    errors = {
        1326: "密码错误或用户名无效",
        1330: "密码已过期",
        1385: "登录类型被拒绝（权限不足）",
        1314: "权限不足",
        5: "访问被拒绝",
        87: "参数错误",
    }
    return errors.get(code, f"未知错误 (代码: {code})")
```

几个常见错误码：

| 错误码 | 含义 |
| --- | --- |
| `1223` | 用户取消验证 |
| `1326` | 用户名或密码错误 |
| `1330` | 密码已过期 |
| `1385` | 登录类型被拒绝 |
| `1314` | 权限不足 |
| `5` | 访问被拒绝 |
| `87` | 参数错误 |

脚本里还处理了一个比较现实的情况：Windows Hello / PIN 通过了系统确认，但 `LogonUserW` 未必能按普通密码登录方式完成验证。

```python
elif err_code in (1385, ERROR_PRIVILEGE_NOT_HELD):
    return True, f"身份已确认 (通过 Windows Hello/PIN)", short_user
```

这不是在绕过验证，而是因为系统凭据 UI 已经完成了交互式身份确认，但后续的 `LogonUserW` 在某些账户策略或登录类型下可能没有权限继续拿 token。

## 0x08 释放敏感数据

这个脚本里有两个地方需要特别注意资源释放。

第一个是密码缓冲区。解包之后，脚本会尽快把 `ctypes` 里的密码缓冲区清零：

```python
if pwd:
    ctypes.memset(password, 0, ctypes.sizeof(password))
```

不过要注意，`pwd = password.value` 会把内容复制成 Python 字符串。Python 字符串的内存由解释器管理，无法像 C 缓冲区一样精确控制生命周期。

所以这个方案适合短流程身份确认，不适合把密码长期保存在程序里，更不应该写入日志或文件。

第二个是 `CredUIPromptForWindowsCredentialsW` 返回的 `out_buffer`。这块内存由系统分配，最后必须用 `LocalFree` 释放：

```python
finally:
    if out_buffer.value:
        kernel32.LocalFree(out_buffer)
```

这是调用 Windows API 时很容易漏掉的一步。

## 0x09 完整调用方式

脚本把整个流程封装成了一个函数：

```python
success, msg, user = windows_hello_verify("请验证身份以继续操作", "安全验证")

print(f"\n结果: {msg}")
if user:
    print(f"用户: {user}")

if success:
    print("验证通过，执行敏感操作...")
else:
    print("验证失败，操作已取消")
    sys.exit(1)
```

如果要放进自己的脚本里，大概可以这样用：

```python
success, message, user = windows_hello_verify(
    message="请验证身份以打开配置文件",
    caption="本机身份确认"
)

if not success:
    raise PermissionError(message)

open_secret_config()
```

比较建议的写法是：把敏感操作放在 `success` 之后，而不是先执行再验证。

## 0x0A 使用限制

这个方案很方便，但它不是万能身份系统。

需要注意几点：

- 只适合 Windows，不支持 Linux / macOS
- 需要在当前设备上运行，不能拿来做远程 Web 登录
- 它不会帮你提升管理员权限，也不能替代 UAC
- 不建议在日志里打印用户名、域名、错误详情之外的敏感内容
- 如果是正式产品，应该结合更完整的权限模型、审计日志和密钥管理

说白了，它适合给本机 Python 工具加一道系统级确认。

比如你写了个脚本要删除文件、导出密钥、打开隐私数据，在真正执行前让 Windows 帮你确认一下“现在坐在电脑前的人是不是当前用户”，这类场景就很合适。

## 0x0B 总结

用 Python 调 Windows Hello 的核心并不复杂，关键是理解它背后的 Windows API 流程：

1. `CredUIPromptForWindowsCredentialsW` 弹出系统验证窗口
2. `CredUnPackAuthenticationBufferW` 解包认证结果
3. `LogonUserW` 尝试做显式凭据验证
4. `CloseHandle` 和 `LocalFree` 释放系统资源

这种写法的好处是简单、原生、不依赖第三方库，而且用户看到的是熟悉的 Windows 安全界面。

如果只是给自己的 Python 小工具加一道本机身份确认，这套方案已经够用了。
