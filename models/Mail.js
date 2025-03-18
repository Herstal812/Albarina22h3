const mongoose = require('mongoose');
const { Schema } = mongoose;

const attachmentSchema = new Schema({
  filename: String,
  contentType: String,
  size: Number,
  path: String,
  status: {
    type: String,
    enum: ['pending', 'scanned', 'rejected'],
    default: 'pending'
  }
});

const metadataSchema = new Schema({
  receivedAt: Date,
  sentAt: Date,
  readAt: Date,
  attachments: [attachmentSchema],
  spamScore: Number,
  headers: Schema.Types.Mixed
});

const mailSchema = new Schema({
  from: {
    email: String,
    name: String
  },
  to: [{
    email: String,
    name: String
  }],
  cc: [{
    email: String,
    name: String
  }],
  bcc: [{
    email: String,
    name: String
  }],
  subject: String,
  content: String,
  language: String,
  threadId: Schema.Types.ObjectId,
  draftReply: String,
  metadata: metadataSchema,
  status: {
    type: String,
    enum: ['received', 'sent', 'draft', 'archived'],
    default: 'received'
  },
  labels: [String],
  importance: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 静态方法：查找邮件线程
mailSchema.statics.findThread = async function(from, subject) {
  const normalizedSubject = subject.replace(/^(Re:|Fwd:)\s*/i, '');
  return this.find({
    $or: [
      { subject: { $regex: `^Re: ${normalizedSubject}$`, $options: 'i' } },
      { subject: { $regex: `^Fwd: ${normalizedSubject}$`, $options: 'i' } },
      { subject: normalizedSubject }
    ],
    'from.email': from.email
  }).sort({ createdAt: 1 });
};

// 虚拟字段：获取完整线程
mailSchema.virtual('thread').get(function() {
  return this.constructor.find({ threadId: this.threadId || this._id });
});

// 索引
mailSchema.index({ 'from.email': 1 });
mailSchema.index({ subject: 1 });
mailSchema.index({ threadId: 1 });
mailSchema.index({ status: 1 });
mailSchema.index({ labels: 1 });

module.exports = mongoose.model('Mail', mailSchema);
