const readline = require('readline');

/**
 * MCP stdio 服务器
 * 通过标准输入输出进行 JSON-RPC 通信
 */
class MCPStdioServer {
  constructor() {
    this.tools = new Map();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });
  }

  // 注册工具
  registerTool(name, handler, schema) {
    this.tools.set(name, { handler, schema });
  }

  // 发送 JSON-RPC 响应
  sendResponse(id, result, error = null) {
    const response = {
      jsonrpc: '2.0',
      id
    };

    if (error) {
      response.error = {
        code: error.code || -32603,
        message: error.message || 'Internal error'
      };
    } else {
      response.result = result;
    }

    console.log(JSON.stringify(response));
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

  // 获取错误代码
  getErrorCode(error) {
    if (error.message.includes('not found')) {
      return -32601; // Method not found
    }
    if (error.message.includes('Invalid') || error.message.includes('required')) {
      return -32602; // Invalid params
    }
    return -32603; // Internal error
  }

  // 启动服务器
  start() {
    this.rl.on('line', async (line) => {
      try {
        if (!line.trim()) {
          return;
        }

        const request = JSON.parse(line);
        const { id, method, params } = request;

        if (!id || !method) {
          this.sendResponse(null, null, {
            code: -32600,
            message: 'Invalid request: missing id or method'
          });
          return;
        }

        // 处理请求
        try {
          const result = await this.handleMethod(method, params);
          this.sendResponse(id, result);
        } catch (error) {
          // 提供更详细的错误信息
          const errorMessage = error.message || 'Internal error';
          const errorStack = process.env.NODE_ENV === 'development' ? error.stack : undefined;
          
          this.sendResponse(id, null, {
            code: this.getErrorCode(error),
            message: errorMessage,
            data: errorStack ? { stack: errorStack } : undefined
          });
        }
      } catch (error) {
        // JSON 解析错误
        this.sendResponse(null, null, {
          code: -32700,
          message: 'Parse error'
        });
      }
    });

    this.rl.on('close', () => {
      process.exit(0);
    });

    // 处理错误
    process.stdin.on('error', (error) => {
      if (error.code !== 'EPIPE') {
        console.error('Stdin error:', error);
      }
    });
  }
}

module.exports = MCPStdioServer;
