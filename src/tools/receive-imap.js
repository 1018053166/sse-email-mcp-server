const Imap = require('imap');
const { getIMAPConfig } = require('../config/config-loader');
const { simpleParser } = require('mailparser');

/**
 * 接收邮件工具（IMAP）
 * @param {Object} args - 工具参数
 * @returns {Promise<Object>} 邮件列表
 */
async function receiveEmailIMAP(args) {
  const {
    provider,
    imapConfig,
    auth,  // 支持从请求参数传递认证信息
    mailbox = 'INBOX',
    limit = 10,
    unseenOnly = false
  } = args;

  // 获取 IMAP 配置（支持从请求参数传递 auth）
  let config;
  let detectedProvider = provider;
  try {
    config = getIMAPConfig(provider, { imapConfig, auth });
    // 如果未指定 provider，尝试从配置中获取检测到的服务商
    if (!provider && config.auth?.user) {
      const email = config.auth.user;
      if (email.includes('@qq.com')) detectedProvider = 'qq';
      else if (email.includes('@gmail.com')) detectedProvider = 'gmail';
      else if (email.includes('@outlook.com') || email.includes('@hotmail.com')) detectedProvider = 'outlook';
      else if (email.includes('@163.com')) detectedProvider = '163';
      else if (email.includes('@126.com')) detectedProvider = '126';
      else if (email.includes('@sina.com') || email.includes('@sina.cn')) detectedProvider = 'sina';
    }
    
    // 输出调试信息
    console.log(`[IMAP] 使用服务商: ${detectedProvider || provider || 'auto-detected'}`);
    console.log(`[IMAP] 服务器: ${config.host}:${config.port}`);
    console.log(`[IMAP] 邮箱地址: ${config.auth?.user || '未设置'}`);
    console.log(`[IMAP] TLS/SSL: ${config.secure || config.tls ? '是' : '否'}`);
  } catch (error) {
    throw new Error(`获取 IMAP 配置失败: ${error.message}`);
  }

  // 验证认证信息
  if (!config.auth || !config.auth.user || !config.auth.pass) {
    throw new Error('IMAP 认证信息缺失，请配置 EMAIL_USER/EMAIL_PASS 环境变量或配置文件中的 auth 字段');
  }

  return new Promise((resolve, reject) => {
    // 默认 TLS 选项：在 Windows x64 等环境下，可能需要禁用证书验证
    // 注意：生产环境建议使用正确的证书，这里为了兼容性提供选项
    const defaultTlsOptions = {
      rejectUnauthorized: config.tlsOptions?.rejectUnauthorized !== undefined 
        ? config.tlsOptions.rejectUnauthorized 
        : true  // 默认验证证书，但可以通过配置禁用
    };
    
    const imap = new Imap({
      user: config.auth.user,
      password: config.auth.pass,
      host: config.host,
      port: config.port,
      tls: config.secure || config.tls || false,
      tlsOptions: { ...defaultTlsOptions, ...(config.tlsOptions || {}) },
      connTimeout: 10000, // 10秒连接超时
      authTimeout: 5000,  // 5秒认证超时
      keepalive: true
    });

    const emails = [];
    let opened = false;
    let connectionTimeout;

    // 设置连接超时
    connectionTimeout = setTimeout(() => {
      if (!opened) {
        imap.end();
        reject(new Error(`连接 IMAP 服务器超时 (${config.host}:${config.port})。请检查：1) 网络连接 2) 服务器地址和端口 3) 防火墙设置`));
      }
    }, 15000); // 15秒总超时

    imap.once('ready', () => {
      clearTimeout(connectionTimeout);
      imap.openBox(mailbox, false, (err, box) => {
        if (err) {
          imap.end();
          return reject(new Error(`打开邮箱失败: ${err.message}`));
        }

        opened = true;

        // 构建搜索条件
        const searchCriteria = unseenOnly ? ['UNSEEN'] : ['ALL'];

        imap.search(searchCriteria, (err, results) => {
          if (err) {
            imap.end();
            return reject(new Error(`搜索邮件失败: ${err.message}`));
          }

          if (!results || results.length === 0) {
            imap.end();
            return resolve({
              success: true,
              count: 0,
              emails: []
            });
          }

          // 限制邮件数量
          const fetchResults = results.slice(-limit);

          const fetch = imap.fetch(fetchResults, {
            bodies: '',
            struct: true
          });

          let processedCount = 0;

          fetch.on('message', (msg, seqno) => {
            let emailBody = '';
            let attributes = null;

            msg.on('body', (stream, info) => {
              stream.on('data', (chunk) => {
                emailBody += chunk.toString('utf8');
              });
            });

            msg.once('attributes', (attrs) => {
              attributes = attrs;
            });

            msg.once('end', () => {
              // 解析完整邮件
              simpleParser(emailBody)
                .then(parsed => {
                  // 处理附件信息
                  const attachments = (parsed.attachments || []).map(att => ({
                    filename: att.filename || att.contentId || 'unnamed',
                    contentType: att.contentType || 'application/octet-stream',
                    size: att.size || 0,
                    contentId: att.contentId || null,
                    // 注意：不包含实际内容，避免数据过大。如果需要内容，可以通过归档工具获取
                    hasContent: !!att.content
                  }));

                  const email = {
                    uid: attributes.uid,
                    seqno: seqno,
                    subject: parsed.subject || '(无主题)',
                    from: parsed.from ? (parsed.from.value || []).map(a => a.address || a.name).join(', ') : '未知',
                    to: parsed.to ? (parsed.to.value || []).map(a => a.address || a.name).join(', ') : '',
                    date: parsed.date ? parsed.date.toISOString() : null,
                    flags: attributes.flags || [],
                    text: parsed.text ? parsed.text.substring(0, 500) : '', // 正文预览（前500字符）
                    html: parsed.html ? parsed.html.substring(0, 1000) : '', // HTML 预览（前1000字符）
                    attachments: attachments, // 附件列表
                    attachmentCount: attachments.length // 附件数量
                  };

                  emails.push(email);
                  processedCount++;

                  if (processedCount === fetchResults.length) {
                    imap.end();
                    resolve({
                      success: true,
                      count: emails.length,
                      emails: emails.reverse() // 最新的在前
                    });
                  }
                })
                .catch(err => {
                  console.warn(`解析邮件失败: ${err.message}`);
                  // 即使解析失败，也返回基本信息
                  const email = {
                    uid: attributes.uid,
                    seqno: seqno,
                    subject: '(解析失败)',
                    from: '未知',
                    to: '',
                    date: null,
                    flags: attributes.flags || [],
                    attachments: [],
                    attachmentCount: 0
                  };
                  emails.push(email);
                  processedCount++;
                  if (processedCount === fetchResults.length) {
                    imap.end();
                    resolve({
                      success: true,
                      count: emails.length,
                      emails: emails.reverse()
                    });
                  }
                });
            });
          });

          fetch.once('error', (err) => {
            imap.end();
            reject(new Error(`获取邮件失败: ${err.message}`));
          });
        });
      });
    });

    imap.once('error', (err) => {
      clearTimeout(connectionTimeout);
      if (!opened) {
        let errorMessage = `IMAP 连接失败: ${err.message}`;
        
        // 提供更详细的错误信息
        if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
          errorMessage = `无法连接到 IMAP 服务器 ${config.host}:${config.port}。错误: ${err.message}。请检查：1) 网络连接 2) 服务器地址和端口是否正确 3) 防火墙设置`;
        } else if (err.code === 'EAUTH') {
          errorMessage = `IMAP 认证失败。请检查用户名和密码是否正确。注意：Gmail 需要使用应用专用密码，而不是普通密码。`;
        } else if (err.message && err.message.includes('ENOTFOUND')) {
          errorMessage = `无法解析 IMAP 服务器地址 ${config.host}。请检查服务器地址是否正确。`;
        }
        
        reject(new Error(errorMessage));
      }
    });

    imap.once('end', () => {
      // 连接已关闭
    });

    imap.connect();
  });
}

