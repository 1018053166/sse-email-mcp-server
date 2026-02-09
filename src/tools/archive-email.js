const fs = require('fs-extra');
const path = require('path');
const Imap = require('imap');
const { getIMAPConfig } = require('../config/config-loader');
const { simpleParser } = require('mailparser');

/**
 * 邮件归档工具
 * 将邮件及其附件保存到本地目录
 * @param {Object} args - 工具参数
 * @returns {Promise<Object>} 归档结果
 */
async function archiveEmail(args) {
  const {
    provider,
    imapConfig,
    auth,
    mailbox = 'INBOX',
    limit = 10,
    unseenOnly = false,
    archiveDir, // 归档目录
    includeAttachments = true, // 是否提取附件到单独目录（附件已包含在 EML 中）
    extractAttachments = false, // 是否将附件提取到单独目录（默认 false，附件在 EML 中）
    includeParsedContent = true, // 是否保存解析后的内容（文本、HTML、元数据）
    folderStructure = 'date' // 目录结构：'date' 按日期, 'sender' 按发件人, 'flat' 扁平结构
  } = args;

  // 验证归档目录
  if (!archiveDir) {
    throw new Error('归档目录 archiveDir 是必需的');
  }

  // 获取 IMAP 配置
  let config;
  try {
    config = getIMAPConfig(provider, { imapConfig, auth });
  } catch (error) {
    throw new Error(`获取 IMAP 配置失败: ${error.message}`);
  }

  // 验证认证信息
  if (!config.auth || !config.auth.user || !config.auth.pass) {
    throw new Error('IMAP 认证信息缺失，请配置 EMAIL_USER/EMAIL_PASS 环境变量或配置文件中的 auth 字段');
  }

  // 确保归档目录存在
  const baseArchiveDir = path.isAbsolute(archiveDir) 
    ? archiveDir 
    : path.join(process.cwd(), archiveDir);
  
  await fs.ensureDir(baseArchiveDir);

  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: config.auth.user,
      password: config.auth.pass,
      host: config.host,
      port: config.port,
      tls: config.secure || config.tls || false,
      tlsOptions: config.tlsOptions || {},
      connTimeout: 10000,
      authTimeout: 5000,
      keepalive: true
    });

    const archivedEmails = [];
    let opened = false;
    let connectionTimeout;

    connectionTimeout = setTimeout(() => {
      if (!opened) {
        imap.end();
        reject(new Error(`连接 IMAP 服务器超时 (${config.host}:${config.port})`));
      }
    }, 15000);

    imap.once('ready', () => {
      clearTimeout(connectionTimeout);
      imap.openBox(mailbox, false, (err, box) => {
        if (err) {
          imap.end();
          return reject(new Error(`打开邮箱失败: ${err.message}`));
        }

        opened = true;

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
              archived: [],
              message: '没有找到邮件'
            });
          }

          const fetchResults = results.slice(-limit);
          const fetch = imap.fetch(fetchResults, {
            bodies: '',
            struct: true
          });

          let processedCount = 0;

          fetch.on('message', async (msg, seqno) => {
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

            msg.once('end', async () => {
              try {
                const parsed = await simpleParser(emailBody);
                
                // 确定邮件保存目录
                let emailDir = baseArchiveDir;
                if (folderStructure === 'date' && parsed.date) {
                  const date = new Date(parsed.date);
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  emailDir = path.join(baseArchiveDir, String(year), month);
                } else if (folderStructure === 'sender' && parsed.from) {
                  const sender = parsed.from.value && parsed.from.value[0] 
                    ? parsed.from.value[0].address || parsed.from.value[0].name 
                    : 'unknown';
                  // 清理发件人地址中的特殊字符
                  const safeSender = sender.replace(/[<>@]/g, '_').replace(/[^a-zA-Z0-9._-]/g, '_');
                  emailDir = path.join(baseArchiveDir, safeSender);
                }
                
                await fs.ensureDir(emailDir);

                // 生成安全的文件名（基于主题和日期）
                const safeSubject = (parsed.subject || 'no-subject')
                  .replace(/[<>:"/\\|?*]/g, '_')
                  .substring(0, 100);
                const dateStr = parsed.date 
                  ? new Date(parsed.date).toISOString().replace(/[:.]/g, '-').substring(0, 19)
                  : Date.now();
                const uid = attributes.uid || seqno;
                const emailFileName = `${dateStr}_${uid}_${safeSubject}`;

                // 标准归档：保存 EML 文件（原始邮件格式，RFC 822）
                // EML 文件包含完整的邮件信息，包括附件（multipart 格式）
                const emlFileName = `${emailFileName}.eml`;
                const emlFilePath = path.join(emailDir, emlFileName);
                
                // 保存原始 EML 文件（这是标准的邮件归档格式）
                await fs.writeFile(emlFilePath, emailBody, 'utf8');

                // 可选：保存解析后的内容到子目录（便于快速访问）
                let emailDirPath = null;
                if (includeParsedContent || extractAttachments) {
                  emailDirPath = path.join(emailDir, emailFileName);
                  await fs.ensureDir(emailDirPath);

                  // 保存文本正文
                  if (includeParsedContent && parsed.text) {
                    await fs.writeFile(
                      path.join(emailDirPath, 'body.txt'),
                      parsed.text,
                      'utf8'
                    );
                  }

                  // 保存 HTML 正文
                  if (includeParsedContent && parsed.html) {
                    await fs.writeFile(
                      path.join(emailDirPath, 'body.html'),
                      parsed.html,
                      'utf8'
                    );
                  }
                }

                // 保存邮件元数据（可选，便于快速查询）
                let metadata = null;
                if (includeParsedContent && emailDirPath) {
                  metadata = {
                    uid: attributes.uid,
                    seqno: seqno,
                    subject: parsed.subject || '(无主题)',
                    from: parsed.from ? (parsed.from.value || []).map(a => ({
                      name: a.name,
                      address: a.address
                    })) : [],
                    to: parsed.to ? (parsed.to.value || []).map(a => ({
                      name: a.name,
                      address: a.address
                    })) : [],
                    cc: parsed.cc ? (parsed.cc.value || []).map(a => ({
                      name: a.name,
                      address: a.address
                    })) : [],
                    bcc: parsed.bcc ? (parsed.bcc.value || []).map(a => ({
                      name: a.name,
                      address: a.address
                    })) : [],
                    date: parsed.date ? parsed.date.toISOString() : null,
                    flags: attributes.flags || [],
                    messageId: parsed.messageId,
                    inReplyTo: parsed.inReplyTo,
                    references: parsed.references,
                    emlFile: emlFileName, // 指向 EML 文件
                    attachmentCount: parsed.attachments ? parsed.attachments.length : 0
                  };

                  await fs.writeJson(
                    path.join(emailDirPath, 'metadata.json'),
                    metadata,
                    { spaces: 2 }
                  );
                }

                // 提取附件到单独目录（可选，附件已包含在 EML 中）
                const savedAttachments = [];
                if (extractAttachments && parsed.attachments && parsed.attachments.length > 0 && emailDirPath) {
                  const attachmentsDir = path.join(emailDirPath, 'attachments');
                  await fs.ensureDir(attachmentsDir);

                  for (const attachment of parsed.attachments) {
                    const filename = attachment.filename || attachment.contentId || `attachment_${savedAttachments.length}`;
                    const safeFilename = filename.replace(/[<>:"/\\|?*]/g, '_');
                    const attachmentPath = path.join(attachmentsDir, safeFilename);

                    if (attachment.content) {
                      await fs.writeFile(attachmentPath, attachment.content);
                      savedAttachments.push({
                        filename: safeFilename,
                        contentType: attachment.contentType,
                        size: attachment.size,
                        path: attachmentPath
                      });
                    }
                  }
                }

                archivedEmails.push({
                  uid: attributes.uid,
                  seqno: seqno,
                  subject: parsed.subject || '(无主题)',
                  date: parsed.date ? parsed.date.toISOString() : null,
                  emlFile: emlFilePath, // EML 文件路径（主要归档文件）
                  archivePath: emailDirPath || emlFilePath, // 归档路径
                  attachmentsCount: parsed.attachments ? parsed.attachments.length : 0,
                  extractedAttachments: savedAttachments.length, // 提取的附件数量
                  attachments: savedAttachments
                });

                processedCount++;
                if (processedCount === fetchResults.length) {
                  imap.end();
                  resolve({
                    success: true,
                    count: archivedEmails.length,
                    archived: archivedEmails,
                    archiveDir: baseArchiveDir
                  });
                }
              } catch (err) {
                console.error(`归档邮件失败: ${err.message}`);
                processedCount++;
                if (processedCount === fetchResults.length) {
                  imap.end();
                  resolve({
                    success: true,
                    count: archivedEmails.length,
                    archived: archivedEmails,
                    archiveDir: baseArchiveDir,
                    errors: [`归档过程中出现错误: ${err.message}`]
                  });
                }
              }
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
        reject(new Error(`IMAP 连接失败: ${err.message}`));
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
      description: '邮箱服务商，可选值：gmail, outlook, qq, 163, 126, sina, custom。如果不指定，系统会从环境变量 EMAIL_PROVIDER 或邮箱地址自动检测。'
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
      description: '归档邮件数量限制，默认为 10'
    },
    unseenOnly: {
      type: 'boolean',
      default: false,
      description: '是否只归档未读邮件，默认为 false'
    },
    archiveDir: {
      type: 'string',
      description: '归档目录路径（绝对路径或相对于当前工作目录的路径）'
    },
    includeAttachments: {
      type: 'boolean',
      default: true,
      description: '已废弃，请使用 extractAttachments。附件已包含在 EML 文件中。'
    },
    extractAttachments: {
      type: 'boolean',
      default: false,
      description: '是否将附件提取到单独目录（默认 false）。注意：附件已包含在 EML 文件中（multipart 格式），提取附件只是为了便于直接访问。'
    },
    includeParsedContent: {
      type: 'boolean',
      default: true,
      description: '是否保存解析后的内容（文本、HTML、元数据 JSON），默认为 true。这些文件便于快速查看，但 EML 文件是标准归档格式。'
    },
    folderStructure: {
      type: 'string',
      enum: ['date', 'sender', 'flat'],
      default: 'date',
      description: '目录结构类型：date（按日期，年/月）、sender（按发件人）、flat（扁平结构，所有邮件在同一目录）'
    }
  },
  required: ['archiveDir'],
  description: `将邮件归档到本地目录，使用标准的 EML 格式（RFC 822）。

标准归档格式：
- {日期}_{UID}_{主题}.eml: 原始邮件文件（EML 格式，包含完整邮件信息和附件）

可选文件（如果 includeParsedContent=true）：
- {日期}_{UID}_{主题}/body.txt: 纯文本正文
- {日期}_{UID}_{主题}/body.html: HTML 正文
- {日期}_{UID}_{主题}/metadata.json: 邮件元数据（便于快速查询）
- {日期}_{UID}_{主题}/attachments/: 提取的附件目录（如果 extractAttachments=true）

重要说明：
1. EML 文件是标准的邮件归档格式，可以被所有邮件客户端打开（Outlook、Thunderbird、Apple Mail 等）
2. 附件已包含在 EML 文件中（multipart 格式），这是标准方式
3. 提取附件到单独目录只是为了便于直接访问，不是必需的
4. 目录结构支持按日期、按发件人或扁平结构`
};

module.exports = {
  handler: archiveEmail,
  schema
};
