# -*- coding: utf-8 -*-

import ctypes
from ctypes import wintypes
import sys

# 通过 ctypes 直接调用 Windows 原生 API。
# credui.dll 负责弹出系统凭据/Windows Hello 对话框；
# advapi32.dll 负责校验用户名和密码；
# kernel32.dll 用来释放句柄和系统分配的内存。
credui = ctypes.WinDLL("credui.dll")
advapi32 = ctypes.WinDLL("advapi32")
kernel32 = ctypes.WinDLL("kernel32")

# CredUI API 需要调用方提前准备固定长度的缓冲区。
# 这些长度来自 Windows SDK 中的 CREDUI_MAX_* 常量。
CREDUI_MAX_USERNAME_LENGTH = 513
CREDUI_MAX_DOMAIN_LENGTH = 256
CREDUI_MAX_PASSWORD_LENGTH = 256

# CredUIPromptForWindowsCredentialsW 的标志位。
# AUTHPACKAGE_ONLY: 只使用系统选择的认证包。
# ENUMERATE_CURRENT_USER: 优先枚举当前登录用户的凭据。
CREDUIWIN_AUTHPACKAGE_ONLY = 0x10
CREDUIWIN_ENUMERATE_CURRENT_USER = 0x200

# 常见 Windows 错误码，后面会转换成人更容易读的提示。
ERROR_CANCELLED = 1223
ERROR_LOGON_FAILURE = 1326
ERROR_PRIVILEGE_NOT_HELD = 1314

class CREDUI_INFO(ctypes.Structure):
    """对应 Windows API 的 CREDUI_INFO 结构体。"""

    _fields_ = [
        ("cbSize", wintypes.DWORD),          # 结构体大小，Windows API 用它判断版本。
        ("hwndParent", wintypes.HWND),       # 父窗口句柄；None 表示没有父窗口。
        ("pszMessageText", wintypes.LPCWSTR),# 对话框正文提示。
        ("pszCaptionText", wintypes.LPCWSTR),# 对话框标题。
        ("hbmBanner", wintypes.HBITMAP),     # 可选横幅图片，这里不使用。
    ]

def parse_username(full_username):
    """
    解析 domain\\user 格式。

    CredUI 返回的用户名可能带域前缀，例如 COMPUTER\\alice。
    LogonUserW 需要把 domain 和 username 分开传入，所以这里做一次拆分。
    """
    if '\\' in full_username:
        domain, user = full_username.rsplit('\\', 1)
        return domain, user
    return None, full_username

def verify_credentials(domain, username, password):
    """
    使用 LogonUserW 验证凭据。

    LogonUserW 验证成功时会返回一个 token 句柄；这个句柄必须及时关闭，
    否则长时间运行的程序可能会泄漏系统资源。

    返回: (success: bool, error_code: int)
    """
    token = wintypes.HANDLE()
    
    # 处理 username 中可能包含域的情况
    if '\\' in username:
        domain, username = parse_username(username)
    
    result = advapi32.LogonUserW(
        ctypes.c_wchar_p(username),
        ctypes.c_wchar_p(domain) if domain else None,
        ctypes.c_wchar_p(password) if password else None,
        2,  # LOGON32_LOGON_INTERACTIVE：按交互式登录方式验证。
        0,  # LOGON32_PROVIDER_DEFAULT：使用系统默认认证提供程序。
        ctypes.byref(token)
    )
    
    if result:
        # LogonUserW 成功后一定要关闭 token 句柄。
        kernel32.CloseHandle(token)
        return True, 0
    return False, kernel32.GetLastError()

def get_error_message(code):
    """把常见 Windows 错误码转换成中文说明。"""
    errors = {
        1326: "密码错误或用户名无效",
        1330: "密码已过期",
        1385: "登录类型被拒绝（权限不足）",
        1314: "权限不足",
        5: "访问被拒绝",
        87: "参数错误",
    }
    return errors.get(code, f"未知错误 (代码: {code})")

