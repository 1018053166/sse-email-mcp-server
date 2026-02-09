# 更新 GitHub 仓库 About 信息

## 方法一：在 GitHub 网页上手动更新（推荐）

1. 访问仓库页面：https://github.com/1018053166/sse-email-mcp-server
2. 点击仓库名称下方的 **⚙️ Settings** 图标（或直接点击仓库右侧的 **Settings**）
3. 在 "About" 部分：
   - **Description（描述）**：输入以下内容
     ```
     MCP server for email operations: send/receive emails via SMTP/IMAP/POP3, support Gmail/Outlook/QQ/163/126/Sina, with attachment support, HTML/text format, and dynamic auth. Perfect for AI assistants (Cursor/Claude Desktop) to handle email tasks.
     ```
   - **Topics（主题标签）**：添加以下标签（每行一个或逗号分隔）
     ```
     mcp, mcp-server, email, smtp, imap, pop3, nodemailer, mail, server-sent-events, sse, cursor, claude-desktop, ai-assistant, email-automation, gmail, outlook, qq-mail, email-client, email-server, nodejs
     ```
4. 点击 **Save changes**

## 方法二：使用脚本自动更新

### 前提条件
1. 获取 GitHub Personal Access Token：
   - 访问：https://github.com/settings/tokens
   - 点击 "Generate new token (classic)"
   - 选择 `repo` 权限
   - 复制生成的 token

2. 设置环境变量：
   ```bash
   export GITHUB_TOKEN=your_token_here
   ```

3. 运行脚本：
   ```bash
   ./update-github-about.sh
   ```

## 更新的内容

### Description（描述）
```
MCP server for email operations: send/receive emails via SMTP/IMAP/POP3, support Gmail/Outlook/QQ/163/126/Sina, with attachment support, HTML/text format, and dynamic auth. Perfect for AI assistants (Cursor/Claude Desktop) to handle email tasks.
```

### Topics（主题标签）
- mcp
- mcp-server
- email
- smtp
- imap
- pop3
- nodemailer
- mail
- server-sent-events
- sse
- cursor
- claude-desktop
- ai-assistant
- email-automation
- gmail
- outlook
- qq-mail
- email-client
- email-server
- nodejs
