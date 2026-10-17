import mongoose from 'mongoose';
import { isValidHttpUrl } from '../utils/url.js';

const destination = {
  type: String,
  default: null,
  trim: true,
  maxlength: 2048,
  validate: {
    validator(value) {
      return value === null || value === undefined || value === '' || isValidHttpUrl(value);
    },
    message: 'Destination URLs must use http:// or https://',
  },
};

const redirectRulesSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
    },
    defaultUrl: destination,
    devices: {
      mobile: destination,
      tablet: destination,
      desktop: destination,
    },
  },
  { _id: false }
);

const qrSchema = new mongoose.Schema(
  {
    fgColor: { type: String, default: '#000000', trim: true, maxlength: 9 },
    bgColor: { type: String, default: '#ffffff', trim: true, maxlength: 9 },
    size: { type: Number, default: 320, min: 64, max: 1024 },
    errorCorrectionLevel: {
      type: String,
      enum: ['L', 'M', 'Q', 'H'],
      default: 'M',
    },
  },
  { _id: false }
);

const linkSchema = new mongoose.Schema(
  {
    originalUrl: {
      type: String,
      required: [true, 'Original URL is required'],
      trim: true,
      maxlength: 2048,
      validate: {
        validator: isValidHttpUrl,
        message: 'Original URL must be a valid http:// or https:// URL',
      },
    },
    shortCode: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 50,
    },
    customAlias: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 50,
    },
    title: {
      type: String,
      default: '',
      trim: true,
      maxlength: 200,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'disabled'],
      default: 'active',
    },
    clickCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    clickLimit: {
      type: Number,
      default: null,
      min: 1,
    },
    password: {
      type: String,
      default: null,
      select: false,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      default: null,
      index: true,
    },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag',
      },
    ],
    redirectRules: {
      type: redirectRulesSchema,
      default: () => ({}),
    },
    qr: {
      type: qrSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

linkSchema.index({ shortCode: 1 }, { unique: true });
linkSchema.index(
  { customAlias: 1 },
  { unique: true, partialFilterExpression: { customAlias: { $type: 'string' } } }
);
linkSchema.index({ workspace: 1, createdAt: -1 });
linkSchema.index({ owner: 1, createdAt: -1 });
linkSchema.index({ workspace: 1, campaign: 1 });
linkSchema.index({ workspace: 1, tags: 1 });

linkSchema.methods.isExpired = function isExpired(now = new Date()) {
  return Boolean(this.expiresAt && this.expiresAt.getTime() <= now.getTime());
};

linkSchema.methods.isLimitReached = function isLimitReached() {
  return this.clickLimit != null && this.clickCount >= this.clickLimit;
};

linkSchema.methods.hasPassword = function hasPassword() {
  return Boolean(this.password);
};

export default mongoose.model('Link', linkSchema);
