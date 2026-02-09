const net = require('net');
const tls = require('tls');
const { getPOP3Config } = require('../config/config-loader');
const { simpleParser } = require('mailparser');

/**
 * POP3 客户端实现
 */
class POP3Client {
  constructor(host, port, options = {}) {
    this.host = host;
    this.port = port;
    this.secure = options.secure || options.tls || false;
    this.socket = null;
    this.connected = false;
    this.buffer = '';
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (this.secure) {
        this.socket = tls.connect(this.port, this.host, {
          rejectUnauthorized: false
        }, () => {
          this.connected = true;
          this.readResponse().then(resolve).catch(reject);
        });
      } else {
        this.socket = net.createConnection(this.port, this.host, () => {
          this.connected = true;
          this.readResponse().then(resolve).catch(reject);
        });
      }

      this.socket.on('data', (data) => {
        this.buffer += data.toString();
      });

      this.socket.on('error', (err) => {
        reject(err);
      });

      this.socket.on('close', () => {
        this.connected = false;
      });
    });
  }

  sendCommand(command) {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        return reject(new Error('Not connected'));
      }

      this.buffer = '';
      this.socket.write(command + '\r\n');

      this.readResponse()
        .then(resolve)
        .catch(reject);
    });
  }

  readResponse() {
    return new Promise((resolve, reject) => {
      const checkResponse = () => {
        if (this.buffer.includes('\r\n')) {
          const lines = this.buffer.split('\r\n');
          const firstLine = lines[0];
          this.buffer = lines.slice(1).join('\r\n');

          if (firstLine.startsWith('+OK')) {
            resolve({
              success: true,
              message: firstLine.substring(3).trim(),
              data: lines.slice(1).filter(l => l).join('\r\n')
            });
          } else if (firstLine.startsWith('-ERR')) {
            reject(new Error(firstLine.substring(4).trim()));
          } else {
            resolve({
              success: true,
              message: firstLine,
              data: lines.slice(1).filter(l => l).join('\r\n')
            });
          }
        } else {
          setTimeout(checkResponse, 50);
        }
      };

      setTimeout(() => {
        if (!this.buffer.includes('\r\n')) {
          reject(new Error('Timeout waiting for response'));
        }
      }, 10000);

      checkResponse();
    });
  }

  login(user, pass) {
    return this.sendCommand(`USER ${user}`)
      .then(() => this.sendCommand(`PASS ${pass}`));
  }

  list() {
    return this.sendCommand('LIST')
      .then(response => {
        const lines = response.data.split('\r\n').filter(l => l);
        const messages = [];
        
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 2) {
            messages.push([parseInt(parts[0]), parseInt(parts[1])]);
          }
        }

        return messages;
      });
  }

  retr(msgNum) {
    return new Promise((resolve, reject) => {
      this.buffer = '';
      this.socket.write(`RETR ${msgNum}\r\n`);

      let emailData = '';
      let collecting = false;

      const dataHandler = (data) => {
        const text = data.toString();
        this.buffer += text;

        if (!collecting && this.buffer.includes('\r\n')) {
          const firstLine = this.buffer.split('\r\n')[0];
          if (firstLine.startsWith('+OK')) {
            collecting = true;
            emailData = this.buffer.substring(this.buffer.indexOf('\r\n') + 2);
          } else if (firstLine.startsWith('-ERR')) {
            this.socket.removeListener('data', dataHandler);
            reject(new Error(firstLine.substring(4).trim()));
            return;
          }
        } else if (collecting) {
          emailData += text;
          
          // POP3 邮件以 \r\n.\r\n 结尾
          if (emailData.endsWith('\r\n.\r\n')) {
            this.socket.removeListener('data', dataHandler);
            resolve(emailData.substring(0, emailData.length - 5)); // 移除结尾的 \r\n.\r\n
          }
        }
      };

      this.socket.on('data', dataHandler);

      setTimeout(() => {
        this.socket.removeListener('data', dataHandler);
        if (!emailData) {
          reject(new Error('Timeout waiting for email data'));
        } else {
          resolve(emailData);
        }
      }, 30000);
    });
  }

  quit() {
    if (this.connected) {
      this.sendCommand('QUIT').catch(() => {});
      this.socket.end();
      this.connected = false;
    }
  }
}

/**
 * 接收邮件工具（POP3）
 * @param {Object} args - 工具参数
 * @returns {Promise<Object>} 邮件列表
 */
