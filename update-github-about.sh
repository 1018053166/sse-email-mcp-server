#!/bin/bash

# 更新 GitHub 仓库的 about 信息
# 使用方法: ./update-github-about.sh

OWNER="1018053166"
REPO="sse-email-mcp-server"

# 检查是否设置了 GITHUB_TOKEN
if [ -z "$GITHUB_TOKEN" ]; then
    echo "错误: 请先设置 GITHUB_TOKEN 环境变量"
    echo "获取 token: https://github.com/settings/tokens"
    echo "然后运行: export GITHUB_TOKEN=your_token"
    exit 1
fi

# 更新仓库描述和主题
curl -X PATCH \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/$OWNER/$REPO \
  -d '{
    "description": "MCP server for email operations: send/receive emails via SMTP/IMAP/POP3, support Gmail/Outlook/QQ/163/126/Sina, with attachment support, HTML/text format, and dynamic auth. Perfect for AI assistants (Cursor/Claude Desktop) to handle email tasks.",
    "topics": [
      "mcp",
      "mcp-server",
      "email",
      "smtp",
      "imap",
      "pop3",
      "nodemailer",
      "mail",
      "server-sent-events",
      "sse",
      "cursor",
      "claude-desktop",
      "ai-assistant",
      "email-automation",
      "gmail",
      "outlook",
      "qq-mail",
      "email-client",
      "email-server",
      "nodejs"
    ]
  }'

echo ""
echo "✅ GitHub 仓库 about 信息已更新！"
