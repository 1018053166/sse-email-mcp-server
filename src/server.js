const http = require('http');
const url = require('url');

class SSEMCPServer {
  constructor(port = 3000) {
    this.port = port;
    this.clients = new Map(); // 存储 SSE 客户端连接
    this.tools = new Map(); // 存储工具处理函数
    this.server = null;
    this.heartbeatInterval = null;
  }

  // 注册工具
  registerTool(name, handler, schema) {
    this.tools.set(name, { handler, schema });
  }

  // 处理 SSE 连接
  handleSSE(req, res) {
    // 设置 SSE 响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // 保存客户端连接
    const clientId = Date.now();
    this.clients.set(clientId, res);

    // 发送连接确认消息
    this.sendSSEMessage(res, {
      type: 'connected',
      clientId: clientId
    });

    // 客户端断开时清理
    req.on('close', () => {
      this.clients.delete(clientId);
    });

    req.on('aborted', () => {
      this.clients.delete(clientId);
    });
  }

  // 处理消息请求
  async handleMessage(req, res) {
    // 设置 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理 OPTIONS 预检请求
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const request = JSON.parse(body);
        const { id, method, params } = request;

        if (!id || !method) {
          throw new Error('Invalid request: missing id or method');
        }

        // 处理请求
        const result = await this.handleMethod(method, params);

        // 构造响应
        const response = {
          jsonrpc: '2.0',
          id,
          result
        };

        // 通过 SSE 推送响应
        this.broadcastSSEMessage(response);

        // 同时返回 HTTP 响应
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } catch (error) {
        // 错误处理
        const request = JSON.parse(body || '{}');
        const errorResponse = {
          jsonrpc: '2.0',
          id: request.id || null,
          error: {
            code: this.getErrorCode(error),
            message: error.message || 'Internal error'
          }
        };

        this.broadcastSSEMessage(errorResponse);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(errorResponse));
      }
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      res.writeHead(500);
      res.end('Internal Server Error');
    });
  }

  // 处理 MCP 方法
  async handleMethod(method, params) {
    switch (method) {
      case 'initialize':
        return this.handleInitialize(params);
      
      case 'tools/list':
        return this.handleToolsList();
      
      case 'tools/call':
        return this.handleToolsCall(params);
      
      default:
        throw new Error(`Method not found: ${method}`);
    }
  }

  // 处理 initialize 方法
  handleInitialize(params) {
    return {
      protocolVersion: params?.protocolVersion || '2024-11-05',
      capabilities: {
        tools: {}
      },
      serverInfo: {
        name: 'sse-email-mcp-server',
        version: '1.0.0'
      }
    };
  }

  // 处理 tools/list 方法
  handleToolsList() {
    const tools = [];
    
    for (const [name, { schema }] of this.tools.entries()) {
      tools.push({
        name,
        description: schema.description || '',
        inputSchema: schema
      });
    }

    return { tools };
  }

  // 处理 tools/call 方法
  async handleToolsCall(params) {
    const { name, arguments: args } = params;

    if (!name) {
      throw new Error('Tool name is required');
    }

    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    // 调用工具处理函数
    const result = await tool.handler(args);
    
    return {
      content: [
        {
          type: 'text',
          text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  // 获取错误代码
  getErrorCode(error) {
    if (error.message.includes('not found')) {
      return -32601; // Method not found
    }
    if (error.message.includes('Invalid')) {
      return -32602; // Invalid params
    }
    return -32603; // Internal error
  }

  // 发送 SSE 消息到指定客户端
  sendSSEMessage(res, message) {
    try {
      const data = JSON.stringify(message);
      res.write(`data: ${data}\n\n`);
    } catch (error) {
      console.error('Failed to send SSE message:', error);
    }
  }

  // 广播 SSE 消息给所有客户端
  broadcastSSEMessage(message) {
    const data = JSON.stringify(message);
    const deadClients = [];

    this.clients.forEach((res, clientId) => {
      try {
        res.write(`data: ${data}\n\n`);
      } catch (error) {
        console.error(`Failed to send to client ${clientId}:`, error);
        deadClients.push(clientId);
      }
    });

    // 清理断开的连接
    deadClients.forEach(id => this.clients.delete(id));
  }

  // 启动心跳
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((res, clientId) => {
        try {
          res.write(': heartbeat\n\n');
        } catch (error) {
          this.clients.delete(clientId);
        }
      });
    }, 30000); // 30秒一次
  }

  // 停止心跳
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // 启动服务器
  start() {
    const createServer = () => {
      return http.createServer((req, res) => {
        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;

        if (pathname === '/sse' && req.method === 'GET') {
          this.handleSSE(req, res);
        } else if (pathname === '/message' && req.method === 'POST') {
          this.handleMessage(req, res);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        }
      });
    };

    const tryListen = (port, maxAttempts = 10, attempt = 0) => {
      if (attempt >= maxAttempts) {
        console.error(`Failed to find available port after ${maxAttempts} attempts`);
        process.exit(1);
      }

      this.server = createServer();

      this.server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`Port ${port} is already in use. Trying port ${port + 1}...`);
          tryListen(port + 1, maxAttempts, attempt + 1);
        } else {
          console.error('Server error:', error);
          process.exit(1);
        }
      });

      this.server.listen(port, () => {
        this.port = port;
        console.log(`SSE Email MCP Server listening on port ${this.port}`);
      });
    };

    tryListen(this.port);

    // 启动心跳
    this.startHeartbeat();

    // 优雅关闭
    process.on('SIGTERM', () => this.stop());
    process.on('SIGINT', () => this.stop());
  }

  // 停止服务器
  stop() {
    this.stopHeartbeat();
    
    if (this.server) {
      this.server.close(() => {
        console.log('Server stopped');
      });
    }
  }
}

module.exports = SSEMCPServer;