async function receiveEmailPOP3(args) {
  const {
    provider,
    pop3Config,
    auth,  // 支持从请求参数传递认证信息
    limit = 10
  } = args;

  // 获取 POP3 配置（支持从请求参数传递 auth）
  let config;
  try {
    config = getPOP3Config(provider, { pop3Config, auth });
  } catch (error) {
    throw new Error(`获取 POP3 配置失败: ${error.message}`);
  }

  // 验证认证信息
  if (!config.auth || !config.auth.user || !config.auth.pass) {
    throw new Error('POP3 认证信息缺失，请配置 EMAIL_USER/EMAIL_PASS 环境变量或配置文件中的 auth 字段');
  }

  const client = new POP3Client(config.host, config.port, {
    secure: config.secure || config.tls || false
  });

  try {
    // 连接服务器
    await client.connect();

    // 登录
    await client.login(config.auth.user, config.auth.pass);

    // 获取邮件列表
    const list = await client.list();

    if (!list || list.length === 0) {
      client.quit();
      return {
        success: true,
        count: 0,
        emails: []
      };
    }

    // 限制邮件数量（POP3 通常从旧到新，取最新的）
    const messages = list.slice(-limit).reverse();

    const emails = [];

    // 获取每封邮件
    for (const [msgNum] of messages) {
      try {
        const emailData = await client.retr(msgNum);
        
        // 解析邮件
        const parsed = await simpleParser(emailData);
        
        // 处理附件信息
        const attachments = (parsed.attachments || []).map(att => ({
          filename: att.filename || att.contentId || 'unnamed',
          contentType: att.contentType || 'application/octet-stream',
          size: att.size || 0,
          contentId: att.contentId || null,
          // 注意：不包含实际内容，避免数据过大。如果需要内容，可以通过归档工具获取
          hasContent: !!att.content
        }));
        
        emails.push({
          msgNum: msgNum,
          subject: parsed.subject || '(无主题)',
          from: parsed.from ? (parsed.from.value || []).map(a => a.address || a.name).join(', ') : '未知',
          to: parsed.to ? (parsed.to.value || []).map(a => a.address || a.name).join(', ') : '',
          date: parsed.date ? parsed.date.toISOString() : null,
          text: parsed.text ? parsed.text.substring(0, 500) : '', // 只返回前500字符预览
          html: parsed.html ? parsed.html.substring(0, 1000) : '', // HTML 预览
          attachments: attachments, // 附件列表
          attachmentCount: attachments.length // 附件数量
        });
      } catch (err) {
        console.warn(`获取邮件 ${msgNum} 失败: ${err.message}`);
      }
    }

    client.quit();

    return {
      success: true,
      count: emails.length,
      emails: emails
    };
  } catch (error) {
    client.quit();
    throw new Error(`POP3 操作失败: ${error.message}`);
  }
}

// 工具 Schema
const schema = {
  type: 'object',
  properties: {
    provider: {
      type: 'string',
      enum: ['gmail', 'outlook', 'qq', '163', '126', 'sina', 'custom'],
      description: '邮箱服务商，可选值：gmail, outlook, qq, 163, 126, sina, custom'
    },
    auth: {
      type: 'object',
      properties: {
        user: { type: 'string', description: '邮箱用户名（邮箱地址）' },
        pass: { type: 'string', description: '邮箱密码或应用专用密码' }
      },
      required: ['user', 'pass'],
      description: '邮箱认证信息，可直接在请求中传递，优先级高于环境变量和配置文件'
    },
    pop3Config: {
      type: 'object',
      properties: {
        host: { type: 'string', description: 'POP3 服务器地址' },
        port: { type: 'number', description: 'POP3 端口' },
        secure: { type: 'boolean', description: '是否使用 SSL/TLS' },
        auth: {
          type: 'object',
          properties: {
            user: { type: 'string', description: '邮箱用户名' },
            pass: { type: 'string', description: '邮箱密码或应用密码' }
          }
        }
      },
      description: '自定义 POP3 配置，会覆盖默认配置'
    },
    limit: {
      type: 'number',
      default: 10,
      description: '返回邮件数量限制，默认为 10'
    }
  },
  required: [],
  description: '通过 POP3 协议接收邮件，POP3 协议限制较多，主要支持基本接收功能'
};

module.exports = {
  handler: receiveEmailPOP3,
  schema
};
