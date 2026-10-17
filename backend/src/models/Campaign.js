import mongoose from 'mongoose';

export const CAMPAIGN_STATUSES = ['active', 'archived', 'completed'];

const campaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Campaign name is required'],
      trim: true,
      maxlength: 120,
    },
    nameKey: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 1000,
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tag',
      },
    ],
    status: {
      type: String,
      enum: CAMPAIGN_STATUSES,
      default: 'active',
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
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

campaignSchema.index({ workspace: 1, nameKey: 1 }, { unique: true });
campaignSchema.index({ workspace: 1, status: 1 });
campaignSchema.index({ workspace: 1, createdAt: -1 });

export default mongoose.model('Campaign', campaignSchema);
