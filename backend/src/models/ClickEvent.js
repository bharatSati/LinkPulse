import mongoose from 'mongoose';

const clickEventSchema = new mongoose.Schema(
  {
    link: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Link',
      required: true,
      index: true,
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    referrer: {
      type: String,
      default: null,
      maxlength: 2048,
    },
    referrerDomain: {
      type: String,
      default: null,
      maxlength: 255,
    },
    country: {
      type: String,
      default: null,
      maxlength: 2,
    },
    region: {
      type: String,
      default: null,
      maxlength: 100,
    },
    deviceType: {
      type: String,
      enum: ['mobile', 'desktop', 'tablet', 'unknown'],
      default: 'unknown',
    },
    browser: {
      type: String,
      default: null,
      maxlength: 60,
    },
    operatingSystem: {
      type: String,
      default: null,
      maxlength: 60,
    },
    userAgent: {
      type: String,
      default: null,
      maxlength: 512,
    },
    ipHash: {
      type: String,
      default: null,
      maxlength: 64,
    },
  },
  { timestamps: false }
);

clickEventSchema.index({ workspace: 1, timestamp: -1 });
clickEventSchema.index({ link: 1, timestamp: -1 });
clickEventSchema.index({ workspace: 1, timestamp: -1, deviceType: 1 });
clickEventSchema.index({ link: 1, ipHash: 1 });
clickEventSchema.index({ workspace: 1, referrerDomain: 1, timestamp: -1 });

export default mongoose.model('ClickEvent', clickEventSchema);
