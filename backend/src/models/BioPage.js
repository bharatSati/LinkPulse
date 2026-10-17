import mongoose from 'mongoose';
import { isValidHttpUrl } from '../utils/url.js';
import {
  BIO_BUTTON_STYLES,
  BIO_SOCIAL_PLATFORMS,
  BIO_THEMES,
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_TEXT_COLOR,
  MAX_BIO_DESCRIPTION,
  MAX_BIO_LINK_TITLE,
  MAX_BIO_TITLE,
  isHexColor,
  normalizeUsername,
} from '../utils/bio.js';

const linkItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: '',
      trim: true,
      maxlength: MAX_BIO_LINK_TITLE,
    },
    url: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2048,
    },
    link: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Link',
      default: null,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const socialItemSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: BIO_SOCIAL_PLATFORMS,
      default: 'website',
    },
    url: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2048,
    },
  },
  { _id: true }
);

const bioPageSchema = new mongoose.Schema(
  {
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
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 30,
      set: normalizeUsername,
    },
    title: {
      type: String,
      default: '',
      trim: true,
      maxlength: MAX_BIO_TITLE,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: MAX_BIO_DESCRIPTION,
    },
    avatarUrl: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
      validate: {
        validator(value) {
          return !value || isValidHttpUrl(value);
        },
        message: 'Avatar URL must be a valid http:// or https:// URL',
      },
    },
    backgroundColor: {
      type: String,
      default: DEFAULT_BACKGROUND_COLOR,
      validate: {
        validator: (value) => isHexColor(value),
        message: 'Background color must be a hex value such as #0b0d10',
      },
    },
    textColor: {
      type: String,
      default: DEFAULT_TEXT_COLOR,
      validate: {
        validator: (value) => isHexColor(value),
        message: 'Text color must be a hex value such as #f3f5f7',
      },
    },
    buttonStyle: {
      type: String,
      enum: BIO_BUTTON_STYLES,
      default: 'solid',
    },
    theme: {
      type: String,
      enum: BIO_THEMES,
      default: 'dark',
    },
    links: {
      type: [linkItemSchema],
      default: [],
    },
    socialLinks: {
      type: [socialItemSchema],
      default: [],
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

bioPageSchema.index({ workspace: 1, createdAt: -1 });
bioPageSchema.index({ owner: 1, createdAt: -1 });

export default mongoose.model('BioPage', bioPageSchema);
