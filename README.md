# SSE 邮件 MCP 服务器

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/badge/npm-1.0.0-blue.svg)](https://www.npmjs.com/package/sse-email-mcp-server)

基于 SSE (Server-Sent Events) MCP 协议的邮件服务器，支持 SMTP/IMAP/POP3 协议和主流邮箱服务商，提供邮件发送和接收功能。

## 📋 目录

- [功能特性](#功能特性)
- [系统要求](#系统要求)
- [快速开始](#快速开始)
  - [安装依赖](#安装依赖)
  - [安装方式](#安装方式)
  - [配置](#配置)
  - [启动服务器](#启动服务器)
  - [验证安装](#验证安装)
- [MCP 客户端配置](#在-mcp-客户端中配置cursorclaude-desktop)
  - [配置文件位置](#配置文件位置)
  - [配置方式](#配置方式)
  - [配置优先级](#配置优先级-1)
  - [实际配置示例](#实际配置示例)
  - [验证配置](#验证配置)
- [使用说明](#使用说明)
  - [MCP 协议](#mcp-协议)
  - [可用工具](#可用工具)
  - [认证参数](#认证参数)
- [支持的邮箱服务商](#支持的邮箱服务商)
- [配置优先级](#配置优先级)
- [发布到 npm](#发布到-npm)
  - [npx 使用说明](#npx-使用说明)
  - [发布步骤](#发布步骤)
  - [发布检查清单](#发布检查清单)
- [常见问题](#常见问题)
- [故障排除](#故障排除)
- [安全注意事项](#安全注意事项)
- [开发](#开发)
- [许可证](#许可证)
- [贡献](#贡献)

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

## 🔧 系统要求

- **Node.js**: >= 14.0.0
- **npm**: >= 6.0.0（或 yarn、pnpm）
- **操作系统**: Windows、macOS、Linux

## 快速开始

### 安装依赖

**重要：首次使用前必须先安装项目依赖！**

#### 1. 克隆或下载项目

```bash
# 如果使用 git
git clone <repository-url>
cd sse-email-mcp-server

# 或直接下载 ZIP 文件并解压
```

#### 2. 安装依赖（必需）

```bash
# 进入项目目录
cd sse-email-mcp-server

# 安装所有依赖
npm install
```

这一步会安装以下依赖：
- `nodemailer` - SMTP 邮件发送
- `imap` - IMAP 协议支持
- `mailparser` - 邮件解析
- `dotenv` - 环境变量加载
- `fs-extra` - 文件操作

#### 3. 验证安装

安装完成后，检查 `node_modules` 目录是否存在：

```bash
# 检查 node_modules 是否存在
ls node_modules  # macOS/Linux
dir node_modules  # Windows
```

如果 `node_modules` 目录存在且包含依赖包，说明安装成功。

#### 4. 测试运行

```bash
# 测试启动服务器
npm start

# 或直接运行
node bin/sse-email-mcp.js
```

如果看到以下输出，说明安装成功：
```
Starting SSE Email MCP Server on port 3000...
Server started. SSE endpoint: http://localhost:3000/sse
Message endpoint: http://localhost:3000/message
```

### 安装方式

#### 方式一：本地使用（推荐用于开发）

```bash
# 1. 安装依赖
npm install

# 2. 启动服务器
npm start
# 或
node bin/sse-email-mcp.js
```

#### 方式二：通过 npx 运行（需要先发布到 npm）

```bash
# 通过 npx 直接运行（推荐）
npx sse-email-mcp-server
```

#### 方式三：全局安装

```bash
# 全局安装
npm install -g sse-email-mcp-server

# 运行
sse-email-mcp
```

### 配置

#### 方式一：环境变量

创建 `.env` 文件：

```bash
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_PROVIDER=gmail
PORT=3000
```

#### 方式二：配置文件

复制 `config.example.json` 为 `config.json` 并修改：

```json
{
  "defaultProvider": "gmail",
  "auth": {
    "user": "your-email@gmail.com",
    "pass": "your-app-password"
  }
}
```

配置文件可以放在以下位置之一：
- 项目根目录：`config.json` 或 `.config.json`
- 项目根目录的上一级：`../config.json`

### 启动服务器

```bash
npm start
# 或
node bin/sse-email-mcp.js
```

服务器将在 `http://localhost:3000` 启动，提供两个端点：
- `GET /sse` - SSE 连接端点
- `POST /message` - 消息处理端点

### 验证安装

运行以下命令验证所有依赖是否已正确安装：

```bash
# 检查关键依赖
node -e "require('dotenv'); console.log('✓ dotenv installed')"
node -e "require('nodemailer'); console.log('✓ nodemailer installed')"
node -e "require('imap'); console.log('✓ imap installed')"
node -e "require('mailparser'); console.log('✓ mailparser installed')"
node -e "require('fs-extra'); console.log('✓ fs-extra installed')"
```

如果所有依赖都显示 ✓，说明安装成功。

### 在 MCP 客户端中配置（Cursor/Claude Desktop）

如果你使用的是支持 MCP 协议的客户端（如 Cursor、Claude Desktop），需要在客户端的配置文件中注册此服务器。

#### 配置文件位置

- **Cursor**: 
  - macOS/Linux: `~/.cursor/mcp.json`
  - Windows: `C:\Users\你的用户名\.cursor\mcp.json`
- **Claude Desktop**: 
  - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
  - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

#### 配置方式

**方式一：使用环境变量（可选）**

如果希望在 mcp.json 中配置认证信息，可以这样设置：

```json
{
  "mcpServers": {
    "sse-email-mcp": {
      "command": "node",
      "args": [
        "C:/Users/10180/Desktop/sse-email-mcp-server/bin/sse-email-mcp.js"
      ],
      "env": {
        "EMAIL_USER": "your-email@gmail.com",
        "EMAIL_PASS": "your-app-password",
        "EMAIL_PROVIDER": "gmail"
      }
    }
  }
}
```

**注意**：
- `args` 中的路径必须是**绝对路径**
- Windows 路径可以使用正斜杠 `/` 或反斜杠 `\`
- `env` 中的认证信息是**可选的**，如果未配置，可以在工具调用时传递

**方式二：不配置环境变量（推荐，更安全）**

如果不想在配置文件中存储敏感信息，可以完全不配置 `env`：

```json
{
  "mcpServers": {
    "sse-email-mcp": {
      "command": "node",
      "args": [
        "C:/Users/10180/Desktop/sse-email-mcp-server/bin/sse-email-mcp.js"
      ]
    }
  }
}
```

然后在每次调用工具时传递 `auth` 参数：

```json
{
  "provider": "gmail",
  "auth": {
    "user": "your-email@gmail.com",
    "pass": "your-app-password"
  },
  "unseenOnly": true
}
```

#### 配置优先级

认证信息的优先级（从高到低）：

1. **工具调用时的 `auth` 参数**（最高优先级）
2. 工具调用时的 `smtpConfig.auth` / `imapConfig.auth` / `pop3Config.auth`
3. **mcp.json 中的 `env.EMAIL_USER` / `env.EMAIL_PASS`**
4. 项目目录下的 `.env` 文件
5. `config.json` 配置文件
6. 预定义服务商配置（最低优先级）

#### 实际配置示例

**Windows 配置示例**

```json
{
  "mcpServers": {
    "sse-email-mcp": {
      "command": "node",
      "args": [
        "C:/Users/10180/Desktop/sse-email-mcp-server/bin/sse-email-mcp.js"
      ],
      "env": {
        "EMAIL_USER": "your-email@gmail.com",
        "EMAIL_PASS": "your-app-password"
      }
    }
  }
}
```

**macOS/Linux 配置示例**

```json
{
  "mcpServers": {
    "sse-email-mcp": {
      "command": "node",
      "args": [
        "/Users/yourname/sse-email-mcp-server/bin/sse-email-mcp.js"
      ],
      "env": {
        "EMAIL_USER": "your-email@gmail.com",
        "EMAIL_PASS": "your-app-password"
      }
    }
  }
}
```

**使用 npx（如果已发布到 npm）**

```json
{
  "mcpServers": {
    "sse-email-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "sse-email-mcp-server"
      ],
      "env": {
        "EMAIL_USER": "your-email@gmail.com",
        "EMAIL_PASS": "your-app-password"
      }
    }
  }
}
```

**使用本地路径的 npx（无需发布）**

```json
{
  "mcpServers": {
    "sse-email-mcp": {
      "command": "npx",
      "args": [
        "/absolute/path/to/sse-email-mcp-server"
      ],
      "env": {
        "EMAIL_USER": "your-email@gmail.com",
        "EMAIL_PASS": "your-app-password"
      }
    }
  }
}
```

**重要提示：**
- 路径必须是**绝对路径**：不能使用相对路径
- Windows 路径格式：可以使用 `C:/path/to/file` 或 `C:\path\to\file`
- 认证信息可选：现在支持在工具调用时传递，不一定需要在 env 中配置
- 安全性：如果不想在配置文件中存储密码，可以不配置 env，每次调用时传递

#### 验证配置

配置完成后：

1. **保存配置文件**
2. **重启 MCP 客户端**（Cursor 或 Claude Desktop）
3. **检查日志**：应该看到 "sse-email-mcp 启动成功，工具数: 3"

如果启动失败，检查：
- 路径是否正确（必须是绝对路径）
- Node.js 是否已安装
- 项目依赖是否已安装（`npm install`）

**重要提示：**

关于 npx 的使用：
- **如果包已发布到 npm**：可以直接使用包名（如示例所示）
- **如果包未发布到 npm**：需要使用本地绝对路径，或使用 `node` 命令

详见 [PUBLISH.md](./PUBLISH.md) 了解如何发布到 npm 或使用本地路径。

- `args` 中的路径必须是**绝对路径**（使用本地路径时）
- 如果使用 `npx` 运行已发布的包，可以这样配置：

```json
{
  "mcpServers": {
    "sse-email-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "sse-email-mcp-server"
      ],
      "env": {
        "EMAIL_USER": "your-email@gmail.com",
        "EMAIL_PASS": "your-app-password",
        "EMAIL_PROVIDER": "gmail"
      }
    }
  }
}
```

- 如果项目已全局安装，也可以直接使用命令：

```json
{
  "mcpServers": {
    "sse-email-mcp": {
      "command": "sse-email-mcp",
      "env": {
        "EMAIL_USER": "your-email@gmail.com",
        "EMAIL_PASS": "your-app-password"
      }
    }
  }
}
```

配置完成后，**重启客户端**（Cursor 或 Claude Desktop），MCP 服务器将自动加载。

**示例配置文件：**
- `mcp.example.json` - 使用本地 Node.js 运行的配置示例（推荐用于开发）
- `mcp.example.npx.json` - 使用 npx 运行已发布到 npm 的包（需要先发布）
- `mcp.example.local.json` - 使用 npx 运行本地项目（无需发布）

**关于发布到 npm：**
- 如果包已发布到 npm，可以使用 `mcp.example.npx.json` 的配置方式
- 如果包未发布，使用 `mcp.example.json` 或 `mcp.example.local.json`
- 详细发布指南请参考 [PUBLISH.md](./PUBLISH.md)

**重要提示：使用前必须安装依赖！**

在配置 MCP 客户端之前，请确保：
1. ✅ 已运行 `npm install` 安装所有依赖
2. ✅ 项目目录中存在 `node_modules` 文件夹
3. ✅ 使用正确的绝对路径

**获取绝对路径的方法：**

在 macOS/Linux 上：
```bash
# 在项目目录下运行
pwd
# 输出类似：/Users/yourname/sse-email-mcp-server
# 完整路径为：/Users/yourname/sse-email-mcp-server/bin/sse-email-mcp.js
```

在 Windows 上：
```powershell
# 在项目目录下运行
pwd
# 输出类似：C:\Users\yourname\sse-email-mcp-server
# 完整路径为：C:\Users\yourname\sse-email-mcp-server\bin\sse-email-mcp.js

# 或者使用 cmd
cd
# 然后手动拼接路径
```

**跨平台使用（Mac → Windows）：**

如果你在 Mac 上开发，需要拷贝到 Windows 使用：
- ✅ **可以拷贝**：项目源代码、`package.json`、配置文件
- ❌ **不要拷贝**：`node_modules` 目录（包含平台特定的二进制文件）
- 📝 **在 Windows 上**：运行 `npm install` 重新安装依赖

详细说明请参考 [CROSS_PLATFORM.md](./CROSS_PLATFORM.md)

## 使用说明

### MCP 协议

服务器实现了标准的 MCP 协议，支持以下方法：

#### initialize

初始化连接，返回服务器信息。

#### tools/list

获取可用工具列表。

#### tools/call

调用指定工具。

### 可用工具

#### 1. send_email_smtp

通过 SMTP 协议发送邮件。

**参数：**

```json
{
  "auth": {
    "user": "your-email@gmail.com",
    "pass": "your-app-password"
  },
  "provider": "gmail",
  "from": "sender@example.com",
  "to": ["recipient@example.com"],
  "cc": ["cc@example.com"],
  "bcc": ["bcc@example.com"],
  "subject": "邮件主题",
  "text": "纯文本内容",
  "html": "<h1>HTML 内容</h1>",
  "attachments": [
    {
      "path": "/path/to/file.pdf",
      "filename": "document.pdf"
    },
    {
      "content": "base64-encoded-content",
      "filename": "attachment.txt"
    }
  ]
}
```

**必需参数：**
- `to`: 收件人地址数组
- `subject`: 邮件主题

**可选参数：**
- `auth`: 认证信息对象（包含 `user` 和 `pass`），优先级最高
- `provider`: 邮箱服务商（gmail, outlook, qq, 163, 126, sina, custom）
- `smtpConfig`: 自定义 SMTP 配置对象
- `from`: 发件人地址（默认使用配置的认证用户）
- `cc`: 抄送地址数组
- `bcc`: 密送地址数组
- `text`: 纯文本内容
- `html`: HTML 格式内容（与 `text` 至少提供一个）
- `attachments`: 附件数组

**附件格式：**
- `path`: 文件路径（本地文件系统）
- `content`: Base64 编码的文件内容
- `filename`: 附件文件名（必需）

**示例：**

```javascript
// 发送纯文本邮件
await client.callTool('send_email_smtp', {
  provider: 'gmail',
  to: ['recipient@example.com'],
  subject: '测试邮件',
  text: '这是一封测试邮件'
});

// 发送 HTML 邮件
await client.callTool('send_email_smtp', {
  provider: 'gmail',
  to: ['recipient@example.com'],
  subject: 'HTML 邮件',
  html: '<h1>标题</h1><p>内容</p>'
});

// 发送带附件的邮件
await client.callTool('send_email_smtp', {
  provider: 'gmail',
  to: ['recipient@example.com'],
  subject: '带附件的邮件',
  text: '请查看附件',
  attachments: [
    { path: '/path/to/file.pdf', filename: 'document.pdf' }
  ]
});
```

#### 2. receive_email_imap

通过 IMAP 协议接收邮件。

**参数：**

```json
{
  "auth": {
    "user": "your-email@gmail.com",
    "pass": "your-app-password"
  },
  "provider": "gmail",
  "mailbox": "INBOX",
  "limit": 10,
  "unseenOnly": false
}
```

**可选参数：**
- `auth`: 认证信息对象（包含 `user` 和 `pass`），优先级最高
- `provider`: 邮箱服务商
- `imapConfig`: 自定义 IMAP 配置对象
- `mailbox`: 邮箱文件夹名称（默认：INBOX）
- `limit`: 返回邮件数量限制（默认：10，最大建议 100）
- `unseenOnly`: 是否只返回未读邮件（默认：false）

**示例：**

```javascript
// 获取最近 10 封邮件
await client.callTool('receive_email_imap', {
  provider: 'gmail',
  limit: 10
});

// 获取未读邮件
await client.callTool('receive_email_imap', {
  provider: 'gmail',
  unseenOnly: true,
  limit: 20
});
```

#### 3. receive_email_pop3

通过 POP3 协议接收邮件。

**参数：**

```json
{
  "auth": {
    "user": "your-email@gmail.com",
    "pass": "your-app-password"
  },
  "provider": "gmail",
  "limit": 10
}
```

**可选参数：**
- `auth`: 认证信息对象（包含 `user` 和 `pass`），优先级最高
- `provider`: 邮箱服务商
- `pop3Config`: 自定义 POP3 配置对象
- `limit`: 返回邮件数量限制（默认：10，最大建议 100）

### 认证参数

所有工具都支持通过 `auth` 参数动态传递认证信息，这样可以在不修改配置文件的情况下使用不同的邮箱账户。

**认证参数格式：**

```json
{
  "auth": {
    "user": "your-email@example.com",
    "pass": "your-password-or-app-password"
  }
}
```

**配置优先级（从高到低）：**

1. **工具调用时的 `auth` 参数** - 最高优先级
2. **环境变量** (`EMAIL_USER`, `EMAIL_PASS`)
3. **配置文件** (`config.json` 中的 `auth` 字段)
4. **预定义服务商配置** - 最低优先级

**使用示例：**

```javascript
// 使用动态认证信息发送邮件
await client.callTool('send_email_smtp', {
  auth: {
    user: 'sender@example.com',
    pass: 'app-password-123'
  },
  provider: 'gmail',
  to: ['recipient@example.com'],
  subject: '测试邮件',
  text: '这是一封测试邮件'
});

// 如果未提供 auth 参数，将使用环境变量或配置文件中的认证信息
await client.callTool('send_email_smtp', {
  provider: 'gmail',
  to: ['recipient@example.com'],
  subject: '测试邮件',
  text: '这是一封测试邮件'
});
```

**示例：**

```javascript
// 获取最近 10 封邮件
await client.callTool('receive_email_pop3', {
  provider: 'gmail',
  limit: 10
});
```

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

## 发布到 npm

### npx 使用说明

`npx` 有两种使用方式：

1. **从 npm 仓库运行**（需要先发布）：
   ```bash
   npx sse-email-mcp-server
   ```
   这会从 npm 中央仓库下载并运行包。

2. **从本地路径运行**（无需发布）：
   ```bash
   npx /path/to/sse-email-mcp-server
   ```
   这会直接运行本地项目。

### 发布步骤

#### 1. 准备工作

**检查 package.json**

确保 `package.json` 中的信息完整：

```json
{
  "name": "sse-email-mcp-server",  // 确保包名未被占用
  "version": "1.0.0",              // 版本号
  "description": "...",            // 描述
  "author": "Your Name",           // 作者（可选但推荐）
  "license": "MIT",                // 许可证
  "repository": {                   // 仓库信息（推荐）
    "type": "git",
    "url": "https://github.com/yourusername/sse-email-mcp-server.git"
  },
  "keywords": [...],                // 关键词
  "bin": {                         // 确保 bin 字段正确
    "sse-email-mcp": "./bin/sse-email-mcp.js"
  }
}
```

**检查包名是否可用**

```bash
npm view sse-email-mcp-server
```

如果返回 404，说明包名可用。如果已被占用，需要修改包名。

#### 2. 创建 npm 账号

如果没有 npm 账号：

```bash
npm adduser
# 或访问 https://www.npmjs.com/signup 注册
```

#### 3. 登录 npm

```bash
npm login
```

#### 4. 检查发布前的准备

**确保 bin 文件有执行权限**

```bash
chmod +x bin/sse-email-mcp.js
```

**测试本地安装**

```bash
# 在项目目录下
npm link

# 测试命令是否可用
sse-email-mcp --help
```

**检查要发布的文件**

创建或检查 `.npmignore` 文件（或使用 `.gitignore`）：

```
node_modules/
.env
.env.*
config.json
*.log
.DS_Store
.git/
.vscode/
.idea/
```

#### 5. 发布

**发布公开包**

```bash
npm publish
```

**发布私有包（需要付费账号）**

```bash
npm publish --access restricted
```

#### 6. 验证发布

发布后，可以通过以下方式验证：

```bash
# 查看包信息
npm view sse-email-mcp-server

# 测试安装
npm install -g sse-email-mcp-server

# 测试运行
npx sse-email-mcp-server
```

#### 7. 更新版本

发布新版本时：

```bash
# 更新版本号（会自动更新 package.json）
npm version patch   # 1.0.0 -> 1.0.1 (补丁版本)
npm version minor   # 1.0.0 -> 1.1.0 (次要版本)
npm version major   # 1.0.0 -> 2.0.0 (主要版本)

# 然后发布
npm publish
```

### 发布检查清单

- [ ] 包名在 npm 上可用
- [ ] package.json 信息完整（name, version, description, author, license）
- [ ] bin 字段配置正确
- [ ] .npmignore 或 .gitignore 配置正确
- [ ] 代码已测试，功能正常
- [ ] README.md 文档完整
- [ ] 已登录 npm (`npm whoami` 验证)
- [ ] bin 文件有执行权限
- [ ] 本地测试通过 (`npm link` 测试)

### 发布常见问题

**包名已被占用**

如果包名已被占用，可以：
1. 使用带作用域的包名：`@yourusername/sse-email-mcp-server`
2. 修改包名：`sse-email-mcp-server-xxx`

**发布失败：需要 2FA**

如果启用了双因素认证，需要：
```bash
npm publish --otp=你的OTP代码
```

**撤销发布（24小时内）**

```bash
npm unpublish sse-email-mcp-server@1.0.0
```

注意：撤销后 24 小时内不能重新发布相同版本。

**推荐流程**

1. **开发阶段**：使用本地路径配置 MCP 客户端
2. **测试阶段**：使用 `npm link` 本地测试
3. **发布阶段**：发布到 npm
4. **生产使用**：使用 npx + 包名配置

## 配置优先级

配置加载优先级（从高到低）：

1. **工具调用时的参数** - `auth`、`smtpConfig`、`imapConfig`、`pop3Config`
2. **环境变量** - `EMAIL_USER`、`EMAIL_PASS`、`EMAIL_PROVIDER`、`SMTP_HOST` 等
3. **配置文件** - `config.json` 或 `.config.json`
4. **预定义服务商配置** - 内置的服务商配置（gmail、outlook、qq 等）

**示例：**

```javascript
// 优先级 1：工具调用参数（最高）
await client.callTool('send_email_smtp', {
  auth: { user: 'user1@example.com', pass: 'pass1' },
  smtpConfig: { host: 'custom.smtp.com', port: 587 }
});

// 优先级 2：环境变量
// EMAIL_USER=user2@example.com
// EMAIL_PASS=pass2

// 优先级 3：配置文件 config.json
// { "auth": { "user": "user3@example.com", "pass": "pass3" } }

// 优先级 4：预定义服务商配置（最低）
// provider: "gmail" 使用内置的 Gmail 配置
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

### Q8: 在 Windows x64 下连接 QQ 邮箱时 SSL 连接失败怎么办？

**问题描述：** 在 Windows x64 架构下，某些环境可能无法验证 QQ 邮箱的 SSL 证书，导致连接失败。

**为什么 ARM 架构（如 macOS Apple Silicon）下正常？**

不同架构和操作系统下 SSL 证书验证的行为可能不同，主要原因包括：

1. **证书存储机制不同**
   - **macOS (ARM)**: 使用系统 Keychain，证书管理更完善
   - **Windows (x64)**: 使用 Windows Certificate Store，某些情况下可能缺少中间证书
   - **Linux**: 使用系统 CA 证书包，取决于发行版

2. **OpenSSL 版本差异**
   - 不同架构的 Node.js 可能链接了不同版本的 OpenSSL
   - Windows 版本的 Node.js 通常自带 OpenSSL，可能与系统证书存储集成不够完善
   - macOS/Linux 版本可能使用系统级 OpenSSL，证书验证更严格

3. **证书链验证方式**
   - macOS 和 Linux 通常能自动获取完整的证书链
   - Windows 在某些情况下可能无法自动获取中间证书

4. **系统时间同步**
   - 证书验证依赖系统时间，Windows 系统时间不同步可能导致验证失败
   - macOS 通常自动同步时间

5. **网络环境差异**
   - 企业网络可能使用代理或防火墙，影响证书验证
   - 不同网络环境下的 DNS 解析可能不同

**解决方案：**

**方法一：在配置文件中禁用 SSL 证书验证（推荐用于开发环境）**

在 `config.json` 中为 QQ 邮箱添加 `tlsOptions`：

```json
{
  "providers": {
    "qq": {
      "smtp": {
        "host": "smtp.qq.com",
        "port": 587,
        "secure": false,
        "requireTLS": true,
        "tlsOptions": {
          "rejectUnauthorized": false
        }
      },
      "imap": {
        "host": "imap.qq.com",
        "port": 993,
        "secure": true,
        "tls": true,
        "tlsOptions": {
          "rejectUnauthorized": false
        }
      }
    }
  }
}
```

**方法二：在工具调用时传递 tlsOptions**

```javascript
// SMTP 发送
await client.callTool('send_email_smtp', {
  provider: 'qq',
  smtpConfig: {
    host: 'smtp.qq.com',
    port: 587,
    secure: false,
    requireTLS: true,
    tlsOptions: {
      rejectUnauthorized: false
    }
  },
  to: ['recipient@example.com'],
  subject: '测试邮件',
  text: '内容'
});

// IMAP 接收
await client.callTool('receive_email_imap', {
  provider: 'qq',
  imapConfig: {
    host: 'imap.qq.com',
    port: 993,
    secure: true,
    tls: true,
    tlsOptions: {
      rejectUnauthorized: false
    }
  }
});
```

**安全提示：**
- ⚠️ `rejectUnauthorized: false` 会禁用 SSL 证书验证，存在安全风险
- ✅ 生产环境建议使用正确的 SSL 证书或配置证书链
- ✅ 仅在开发环境或确认安全的情况下使用此选项

## 故障排除

### 错误：Cannot find module 'dotenv'

**原因：** 项目依赖未安装

**解决方案：**
```bash
cd sse-email-mcp-server
npm install
```

### 错误：Cannot find module 'nodemailer'

**原因：** 依赖未安装或安装不完整

**解决方案：**
```bash
# 删除 node_modules 和 package-lock.json，重新安装
rm -rf node_modules package-lock.json  # macOS/Linux
rmdir /s node_modules & del package-lock.json  # Windows

npm install
```

### 错误：权限被拒绝（Permission denied）

**原因：** bin 文件没有执行权限

**解决方案：**
```bash
# macOS/Linux
chmod +x bin/sse-email-mcp.js

# Windows 通常不需要，如果遇到问题，以管理员身份运行
```

### 错误：端口已被占用

**原因：** 3000 端口已被其他程序使用

**解决方案：**
```bash
# 使用环境变量指定其他端口
PORT=3001 node bin/sse-email-mcp.js

# 或在 .env 文件中设置
PORT=3001
```

### Windows 路径问题

在 Windows 上，路径可以使用：
- 正斜杠：`C:/Users/10180/Desktop/sse-email-mcp-server/bin/sse-email-mcp.js`
- 反斜杠：`C:\Users\10180\Desktop\sse-email-mcp-server\bin\sse-email-mcp.js`
- 双反斜杠：`C:\\Users\\10180\\Desktop\\sse-email-mcp-server\\bin\\sse-email-mcp.js`

推荐使用正斜杠，兼容性更好。

### 错误：ECONNREFUSED 或连接超时

**原因：** 无法连接到邮件服务器

**解决方案：**
1. 检查网络连接
2. 确认邮箱服务商的服务器地址和端口正确
3. 检查防火墙设置
4. 某些网络环境可能需要代理

### 错误：Invalid login 或认证失败

**原因：** 用户名或密码错误

**解决方案：**
1. 确认使用的是应用专用密码（Gmail、Outlook）或授权码（QQ）
2. 检查用户名和密码是否正确
3. 确认邮箱服务商的 SMTP/IMAP 服务已开启

### 错误：路径不存在（Windows）

**原因：** MCP 客户端配置中的路径格式错误

**解决方案：**
- Windows 路径可以使用正斜杠 `/` 或反斜杠 `\`
- 确保使用绝对路径
- 示例：`C:/Users/yourname/sse-email-mcp-server/bin/sse-email-mcp.js`

### 错误：附件文件不存在

**原因：** 附件路径错误或文件不存在

**解决方案：**
1. 确认文件路径正确（使用绝对路径）
2. 检查文件权限
3. 确认文件确实存在

### MCP 服务器未加载

**原因：** 配置错误或路径不正确

**解决方案：**
1. 检查 MCP 客户端配置文件格式（JSON 语法）
2. 确认路径是绝对路径
3. 确认已安装依赖（`npm install`）
4. 重启 MCP 客户端（Cursor 或 Claude Desktop）
5. 查看客户端日志获取详细错误信息

### 邮件发送成功但收件人未收到

**可能原因：**
1. 邮件被标记为垃圾邮件
2. 发件人地址被收件人邮箱服务商拦截
3. 邮件内容触发反垃圾邮件规则

**解决方案：**
1. 检查垃圾邮件文件夹
2. 使用已验证的发件人地址
3. 避免使用敏感词汇
4. 添加 SPF、DKIM 记录（企业邮箱）

### 错误：SSL/TLS 连接失败（Windows x64 + QQ 邮箱）

**原因：** 在 Windows x64 架构下，某些环境可能无法验证 QQ 邮箱的 SSL 证书

**为什么 ARM 架构（macOS/Linux）下正常？**

这主要是由于不同平台的 SSL/TLS 实现差异：

| 平台 | 证书存储 | OpenSSL 版本 | 证书链获取 | 常见问题 |
|------|---------|-------------|-----------|---------|
| macOS (ARM) | Keychain | 系统级/Node.js 自带 | 自动完整 | 较少 |
| Linux (ARM/x64) | 系统 CA 包 | 系统级 | 自动完整 | 较少 |
| Windows (x64) | Certificate Store | Node.js 自带 | 可能不完整 | 较常见 |

**主要原因：**
1. **证书存储机制**：Windows 的证书存储与 Node.js 的 OpenSSL 集成可能不如 macOS/Linux 完善
2. **中间证书缺失**：Windows 可能无法自动获取完整的证书链
3. **系统时间**：Windows 系统时间不同步会导致证书验证失败
4. **企业环境**：Windows 企业环境可能有代理或防火墙影响证书验证

**解决方案：**

1. **在配置文件中添加 tlsOptions**（推荐）

在 `config.json` 中为 QQ 邮箱配置：

```json
{
  "providers": {
    "qq": {
      "smtp": {
        "host": "smtp.qq.com",
        "port": 587,
        "secure": false,
        "requireTLS": true,
        "tlsOptions": {
          "rejectUnauthorized": false
        }
      },
      "imap": {
        "host": "imap.qq.com",
        "port": 993,
        "secure": true,
        "tls": true,
        "tlsOptions": {
          "rejectUnauthorized": false
        }
      }
    }
  }
}
```

2. **在工具调用时传递 tlsOptions**

```javascript
await client.callTool('send_email_smtp', {
  provider: 'qq',
  smtpConfig: {
    tlsOptions: { rejectUnauthorized: false }
  },
  // ... 其他参数
});
```

3. **更新 Node.js 版本**

某些旧版本的 Node.js 可能存在 SSL 证书验证问题，建议升级到最新 LTS 版本。

4. **检查系统时间**

证书验证依赖系统时间，确保 Windows 系统时间正确：
```powershell
# 检查系统时间
Get-Date

# 同步系统时间（需要管理员权限）
w32tm /resync
```

5. **更新 Windows 证书存储**

某些情况下，更新 Windows 根证书可能解决问题：
- 运行 Windows Update
- 确保系统证书存储是最新的

**为什么 ARM 架构（macOS/Linux）下正常？**

不同架构和操作系统下 SSL 证书验证的实现存在差异：

| 因素 | macOS (ARM) | Linux (ARM/x64) | Windows (x64) |
|------|------------|----------------|---------------|
| **证书存储** | Keychain（系统级） | 系统 CA 证书包 | Windows Certificate Store |
| **OpenSSL 集成** | 系统级 OpenSSL | 系统级 OpenSSL | Node.js 自带 OpenSSL |
| **证书链获取** | 自动完整 | 自动完整 | 可能不完整 |
| **证书验证** | 严格且完善 | 严格且完善 | 可能受环境影响 |
| **系统时间同步** | 自动同步 | 通常自动同步 | 可能需要手动同步 |

**主要原因：**
- **证书存储机制**：macOS 和 Linux 使用系统级证书存储，与 OpenSSL 集成更好
- **OpenSSL 版本**：Windows 版 Node.js 自带 OpenSSL，可能与系统证书存储集成不够完善
- **证书链验证**：macOS/Linux 通常能自动获取完整证书链，Windows 可能缺少中间证书
- **系统环境**：Windows 企业环境可能有代理、防火墙或组策略影响证书验证

**注意：** 禁用证书验证会降低安全性，仅在确认安全的环境下使用。

## 安全注意事项

### 🔒 认证信息安全

1. **不要硬编码密码**：不要在代码中直接写入密码，使用环境变量或配置文件
2. **使用应用专用密码**：Gmail、Outlook 等建议使用应用专用密码，而不是账户密码
3. **配置文件权限**：确保 `config.json` 文件权限设置正确
   ```bash
   # Linux/macOS
   chmod 600 config.json
   ```
4. **环境变量优先**：敏感信息优先使用环境变量，而不是配置文件
5. **动态认证**：在工具调用时通过 `auth` 参数传递认证信息，避免在配置文件中存储

### 📝 日志和调试

1. **敏感信息保护**：服务器不会在日志中记录密码等敏感信息
2. **调试模式**：生产环境关闭详细日志输出
3. **错误信息**：错误信息中不包含完整的认证信息

### 📎 附件安全

1. **文件大小限制**：注意附件大小限制，避免发送过大文件
2. **文件类型验证**：建议在应用层验证附件类型
3. **病毒扫描**：对上传的附件进行病毒扫描（如果可能）

### 🌐 网络安全

1. **TLS/SSL**：所有连接都使用 TLS/SSL 加密
2. **证书验证**：默认验证服务器证书，确保连接安全
3. **防火墙**：确保防火墙允许连接到邮件服务器端口

### 🔐 最佳实践

1. **定期更换密码**：定期更换应用专用密码
2. **最小权限原则**：只授予必要的邮箱访问权限
3. **监控异常**：监控邮件发送和接收的异常活动
4. **备份配置**：定期备份配置文件（加密存储）

## 开发

### 项目结构

```
sse-email-mcp-server/
├── src/
│   ├── server.js              # SSE MCP 服务器主类
│   ├── tools/
│   │   ├── send-email.js      # SMTP 邮件发送工具
│   │   ├── receive-imap.js    # IMAP 邮件接收工具
│   │   └── receive-pop3.js    # POP3 邮件接收工具
│   ├── providers/
│   │   ├── index.js           # 邮箱服务商配置
│   │   └── providers.json     # 预定义服务商配置
│   ├── config/
│   │   └── config-loader.js   # 配置加载器
│   └── utils/
│       └── email-validator.js # 邮件地址验证工具
├── bin/
│   └── sse-email-mcp.js       # npx 入口脚本
├── config.example.json         # 配置文件示例
├── mcp.example.json           # MCP 配置示例（本地运行）
├── mcp.example.npx.json       # MCP 配置示例（npx 运行）
├── mcp.example.local.json     # MCP 配置示例（本地 npx）
├── package.json
├── README.md                   # 本文档
├── PUBLISH.md                  # 发布指南
├── CROSS_PLATFORM.md          # 跨平台使用说明
├── SECURITY.md                 # 安全文档
└── mcp.config.guide.md        # MCP 配置详细指南
```

### 核心依赖

| 依赖包 | 版本 | 用途 |
|--------|------|------|
| `nodemailer` | ^8.0.0 | SMTP 邮件发送 |
| `imap` | ^0.8.17 | IMAP 协议支持 |
| `mailparser` | ^3.6.5 | 邮件解析 |
| `dotenv` | ^16.4.5 | 环境变量加载 |
| `fs-extra` | ^11.2.0 | 文件操作增强 |

### 开发环境设置

```bash
# 克隆项目
git clone <repository-url>
cd sse-email-mcp-server

# 安装依赖
npm install

# 复制配置文件
cp config.example.json config.json

# 编辑配置文件
# 添加你的邮箱认证信息

# 启动开发服务器
npm start
```

### 代码贡献

欢迎提交 Issue 和 Pull Request！

**贡献指南：**
1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 相关文档

- [PUBLISH.md](./PUBLISH.md) - 如何发布到 npm
- [CROSS_PLATFORM.md](./CROSS_PLATFORM.md) - 跨平台使用说明
- [SECURITY.md](./SECURITY.md) - 安全最佳实践
- [mcp.config.guide.md](./mcp.config.guide.md) - MCP 配置详细指南

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 本项目
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

### 贡献类型

- 🐛 报告 Bug
- 💡 提出新功能建议
- 📝 改进文档
- 🔧 代码优化和重构
- ✅ 添加测试用例

## 📞 支持

- 📧 提交 Issue：[GitHub Issues](https://github.com/your-repo/sse-email-mcp-server/issues)
- 📖 查看文档：[完整文档](./README.md)
- 💬 讨论交流：[GitHub Discussions](https://github.com/your-repo/sse-email-mcp-server/discussions)

## 🙏 致谢

感谢所有为本项目做出贡献的开发者！

---

**⭐ 如果这个项目对你有帮助，请给个 Star！**