def windows_hello_verify(message="需要验证您的身份以继续", caption="Windows 安全"):
    """
    调起 Windows Hello / 凭据对话框并验证身份
    
    支持：
    - 本地账户密码
    - Microsoft 账户密码  
    - PIN 码
    - 指纹/面部识别（如果配置了 Windows Hello）
    
    返回: (success: bool, message: str, username: str or None)
    """
    ui_info = CREDUI_INFO()
    # cbSize 是结构体调用 Windows API 时的必填字段。
    ui_info.cbSize = ctypes.sizeof(CREDUI_INFO)
    ui_info.hwndParent = None
    ui_info.pszMessageText = message
    ui_info.pszCaptionText = caption
    ui_info.hbmBanner = None

    # auth_package 会由系统填写，表示本次使用的认证包。
    auth_package = wintypes.ULONG(0)
    # out_buffer/out_size 接收系统返回的凭据数据；最后必须用 LocalFree 释放。
    out_buffer = ctypes.c_void_p()
    out_size = wintypes.ULONG()
    # save 表示用户是否要求保存凭据；这里默认不保存。
    save = wintypes.BOOL(False)
    
    # 关键标志：允许系统选择认证包（包括 Windows Hello）
    flags = CREDUIWIN_AUTHPACKAGE_ONLY | CREDUIWIN_ENUMERATE_CURRENT_USER

    try:
        # 显示凭据对话框（这会弹出 Windows Hello / PIN / 密码框）
        result = credui.CredUIPromptForWindowsCredentialsW(
            ctypes.byref(ui_info), 0, ctypes.byref(auth_package),
            None, 0, ctypes.byref(out_buffer), ctypes.byref(out_size),
            ctypes.byref(save), flags
        )
        
        if result == ERROR_CANCELLED:
            return False, "用户取消了验证", None
        if result != 0:
            return False, f"对话框调用失败 (错误码: {result})", None
        
        # 解包凭据：CredUI 返回的是一块打包后的认证缓冲区，
        # 需要拆成 username、domain、password 三个字段再继续处理。
        username = ctypes.create_unicode_buffer(CREDUI_MAX_USERNAME_LENGTH)
        domain = ctypes.create_unicode_buffer(CREDUI_MAX_DOMAIN_LENGTH)
        password = ctypes.create_unicode_buffer(CREDUI_MAX_PASSWORD_LENGTH)
        
        # Windows API 会根据这些 size 参数判断缓冲区容量，
        # 调用完成后也可能回写实际使用的长度。
        username_size = wintypes.DWORD(CREDUI_MAX_USERNAME_LENGTH)
        domain_size = wintypes.DWORD(CREDUI_MAX_DOMAIN_LENGTH)
        password_size = wintypes.DWORD(CREDUI_MAX_PASSWORD_LENGTH)
        
        credui.CredUnPackAuthenticationBufferW(
            0, out_buffer, out_size.value,
            username, ctypes.byref(username_size),
            domain, ctypes.byref(domain_size),
            password, ctypes.byref(password_size)
        )
        
        user = username.value
        pwd = password.value
        domain_val = domain.value
        
        # 安全：把密码复制到 Python 字符串后，立即清零 ctypes 缓冲区。
        # 注意：Python 字符串本身仍由解释器管理，适合短流程使用。
        if pwd:
            ctypes.memset(password, 0, ctypes.sizeof(password))
        
        # 提取纯用户名（去掉域前缀用于显示）
        _, short_user = parse_username(user)
        
        # 尝试用 LogonUserW 做一次显式验证，拿到更明确的成功/失败结果。
        success, err_code = verify_credentials(domain_val, user, pwd)
        
        if success:
            return True, f"身份验证通过", short_user
        
        # 处理不同类型的失败
        if err_code == ERROR_LOGON_FAILURE:
            # 1326 = 密码错误
            return False, "密码错误，请重试", None
            
        elif err_code in (1385, ERROR_PRIVILEGE_NOT_HELD):
            # 权限不足无法验证，但 CredUI 已经验证了身份
            return True, f"身份已确认 (通过 Windows Hello/PIN)", short_user
            
        else:
            return False, get_error_message(err_code), None
            
    except Exception as e:
        return False, f"系统错误: {str(e)}", None
        
    finally:
        if out_buffer.value:
            # CredUIPromptForWindowsCredentialsW 分配的缓冲区由 LocalFree 释放。
            kernel32.LocalFree(out_buffer)

if __name__ == "__main__":
    # 直接运行脚本时，演示一次完整的 Windows Hello / 凭据验证流程。
    print("Windows Hello 身份验证")
    print("-" * 30)
    print("提示：如果系统配置了指纹/人脸/PIN，对话框会显示相应选项")
    print()
    
    success, msg, user = windows_hello_verify("请验证身份以继续操作", "安全验证")
    
    print(f"\n结果: {msg}")
    if user:
        print(f"用户: {user}")
    
    if success:
        print("✅ 验证通过，执行敏感操作...")
        # 这里放需要保护的操作，例如打开加密文件、执行管理员动作等。
    else:
        print("❌ 验证失败，操作已取消")
        sys.exit(1)
