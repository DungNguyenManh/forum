import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReportDocument = HydratedDocument<Report>;

export type ReportTargetType = 'post' | 'comment' | 'user';
export type ReportStatus = 'pending' | 'reviewed' | 'rejected' | 'action_taken';

@Schema({ timestamps: true })
export class Report {
    @Prop({ required: true, enum: ['post', 'comment', 'user'] })
    targetType: ReportTargetType;

    @Prop({ type: Types.ObjectId, required: true })
    targetId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    reporter: Types.ObjectId;

    @Prop({ required: true, trim: true, maxlength: 500 })
    reason: string;

    @Prop({ enum: ['pending', 'reviewed', 'rejected', 'action_taken'], default: 'pending', index: true })
    status: ReportStatus;

    @Prop({ type: String, maxlength: 500 })
    adminNote?: string;
}

export const ReportSchema = SchemaFactory.createForClass(Report);

ReportSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
ReportSchema.index({ status: 1, createdAt: -1 });