// 工具 Schema
const schema = {
  type: 'object',
  properties: {
    provider: {
      type: 'string',
      enum: ['gmail', 'outlook', 'qq', '163', '126', 'sina', 'custom'],
      description: '邮箱服务商，可选值：gmail, outlook, qq, 163, 126, sina, custom。如果不指定，系统会从环境变量 EMAIL_PROVIDER 或邮箱地址自动检测。建议：如果环境变量中已配置 EMAIL_PROVIDER，可以不传此参数，系统会自动使用环境变量中的值。'
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
    imapConfig: {
      type: 'object',
      properties: {
        host: { type: 'string', description: 'IMAP 服务器地址' },
        port: { type: 'number', description: 'IMAP 端口' },
        secure: { type: 'boolean', description: '是否使用 SSL/TLS' },
        auth: {
          type: 'object',
          properties: {
            user: { type: 'string', description: '邮箱用户名' },
            pass: { type: 'string', description: '邮箱密码或应用密码' }
          }
        }
      },
      description: '自定义 IMAP 配置，会覆盖默认配置'
    },
    mailbox: {
      type: 'string',
      default: 'INBOX',
      description: '邮箱文件夹名称，默认为 INBOX'
    },
    limit: {
      type: 'number',
      default: 10,
      description: '返回邮件数量限制，默认为 10'
    },
    unseenOnly: {
      type: 'boolean',
      default: false,
      description: '是否只返回未读邮件，默认为 false'
    }
  },
  required: [],
  description: `通过 IMAP 协议接收邮件，支持查询未读邮件和指定邮箱文件夹。

重要提示：
1. provider 参数是可选的。如果不指定，系统会按以下优先级选择：
   - 优先使用环境变量 EMAIL_PROVIDER 的值
   - 如果未设置 EMAIL_PROVIDER，则从邮箱地址自动检测（如 @qq.com 自动识别为 qq）
   - 最后使用默认值 gmail

2. 如果环境变量中已配置 EMAIL_PROVIDER（如 qq），建议不传 provider 参数，让系统自动使用环境变量中的值。

3. auth 参数也是可选的。如果不指定，系统会使用环境变量 EMAIL_USER 和 EMAIL_PASS 的值。`
};

module.exports = {
  handler: receiveEmailIMAP,
  schema
};
