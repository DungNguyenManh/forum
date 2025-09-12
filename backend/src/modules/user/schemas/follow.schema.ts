import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.schema';

export type FollowDocument = HydratedDocument<Follow>;

@Schema({ timestamps: true })
export class Follow {
    @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
    follower: Types.ObjectId; // the user who follows

    @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
    following: Types.ObjectId; // the user being followed
}

export const FollowSchema = SchemaFactory.createForClass(Follow);

// A user can only follow another user once
FollowSchema.index({ follower: 1, following: 1 }, { unique: true });
// Helpful for listing follower/following quickly
FollowSchema.index({ following: 1, createdAt: -1 });
FollowSchema.index({ follower: 1, createdAt: -1 });
