# SSE 邮件 MCP 服务器

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/badge/npm-1.0.0-blue.svg)](https://www.npmjs.com/package/sse-email-mcp-server)

基于 SSE (Server-Sent Events) MCP 协议的邮件服务器，支持 SMTP/IMAP/POP3 协议和主流邮箱服务商，提供邮件发送和接收功能。

## 📋 目录

- [快速开始（推荐 npx）](#快速开始推荐-npx)
- [MCP 客户端配置](#mcp-客户端配置)
- [功能特性](#功能特性)
- [使用场景](#使用场景)
- [支持的邮箱服务商](#支持的邮箱服务商)
- [可用工具](#可用工具)
- [常见问题](#常见问题)
- [故障排除](#故障排除)

## ✨ 功能特性

- ✅ **SMTP 邮件发送** - 支持通过 SMTP 协议发送邮件
- ✅ **IMAP 邮件接收** - 支持通过 IMAP 协议接收邮件
- ✅ **POP3 邮件接收** - 支持通过 POP3 协议接收邮件
- ✅ **多服务商支持** - 支持 Gmail、Outlook、QQ、163、126、Sina 等主流邮箱服务商
- ✅ **自定义配置** - 支持自定义 SMTP/IMAP/POP3 服务器配置
- ✅ **灵活配置** - 支持环境变量、配置文件和请求参数三种配置方式
- ✅ **附件支持** - 支持发送文件附件和 Base64 编码附件
- ✅ **多格式支持** - 支持 HTML 和纯文本格式邮件
- ✅ **便捷部署** - 可通过 npx 直接运行，无需全局安装
- ✅ **安全认证** - 支持在工具调用时动态传递认证信息，更安全

## 🎯 使用场景

### AI 助手集成
- **Cursor/Claude Desktop** - 让 AI 助手帮你发送邮件、查看收件箱、处理邮件任务
- **自动化邮件处理** - 通过 AI 助手自动分类、归档、回复邮件
- **智能邮件摘要** - 让 AI 读取并总结邮件内容

### 开发与测试
- **邮件通知系统** - 在应用开发中集成邮件发送功能
- **测试邮件发送** - 自动化测试中发送测试邮件
- **邮件监控** - 监控邮箱中的特定邮件

### 工作流自动化
- **定时邮件发送** - 结合定时任务发送定期报告
- **邮件归档** - 自动归档重要邮件到本地
- **多账户管理** - 统一管理多个邮箱账户的收发

### 企业应用
- **客户服务** - 自动发送确认邮件、通知邮件
- **系统告警** - 系统异常时自动发送告警邮件
- **报告生成** - 自动生成并发送业务报告

## 🔧 系统要求

- **Node.js**: >= 14.0.0
- **npm**: >= 6.0.0（或 yarn、pnpm）
- **操作系统**: Windows、macOS、Linux

## 快速开始（推荐 npx）

### ⭐ 最简单方式：使用 npx（推荐）

包已发布到 npm，**无需安装**，直接在 MCP 客户端配置中使用：

**1. 找到 MCP 客户端配置文件：**
- **Cursor**: `~/.cursor/mcp.json` (macOS/Linux) 或 `C:\Users\你的用户名\.cursor\mcp.json` (Windows)
- **Claude Desktop**: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) 或 `%APPDATA%\Claude\claude_desktop_config.json` (Windows)

**2. 添加配置：**

```json
{
  "mcpServers": {
    "sse-email-mcp": {
      "command": "npx",
      "args": ["-y", "sse-email-mcp-server"],
      "env": {
        "EMAIL_USER": "your-email@gmail.com",
        "EMAIL_PASS": "your-app-password",
        "EMAIL_PROVIDER": "gmail"
      }
    }
  }
}
```

**3. 重启客户端**（Cursor 或 Claude Desktop）

**完成！** npx 会自动下载并运行，无需手动安装。

**优点：**
- ✅ 无需安装，npx 自动处理
- ✅ 无需配置路径
- ✅ 自动使用最新版本
- ✅ 跨平台兼容

### 全局安装方式（可选）

如果想全局安装：

```bash
npm install -g sse-email-mcp-server
```

配置：

```json
{
  "mcpServers": {
    "sse-email-mcp": {
      "command": "sse-email-mcp",
      "env": {
        "EMAIL_USER": "your-email@gmail.com",
        "EMAIL_PASS": "your-app-password",
        "EMAIL_PROVIDER": "gmail"
      }
    }
  }
}
```

### 本地开发方式（可选）

如果从 GitHub 克隆进行开发：

```bash
git clone https://github.com/1018053166/sse-email-mcp-server.git
cd sse-email-mcp-server
npm install
```

配置：

```json
{
  "mcpServers": {
    "sse-email-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/sse-email-mcp-server/bin/sse-email-mcp.js"],
      "env": {
        "EMAIL_USER": "your-email@gmail.com",
        "EMAIL_PASS": "your-app-password"
      }
    }
  }
}
```

## MCP 客户端配置

### 不同邮箱服务商配置

所有服务商都推荐使用 npx 方式，只需修改 `EMAIL_USER`、`EMAIL_PASS` 和 `EMAIL_PROVIDER`：

**Gmail**
```json
{
  "command": "npx",
  "args": ["-y", "sse-email-mcp-server"],
  "env": {
    "EMAIL_USER": "your-email@gmail.com",
    "EMAIL_PASS": "your-app-password",
    "EMAIL_PROVIDER": "gmail"
  }
}
```

**Outlook/Office365**
```json
{
  "command": "npx",
  "args": ["-y", "sse-email-mcp-server"],
  "env": {
    "EMAIL_USER": "your-email@outlook.com",
    "EMAIL_PASS": "your-app-password",
    "EMAIL_PROVIDER": "outlook"
  }
}
```

**QQ 邮箱**
```json
{
  "command": "npx",
  "args": ["-y", "sse-email-mcp-server"],
  "env": {
    "EMAIL_USER": "your-email@qq.com",
    "EMAIL_PASS": "your-authorization-code",
    "EMAIL_PROVIDER": "qq"
  }
}
```

**163/126/Sina 邮箱**
```json
{
  "command": "npx",
  "args": ["-y", "sse-email-mcp-server"],
  "env": {
    "EMAIL_USER": "your-email@163.com",
    "EMAIL_PASS": "your-password",
    "EMAIL_PROVIDER": "163"
  }
}
```

### 安全配置（不存储密码）

如果不想在配置文件中存储密码，可以不配置 `env`，在每次工具调用时传递 `auth` 参数：

```json
{
  "mcpServers": {
    "sse-email-mcp": {
      "command": "npx",
      "args": ["-y", "sse-email-mcp-server"]
    }
  }
}
```

### 配置优先级

1. **工具调用时的 `auth` 参数**（最高优先级）
2. mcp.json 中的 `env.EMAIL_USER` / `env.EMAIL_PASS`
3. 环境变量或配置文件（最低优先级）

## 可用工具

### 1. send_email_smtp - 发送邮件

**必需参数：**
- `to`: 收件人地址数组
- `subject`: 邮件主题
- `text` 或 `html`: 邮件内容（至少提供一个）

**可选参数：**
- `auth`: 认证信息 `{ user, pass }`（优先级最高）
- `provider`: 邮箱服务商（gmail, outlook, qq, 163, 126, sina, custom）
- `from`: 发件人地址（默认使用认证用户）
- `cc`/`bcc`: 抄送/密送地址数组
- `attachments`: 附件数组 `[{ path, filename }]` 或 `[{ content, filename }]`

**示例：**
```json
{
  "provider": "gmail",
  "to": ["recipient@example.com"],
  "subject": "测试邮件",
  "text": "邮件内容",
  "attachments": [{"path": "/path/to/file.pdf", "filename": "doc.pdf"}]
}
```

### 2. receive_email_imap - 接收邮件（IMAP）

**可选参数：**
- `auth`: 认证信息 `{ user, pass }`
- `provider`: 邮箱服务商
- `mailbox`: 邮箱文件夹（默认：INBOX）
- `limit`: 返回数量（默认：10）
- `unseenOnly`: 是否只返回未读邮件（默认：false）

**示例：**
```json
{
  "provider": "gmail",
  "unseenOnly": true,
  "limit": 20
}
```

### 3. receive_email_pop3 - 接收邮件（POP3）

**可选参数：**
- `auth`: 认证信息 `{ user, pass }`
- `provider`: 邮箱服务商
- `limit`: 返回数量（默认：10）

### 认证参数

所有工具都支持通过 `auth` 参数动态传递认证信息：

```json
{
  "auth": {
    "user": "your-email@example.com",
    "pass": "your-password"
  }
}
```

**配置优先级：** 工具调用时的 `auth` 参数 > 环境变量 > 配置文件 > 预定义配置

## 支持的邮箱服务商

### Gmail

- SMTP: smtp.gmail.com:587
- IMAP: imap.gmail.com:993
- POP3: pop.gmail.com:995

**注意：** Gmail 需要使用应用专用密码，而不是普通密码。

### Outlook

- SMTP: smtp.office365.com:587
- IMAP: outlook.office365.com:993
- POP3: outlook.office365.com:995

### QQ 邮箱

- SMTP: smtp.qq.com:587
- IMAP: imap.qq.com:993
- POP3: pop.qq.com:995

**注意：** QQ 邮箱需要开启 SMTP/IMAP/POP3 服务并获取授权码。

### 163 邮箱

- SMTP: smtp.163.com:25
- IMAP: imap.163.com:993
- POP3: pop.163.com:995

### 自定义配置

可以通过 `smtpConfig`、`imapConfig` 或 `pop3Config` 参数提供自定义配置，或使用环境变量：

```bash
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
```


## 常见问题

### Q1: 如何获取 Gmail 应用专用密码？

1. 登录 Google 账户
2. 前往 [Google 账户安全设置](https://myaccount.google.com/security)
3. 启用"两步验证"（如果尚未启用）
4. 在"应用专用密码"部分，生成新的应用专用密码
5. 使用生成的 16 位密码作为 `EMAIL_PASS`

### Q2: QQ 邮箱如何开启 SMTP/IMAP 服务？

1. 登录 QQ 邮箱
2. 进入"设置" → "账户"
3. 找到"POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV 服务"
4. 开启"POP3/SMTP 服务"或"IMAP/SMTP 服务"
5. 按照提示获取授权码（不是 QQ 密码）
6. 使用授权码作为 `EMAIL_PASS`

### Q3: 为什么发送邮件失败？

可能的原因：
- 认证信息错误（用户名或密码不正确）
- 未使用应用专用密码（Gmail、Outlook 等）
- 邮箱服务商的 SMTP 服务未开启
- 网络连接问题
- 防火墙或安全软件阻止连接
- 附件过大超过服务商限制

### Q4: 如何发送大附件？

大多数邮箱服务商对附件大小有限制：
- Gmail: 25MB
- Outlook: 20MB
- QQ 邮箱: 50MB

如果附件过大，建议：
- 使用云存储服务（如 Google Drive、OneDrive）分享链接
- 压缩文件
- 使用文件传输服务

### Q5: 支持哪些邮箱服务商？

目前支持：
- Gmail
- Outlook/Office365
- QQ 邮箱
- 163 邮箱
- 126 邮箱
- Sina 邮箱
- 自定义配置（通过 `smtpConfig`、`imapConfig`、`pop3Config`）

### Q6: 可以在工具调用时使用不同的邮箱账户吗？

可以！通过 `auth` 参数动态传递认证信息：

```javascript
// 使用账户 A
await client.callTool('send_email_smtp', {
  auth: { user: 'account-a@example.com', pass: 'pass-a' },
  to: ['recipient@example.com'],
  subject: '来自账户 A'
});

// 使用账户 B
await client.callTool('send_email_smtp', {
  auth: { user: 'account-b@example.com', pass: 'pass-b' },
  to: ['recipient@example.com'],
  subject: '来自账户 B'
});
```

### Q7: 配置文件应该放在哪里？

配置文件可以放在以下位置（按优先级）：
1. 项目根目录：`config.json` 或 `.config.json`
2. 项目根目录的上一级：`../config.json`

系统会自动查找这些位置。

### Q8: Windows 下连接 QQ 邮箱 SSL 失败？

在 `config.json` 中为 QQ 邮箱添加 `tlsOptions: { "rejectUnauthorized": false }`，或通过工具调用时传递 `tlsOptions` 参数。

## 故障排除

### 常见错误

**依赖未安装**
```bash
npm install
```

**认证失败**
- Gmail/Outlook：使用应用专用密码，不是普通密码
- QQ 邮箱：使用授权码，需要在邮箱设置中开启 SMTP/IMAP 服务

**MCP 服务器未加载**
- 检查配置文件 JSON 格式
- 确认使用 npx 方式或路径正确
- 重启客户端（Cursor/Claude Desktop）

**连接失败**
- 检查网络连接
- 确认服务器地址和端口正确
- 检查防火墙设置

### 错误：SSL/TLS 连接失败（Windows x64 + QQ 邮箱）

**解决方案：** 在配置文件中为 QQ 邮箱添加 `tlsOptions`：

```json
{
  "providers": {
    "qq": {
      "smtp": {
        "tlsOptions": { "rejectUnauthorized": false }
      },
      "imap": {
        "tlsOptions": { "rejectUnauthorized": false }
      }
    }
  }
}
```

⚠️ **注意：** 禁用证书验证会降低安全性，仅在确认安全的环境下使用。

---

## 📄 许可证

MIT License

## 📞 支持

- 📧 [GitHub Issues](https://github.com/1018053166/sse-email-mcp-server/issues)
- 📖 [完整文档](./README.md)

**⭐ 如果这个项目对你有帮助，请给个 Star！**
