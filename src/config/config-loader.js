const fs = require('fs-extra');
const path = require('path');
const { getProviderConfig } = require('../providers');

let configCache = null;

/**
 * 根据邮箱地址自动检测服务商
 * @param {string} email - 邮箱地址
 * @returns {string|null} 服务商名称，如果无法识别则返回 null
 */
function detectProviderFromEmail(email) {
  if (!email || typeof email !== 'string') {
    return null;
  }

  const emailLower = email.toLowerCase();
  
  // 检测各种邮箱服务商
  if (emailLower.includes('@gmail.com')) {
    return 'gmail';
  }
  if (emailLower.includes('@outlook.com') || emailLower.includes('@hotmail.com') || emailLower.includes('@live.com')) {
    return 'outlook';
  }
  if (emailLower.includes('@qq.com')) {
    return 'qq';
  }
  if (emailLower.includes('@163.com')) {
    return '163';
  }
  if (emailLower.includes('@126.com')) {
    return '126';
  }
  if (emailLower.includes('@sina.com') || emailLower.includes('@sina.cn')) {
    return 'sina';
  }
  
  return null;
}

function loadConfigFile() {
  if (configCache) {
    return configCache;
  }

  const configPaths = [
    path.join(process.cwd(), 'config.json'),
    path.join(process.cwd(), '.config.json'),
    path.join(__dirname, '../../config.json')
  ];

  for (const configPath of configPaths) {
    try {
      if (fs.existsSync(configPath)) {
        configCache = fs.readJsonSync(configPath);
        return configCache;
      }
    } catch (error) {
      console.warn(`Failed to load config from ${configPath}:`, error.message);
    }
  }

  return null;
}

