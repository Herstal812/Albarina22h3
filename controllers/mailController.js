const nodemailer = require('nodemailer');
const mailConfig = require('../config/mailConfig');

// 创建邮件传输器
const transporter = nodemailer.createTransport(mailConfig);

const mailController = {
  // 发送邮件
  async sendMail(req, res) {
    try {
      const { to, subject, text } = req.body;
      
      const mailOptions = {
        from: mailConfig.auth.user,
        to,
        subject,
        text
      };

      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: '邮件发送成功' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // 获取收件箱
  async getInbox(req, res) {
    try {
      const { category } = req.query;
      // 根据分类获取邮件
      const mails = await Mail.find(category ? { category } : {});
      res.status(200).json(mails);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // 获取邮件往来
  async getThread(req, res) {
    try {
      const { email } = req.params;
      // 获取与指定邮箱的所有往来邮件
      const thread = await Mail.find({ $or: [{ from: email }, { to: email }] })
        .sort({ date: 1 });
      res.status(200).json(thread);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // 自动回复
  async autoReply(email) {
    const thread = await this.getThread({ params: { email } }, {});
    const lastMail = thread.body[thread.body.length - 1];
    
    // 检测邮件语言
    const detectedLang = await detectLanguage(lastMail.text);
    
    // 生成AI回复
    const replyText = await generateReply({
      thread: thread.body,
      currentMail: lastMail,
      language: detectedLang
    });
    
    return {
      to: email,
      subject: `回复：${lastMail.subject}`,
      text: replyText,
      language: detectedLang
    };
  },

  // 语言检测
  async detectLanguage(text) {
    const response = await fetch('https://api.languagedetection.com/detect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LANG_DETECT_API_KEY}`
      },
      body: JSON.stringify({ text })
    });
    const data = await response.json();
    return data.language;
  },

  // AI生成回复
  async generateReply({ thread, currentMail, language }) {
    const response = await fetch('https://api.ai.com/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_API_KEY}`
      },
      body: JSON.stringify({
        context: {
          thread,
          currentMail
        },
        language
      })
    });
    const data = await response.json();
    return data.reply;
  },

  // 保存草稿
  async saveDraft(req, res) {
    try {
      const { to, subject, text } = req.body;
      // 如果有发件人，生成自动回复草稿
      if (to) {
        const autoReplyDraft = await this.autoReply(to);
        await Draft.create(autoReplyDraft);
      }
      // 保存用户草稿
      await Draft.create({ to, subject, text });
      res.status(200).json({ message: '草稿保存成功' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = mailController;
