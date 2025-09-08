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
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