function getConfig() {
  const fileConfig = loadConfigFile();
  
  // 从环境变量读取配置
  const envConfig = {
    provider: process.env.EMAIL_PROVIDER,
    smtp: {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : undefined,
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    imap: {
      host: process.env.IMAP_HOST,
      port: process.env.IMAP_PORT ? parseInt(process.env.IMAP_PORT) : undefined,
      secure: process.env.IMAP_SECURE === 'true',
      user: process.env.IMAP_USER,
      pass: process.env.IMAP_PASS
    },
    pop3: {
      host: process.env.POP3_HOST,
      port: process.env.POP3_PORT ? parseInt(process.env.POP3_PORT) : undefined,
      secure: process.env.POP3_SECURE === 'true',
      user: process.env.POP3_USER,
      pass: process.env.POP3_PASS
    },
    auth: {
      user: process.env.EMAIL_USER || process.env.SMTP_USER,
      pass: process.env.EMAIL_PASS || process.env.SMTP_PASS
    }
  };

  // 合并配置：环境变量 > 配置文件 > 默认值
  const mergedConfig = {
    defaultProvider: fileConfig?.defaultProvider || envConfig.provider || 'gmail',
    providers: fileConfig?.providers || {},
    auth: envConfig.auth.user && envConfig.auth.pass 
      ? envConfig.auth 
      : (fileConfig?.auth || {})
  };

  // 如果环境变量有配置，添加到 providers
  if (envConfig.smtp.host) {
    mergedConfig.providers.custom = {
      smtp: {
        host: envConfig.smtp.host,
        port: envConfig.smtp.port || 587,
        secure: envConfig.smtp.secure || false
      }
    };
    if (envConfig.imap.host) {
      mergedConfig.providers.custom.imap = {
        host: envConfig.imap.host,
        port: envConfig.imap.port || 993,
        secure: envConfig.imap.secure !== false
      };
    }
    if (envConfig.pop3.host) {
      mergedConfig.providers.custom.pop3 = {
        host: envConfig.pop3.host,
        port: envConfig.pop3.port || 995,
        secure: envConfig.pop3.secure !== false
      };
    }
  }

  return mergedConfig;
}

function getSMTPConfig(providerName, requestConfig = {}) {
  const config = getConfig();
  
  // 优先级：请求参数中的 auth > 请求参数中的 smtpConfig.auth > 环境变量 > 配置文件 > 预定义服务商
  if (requestConfig.smtpConfig) {
    return {
      ...requestConfig.smtpConfig,
      auth: requestConfig.auth || requestConfig.smtpConfig.auth || config.auth
    };
  }
  
  // 自动检测服务商：如果没有指定 provider，尝试从邮箱地址检测
  let detectedProvider = providerName;
  if (!detectedProvider) {
    // 优先从请求参数中的 auth.user 检测
    if (requestConfig.auth?.user) {
      detectedProvider = detectProviderFromEmail(requestConfig.auth.user);
    }
    // 如果请求参数中没有，从配置中的 auth.user 检测
    if (!detectedProvider && config.auth?.user) {
      detectedProvider = detectProviderFromEmail(config.auth.user);
    }
    // 如果还是检测不到，使用默认值
    if (!detectedProvider) {
      detectedProvider = config.defaultProvider;
    }
  }
  
  // 如果请求参数中有 auth，使用它
  if (requestConfig.auth) {
    const provider = detectedProvider;
    
    // 从配置文件获取
    if (config.providers[provider]?.smtp) {
      return {
        ...config.providers[provider].smtp,
        auth: requestConfig.auth
      };
    }
    
    // 从预定义服务商获取
    const predefinedConfig = getProviderConfig(provider, 'smtp');
    if (predefinedConfig) {
      return {
        ...predefinedConfig,
        auth: requestConfig.auth
      };
    }
  }

  const provider = detectedProvider;
  
  // 从配置文件获取
  if (config.providers[provider]?.smtp) {
    return {
      ...config.providers[provider].smtp,
      auth: config.auth
    };
  }

  // 从预定义服务商获取
  const predefinedConfig = getProviderConfig(provider, 'smtp');
  if (predefinedConfig) {
    return {
      ...predefinedConfig,
      auth: config.auth
    };
  }

  throw new Error(`Provider ${provider} not found`);
}

function getIMAPConfig(providerName, requestConfig = {}) {
  const config = getConfig();
  
  // 优先级：请求参数中的 auth > 请求参数中的 imapConfig.auth > 环境变量 > 配置文件
  if (requestConfig.imapConfig) {
    return {
      ...requestConfig.imapConfig,
      auth: requestConfig.auth || requestConfig.imapConfig.auth || config.auth
    };
  }
  
  // 自动检测服务商：如果没有指定 provider，按优先级检测
  let detectedProvider = providerName;
  if (!detectedProvider) {
    // 优先级1: 使用环境变量中的 EMAIL_PROVIDER（如果设置了）
    const envProvider = process.env.EMAIL_PROVIDER;
    if (envProvider) {
      detectedProvider = envProvider.toLowerCase();
      console.log(`[IMAP Config] 使用环境变量 EMAIL_PROVIDER 中的服务商: ${detectedProvider}`);
    } else {
      // 优先级2: 从请求参数中的 auth.user 检测
      if (requestConfig.auth?.user) {
        detectedProvider = detectProviderFromEmail(requestConfig.auth.user);
        if (detectedProvider) {
          console.log(`[IMAP Config] 从请求参数自动检测到服务商: ${detectedProvider} (邮箱: ${requestConfig.auth.user})`);
        }
      }
      // 优先级3: 从配置中的 auth.user 检测
      if (!detectedProvider && config.auth?.user) {
        detectedProvider = detectProviderFromEmail(config.auth.user);
        if (detectedProvider) {
          console.log(`[IMAP Config] 从邮箱地址自动检测到服务商: ${detectedProvider} (邮箱: ${config.auth.user})`);
        }
      }
      // 优先级4: 使用默认值
      if (!detectedProvider) {
        detectedProvider = config.defaultProvider;
        console.log(`[IMAP Config] 使用默认服务商: ${detectedProvider}`);
      }
    }
  } else {
    console.log(`[IMAP Config] 使用指定的服务商: ${detectedProvider}`);
  }
  
  // 如果请求参数中有 auth，使用它
  if (requestConfig.auth) {
    const provider = detectedProvider;
    
    // 从配置文件获取
    if (config.providers[provider]?.imap) {
      return {
        ...config.providers[provider].imap,
        auth: requestConfig.auth
      };
    }
    
    // 从预定义服务商获取
    const predefinedConfig = getProviderConfig(provider, 'imap');
    if (predefinedConfig) {
      return {
        ...predefinedConfig,
        auth: requestConfig.auth
      };
    }
  }

  const provider = detectedProvider;
  
  if (config.providers[provider]?.imap) {
    return {
      ...config.providers[provider].imap,
      auth: config.auth
    };
  }

  const predefinedConfig = getProviderConfig(provider, 'imap');
  if (predefinedConfig) {
    return {
      ...predefinedConfig,
      auth: config.auth
    };
  }

  throw new Error(`IMAP config for provider ${provider} not found`);
}

function getPOP3Config(providerName, requestConfig = {}) {
  const config = getConfig();
  
  // 优先级：请求参数中的 auth > 请求参数中的 pop3Config.auth > 环境变量 > 配置文件
  if (requestConfig.pop3Config) {
    return {
      ...requestConfig.pop3Config,
      auth: requestConfig.auth || requestConfig.pop3Config.auth || config.auth
    };
  }
  
  // 自动检测服务商：如果没有指定 provider，尝试从邮箱地址检测
  let detectedProvider = providerName;
  if (!detectedProvider) {
    // 优先从请求参数中的 auth.user 检测
    if (requestConfig.auth?.user) {
      detectedProvider = detectProviderFromEmail(requestConfig.auth.user);
    }
    // 如果请求参数中没有，从配置中的 auth.user 检测
    if (!detectedProvider && config.auth?.user) {
      detectedProvider = detectProviderFromEmail(config.auth.user);
    }
    // 如果还是检测不到，使用默认值
    if (!detectedProvider) {
      detectedProvider = config.defaultProvider;
    }
  }
  
  // 如果请求参数中有 auth，使用它
  if (requestConfig.auth) {
    const provider = detectedProvider;
    
    // 从配置文件获取
    if (config.providers[provider]?.pop3) {
      return {
        ...config.providers[provider].pop3,
        auth: requestConfig.auth
      };
    }
    
    // 从预定义服务商获取
    const predefinedConfig = getProviderConfig(provider, 'pop3');
    if (predefinedConfig) {
      return {
        ...predefinedConfig,
        auth: requestConfig.auth
      };
    }
  }

  const provider = detectedProvider;
  
  if (config.providers[provider]?.pop3) {
    return {
      ...config.providers[provider].pop3,
      auth: config.auth
    };
  }

  const predefinedConfig = getProviderConfig(provider, 'pop3');
  if (predefinedConfig) {
    return {
      ...predefinedConfig,
      auth: config.auth
    };
  }

  throw new Error(`POP3 config for provider ${provider} not found`);
}

module.exports = {
  getConfig,
  getSMTPConfig,
  getIMAPConfig,
  getPOP3Config
};
