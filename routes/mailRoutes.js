const express = require('express');
const mailController = require('../controllers/mailController');

const router = express.Router();

// 邮件相关路由
router.post('/send', mailController.sendMail);
router.get('/inbox', mailController.getInbox);
router.get('/thread/:email', mailController.getThread);
router.post('/draft', mailController.saveDraft);

module.exports = router;
