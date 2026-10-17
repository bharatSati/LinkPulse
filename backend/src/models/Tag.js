import mongoose from 'mongoose';
import { MAX_TAG_LENGTH, normalizeTagName } from '../utils/tags.js';

const tagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tag name is required'],
      trim: true,
      maxlength: MAX_TAG_LENGTH,
      set: normalizeTagName,
    },
    key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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

tagSchema.index({ workspace: 1, key: 1 }, { unique: true });
tagSchema.index({ workspace: 1, name: 1 });

export default mongoose.model('Tag', tagSchema);
