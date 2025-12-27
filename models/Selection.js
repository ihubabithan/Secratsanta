const mongoose = require('mongoose');
const crypto = require('crypto');

// Ensure encryption key is exactly 32 bytes and IV is exactly 16 bytes
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY 
  ? Buffer.from(process.env.ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32))
  : crypto.randomBytes(32);

const ENCRYPTION_IV = process.env.ENCRYPTION_IV
  ? Buffer.from(process.env.ENCRYPTION_IV.padEnd(16, '0').slice(0, 16))
  : crypto.randomBytes(16);

function encrypt(text) {
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, ENCRYPTION_IV);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString('hex');
}

function decrypt(text) {
  const encryptedText = Buffer.from(text, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, ENCRYPTION_IV);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

const selectionSchema = new mongoose.Schema({
  giverUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // Each user can only make one selection
  },
  encryptedReceiverName: {
    type: String,
    required: true,
    unique: true // Each participant can only be selected once
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index to ensure one selection per giver
selectionSchema.index({ giverUserId: 1 }, { unique: true });

// Index to ensure one selection per receiver name
selectionSchema.index({ encryptedReceiverName: 1 }, { unique: true });

// Method to decrypt receiver name
selectionSchema.methods.getDecryptedReceiverName = function() {
  return decrypt(this.encryptedReceiverName);
};

// Static method to encrypt receiver name
selectionSchema.statics.encryptReceiverName = function(name) {
  return encrypt(name);
};

module.exports = mongoose.model('Selection', selectionSchema);
