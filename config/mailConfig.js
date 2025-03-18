module.exports = {
  host: process.env.MAIL_HOST || 'smtp.example.com',
  port: process.env.MAIL_PORT || 587,
  secure: process.env.MAIL_SECURE === 'true',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  },
  tls: {
    rejectUnauthorized: process.env.MAIL_TLS_REJECT_UNAUTHORIZED !== 'false'
  },
  apis: {
    ai: {
      url: process.env.AI_API_URL || 'https://api.example.com/v1/chat',
      key: process.env.AI_API_KEY
    },
    languageDetection: {
      url: process.env.LANG_API_URL || 'https://api.example.com/v1/detect',
      key: process.env.LANG_API_KEY
    }
  },
  security: {
    maxAttachmentSize: process.env.MAX_ATTACHMENT_SIZE || 10485760, // 10MB
    allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,xls,xlsx,txt,jpg,png').split(','),
    spamFilter: {
      enabled: process.env.SPAM_FILTER_ENABLED === 'true',
      apiUrl: process.env.SPAM_FILTER_API_URL
    }
  },
  rateLimiting: {
    maxEmailsPerHour: process.env.MAX_EMAILS_PER_HOUR || 100,
    maxRecipientsPerEmail: process.env.MAX_RECIPIENTS_PER_EMAIL || 50
  }
};
