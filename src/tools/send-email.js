const nodemailer = require('nodemailer');
const fs = require('fs-extra');
const path = require('path');
const { getSMTPConfig } = require('../config/config-loader');
const { validateEmailAddresses } = require('../utils/email-validator');

/**
 * 发送邮件工具
 * @param {Object} args - 工具参数
 * @returns {Promise<Object>} 发送结果
 */
async function sendEmail(args) {
  const {
    provider,
    smtpConfig,
    auth,  // 支持从请求参数传递认证信息
    from,
    to,
    cc = [],
    bcc = [],
    subject,
    text,
    html,
    attachments = []
  } = args;

  // 验证必需参数
  if (!to || !Array.isArray(to) || to.length === 0) {
    throw new Error('收件人地址 (to) 是必需的，且必须是非空数组');
  }

  if (!subject) {
    throw new Error('邮件主题 (subject) 是必需的');
  }

  // 验证邮件地址
  const toValidation = validateEmailAddresses(to);
  if (!toValidation.valid) {
    throw new Error(toValidation.error);
  }

  if (cc.length > 0) {
    const ccValidation = validateEmailAddresses(cc);
    if (!ccValidation.valid) {
      throw new Error(ccValidation.error);
    }
  }

  if (bcc.length > 0) {
    const bccValidation = validateEmailAddresses(bcc);
    if (!bccValidation.valid) {
      throw new Error(bccValidation.error);
    }
  }

  // 获取 SMTP 配置（支持从请求参数传递 auth）
  let config;
  try {
    config = getSMTPConfig(provider, { smtpConfig, auth });
  } catch (error) {
    throw new Error(`获取 SMTP 配置失败: ${error.message}`);
  }

  // 验证认证信息
  if (!config.auth || !config.auth.user || !config.auth.pass) {
    throw new Error('SMTP 认证信息缺失，请配置 EMAIL_USER/EMAIL_PASS 环境变量或配置文件中的 auth 字段');
  }

  // 创建邮件传输器
  // 在 Windows x64 等环境下，QQ 邮箱等可能遇到 SSL 证书验证问题
  // 可以通过 tls 选项配置证书验证行为
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure || false,
    requireTLS: config.requireTLS || false,
    auth: {
      user: config.auth.user,
      pass: config.auth.pass
    },
    // TLS 选项：支持自定义证书验证
    tls: config.tls || (config.tlsOptions ? {
      rejectUnauthorized: config.tlsOptions.rejectUnauthorized !== undefined 
        ? config.tlsOptions.rejectUnauthorized 
        : true  // 默认验证证书
    } : undefined)
  });

  // 处理附件
  const processedAttachments = [];
  for (const attachment of attachments) {
    if (attachment.path) {
      // 从文件路径读取
      const filePath = path.isAbsolute(attachment.path)
        ? attachment.path
        : path.join(process.cwd(), attachment.path);
      
      if (!await fs.pathExists(filePath)) {
        throw new Error(`附件文件不存在: ${filePath}`);
      }

      processedAttachments.push({
        filename: attachment.filename || path.basename(filePath),
        path: filePath
      });
    } else if (attachment.content) {
      // Base64 内容
      processedAttachments.push({
        filename: attachment.filename || 'attachment',
        content: attachment.content,
        encoding: 'base64'
      });
    } else {
      throw new Error('附件必须提供 path 或 content 字段');
    }
  }

  // 构建邮件选项
  const mailOptions = {
    from: from || config.auth.user,
    to: to.join(', '),
    subject: subject
  };

  if (cc.length > 0) {
    mailOptions.cc = cc.join(', ');
  }

  if (bcc.length > 0) {
    mailOptions.bcc = bcc.join(', ');
  }

  if (text) {
    mailOptions.text = text;
  }

  if (html) {
    mailOptions.html = html;
  }

  if (!text && !html) {
    throw new Error('邮件内容不能为空，请提供 text 或 html 字段');
  }

  if (processedAttachments.length > 0) {
    mailOptions.attachments = processedAttachments;
  }

  // 发送邮件
  try {
    const info = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected
    };
  } catch (error) {
    throw new Error(`发送邮件失败: ${error.message}`);
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
    smtpConfig: {
      type: 'object',
      properties: {
        host: { type: 'string', description: 'SMTP 服务器地址' },
        port: { type: 'number', description: 'SMTP 端口' },
        secure: { type: 'boolean', description: '是否使用 SSL/TLS' },
        auth: {
          type: 'object',
          properties: {
            user: { type: 'string', description: '邮箱用户名' },
            pass: { type: 'string', description: '邮箱密码或应用密码' }
          }
        }
      },
      description: '自定义 SMTP 配置，会覆盖默认配置'
    },
    from: {
      type: 'string',
      description: '发件人地址，默认为配置的认证用户'
    },
    to: {
      type: 'array',
      items: { type: 'string' },
      description: '收件人地址列表'
    },
    cc: {
      type: 'array',
      items: { type: 'string' },
      description: '抄送地址列表'
    },
    bcc: {
      type: 'array',
      items: { type: 'string' },
      description: '密送地址列表'
    },
    subject: {
      type: 'string',
      description: '邮件主题'
    },
    text: {
      type: 'string',
      description: '纯文本邮件内容'
    },
    html: {
      type: 'string',
      description: 'HTML 格式邮件内容'
    },
    attachments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '附件文件路径' },
          filename: { type: 'string', description: '附件文件名' },
          content: { type: 'string', description: '附件 Base64 编码内容' }
        }
      },
      description: '附件列表，支持文件路径或 Base64 内容'
    }
  },
  required: ['to', 'subject'],
  description: '通过 SMTP 协议发送邮件，支持多种邮箱服务商和自定义配置'
};

module.exports = {
  handler: sendEmail,
  schema
};
