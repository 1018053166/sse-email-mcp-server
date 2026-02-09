#!/usr/bin/env node

require('dotenv').config();

// 输出环境变量加载状态（不显示敏感信息）
if (process.env.EMAIL_USER) {
  console.log(`[启动] 检测到邮箱配置: ${process.env.EMAIL_USER}`);
  if (process.env.EMAIL_PROVIDER) {
    console.log(`[启动] 指定服务商: ${process.env.EMAIL_PROVIDER} (来自环境变量 EMAIL_PROVIDER)`);
    console.log(`[启动] 提示: 调用工具时可以不指定 provider 参数，系统会自动使用环境变量中的 ${process.env.EMAIL_PROVIDER}`);
  } else {
    console.log(`[启动] 将自动检测服务商（从邮箱地址: ${process.env.EMAIL_USER}）`);
  }
} else {
  console.log(`[启动] 警告: 未检测到 EMAIL_USER 环境变量`);
}

// 检测是否在 stdio 模式下运行（MCP 客户端通过 stdio 通信）
const isStdioMode = !process.stdin.isTTY || process.env.MCP_STDIO === 'true';

if (isStdioMode) {
  // stdio 模式：用于 MCP 客户端
  const MCPStdioServer = require('../src/mcp-stdio');
  const server = new MCPStdioServer();

  // 导入工具
  const sendEmailTool = require('../src/tools/send-email');
  const receiveIMAPTool = require('../src/tools/receive-imap');
  const receivePOP3Tool = require('../src/tools/receive-pop3');
  const archiveEmailTool = require('../src/tools/archive-email');

  // 注册工具
  server.registerTool('send_email_smtp', sendEmailTool.handler, sendEmailTool.schema);
  server.registerTool('receive_email_imap', receiveIMAPTool.handler, receiveIMAPTool.schema);
  server.registerTool('receive_email_pop3', receivePOP3Tool.handler, receivePOP3Tool.schema);
  server.registerTool('archive_email', archiveEmailTool.handler, archiveEmailTool.schema);

  // 启动 stdio 服务器
  server.start();
} else {
  // SSE 模式：独立 HTTP 服务器
  const SSEMCPServer = require('../src/server');

  // 导入工具
  const sendEmailTool = require('../src/tools/send-email');
  const receiveIMAPTool = require('../src/tools/receive-imap');
  const receivePOP3Tool = require('../src/tools/receive-pop3');
  const archiveEmailTool = require('../src/tools/archive-email');

  const port = process.env.PORT || 3000;
  const server = new SSEMCPServer(port);

  // 注册工具
  server.registerTool('send_email_smtp', sendEmailTool.handler, sendEmailTool.schema);
  server.registerTool('receive_email_imap', receiveIMAPTool.handler, receiveIMAPTool.schema);
  server.registerTool('receive_email_pop3', receivePOP3Tool.handler, receivePOP3Tool.schema);
  server.registerTool('archive_email', archiveEmailTool.handler, archiveEmailTool.schema);

  console.log(`Starting SSE Email MCP Server on port ${port}...`);
  server.start();
  console.log(`Server started. SSE endpoint: http://localhost:${port}/sse`);
  console.log(`Message endpoint: http://localhost:${port}/message`);
}
