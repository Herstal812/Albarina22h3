const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const MailService = require('../services/mailService');
const Mail = require('../models/Mail');
const config = require('../config/mailConfig');

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('邮件系统测试', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('邮件接收测试', () => {
    it('应该成功接收并保存新邮件', async () => {
      const testMail = {
        from: { email: 'test@example.com', name: 'Test User' },
        to: [{ email: 'recipient@example.com', name: 'Recipient' }],
        subject: 'Test Subject',
        content: 'This is a test email'
      };

      sandbox.stub(Mail.prototype, 'save').resolves(testMail);
      sandbox.stub(Mail, 'findThread').resolves([]);

      const result = await MailService.receiveMail(testMail);
      expect(result).to.deep.equal(testMail);
    });

    it('应该检测到邮件语言', async () => {
      const testMail = {
        from: { email: 'test@example.com', name: 'Test User' },
        to: [{ email: 'recipient@example.com', name: 'Recipient' }],
        subject: 'Test Subject',
        content: '这是一封测试邮件'
      };

      sandbox.stub(Mail.prototype, 'save').resolves(testMail);
      sandbox.stub(Mail, 'findThread').resolves([]);
      sandbox.stub(MailService, 'detectLanguage').resolves('zh');

      const result = await MailService.receiveMail(testMail);
      expect(result.language).to.equal('zh');
    });
  });

  describe('邮件发送测试', () => {
    it('应该成功发送邮件', async () => {
      const testMail = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'This is a test email'
      };

      sandbox.stub(MailService.transporter, 'sendMail').resolves(true);
      sandbox.stub(Mail.prototype, 'save').resolves(testMail);

      const result = await MailService.sendMail(testMail);
      expect(result).to.be.true;
    });

    it('应该处理发送失败的情况', async () => {
      const testMail = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'This is a test email'
      };

      sandbox.stub(MailService.transporter, 'sendMail').rejects(new Error('Send failed'));

      await expect(MailService.sendMail(testMail)).to.be.rejectedWith('Send failed');
    });
  });

  describe('自动回复测试', () => {
    it('应该生成合适的回复草稿', async () => {
      const testMail = {
        from: { email: 'test@example.com', name: 'Test User' },
        to: [{ email: 'recipient@example.com', name: 'Recipient' }],
        subject: 'Test Subject',
        content: 'This is a test email',
        save: () => {}
      };

      const thread = [{
        from: { email: 'test@example.com', name: 'Test User' },
        content: 'Previous email content'
      }];

      const expectedReply = 'This is a generated reply';

      sandbox.stub(Mail, 'findThread').resolves(thread);
      sandbox.stub(MailService, 'generateDraftReply').resolves(expectedReply);

      await MailService.generateDraftReply(testMail);
      expect(testMail.draftReply).to.equal(expectedReply);
    });
  });
});
