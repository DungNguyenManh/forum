import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CommentDocument = HydratedDocument<Comment>;

@Schema({ timestamps: true })
export class Comment {
    @Prop({ required: true, trim: true })
    content: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    author: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
    post: Types.ObjectId;

    // Optional parent comment for 1-level threading
    @Prop({ type: Types.ObjectId, ref: 'Comment', required: false })
    parentComment?: Types.ObjectId;

    // Soft delete timestamp
    @Prop({ type: Date, required: false })
    deletedAt?: Date | null;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
// Efficient retrieval of comments of a post in chronological / reverse order
CommentSchema.index({ post: 1, createdAt: -1 });
// For fetching replies of a comment quickly
CommentSchema.index({ post: 1, parentComment: 1, createdAt: 1 });
// Soft delete index
CommentSchema.index({ post: 1, deletedAt: 1, createdAt: -1 });
