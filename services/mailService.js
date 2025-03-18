const nodemailer = require('nodemailer');
const Mail = require('../models/Mail');
const config = require('../config/mailConfig');
const { detect } = require('langdetect');

class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.password
      }
    });
  }

  // 接收邮件
  async receiveMail(mailData) {
    try {
      // 检测邮件语言
      mailData.language = this.detectLanguage(mailData.content);
      
      // 查找相关邮件线程
      const thread = await Mail.findThread(mailData.from, mailData.subject);
      
      // 设置线程ID
      if (thread.length > 0) {
        mailData.threadId = thread[0].threadId || thread[0]._id;
      }

      // 保存邮件
      const mail = new Mail(mailData);
      await mail.save();

      // 自动生成回复草稿
      if (config.autoReply.enabled) {
        await this.generateDraftReply(mail);
      }

      return mail;
    } catch (error) {
      throw new Error(`邮件接收失败: ${error.message}`);
    }
  }

  // 发送邮件
  async sendMail(mailData) {
    try {
      const mailOptions = {
        from: mailData.from,
        to: mailData.to,
        subject: mailData.subject,
        text: mailData.text,
        html: mailData.html
      };

      // 发送邮件
      const info = await this.transporter.sendMail(mailOptions);

      // 保存发送记录
      const mail = new Mail({
        ...mailData,
        status: 'sent',
        metadata: {
          sentAt: new Date()
        }
      });
      await mail.save();

      return info;
    } catch (error) {
      throw new Error(`邮件发送失败: ${error.message}`);
    }
  }

  // 生成回复草稿
  async generateDraftReply(mail) {
    try {
      // 获取完整邮件线程
      const thread = await mail.thread;

      // 生成回复内容
      const replyContent = this.generateReplyContent(thread, mail);

      // 更新邮件草稿
      mail.draftReply = replyContent;
      await mail.save();

      return replyContent;
    } catch (error) {
      throw new Error(`生成回复草稿失败: ${error.message}`);
    }
  }

  // 检测邮件语言
  detectLanguage(content) {
    try {
      const result = detect(content);
      return result[0]?.lang || 'en';
    } catch (error) {
      return 'en';
    }
  }

  // 生成回复内容
  generateReplyContent(thread, currentMail) {
    const lastMessage = thread[thread.length - 1]?.content || '';
    const context = lastMessage.substring(0, 200);

    // 根据上下文生成回复
    return `感谢您的邮件。关于您提到的：
"${context}..."

我们正在处理您的请求，稍后会给出详细回复。

此致，
${config.signature}`;
  }
}

module.exports = new MailService();
