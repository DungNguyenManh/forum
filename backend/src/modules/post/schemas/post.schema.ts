import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PostDocument = HydratedDocument<Post>;

@Schema({ timestamps: true })
export class Post {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  author?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category' })
  category?: Types.ObjectId;

  @Prop({ type: Number, default: 0 })
  commentCount?: number;

  @Prop({ type: Number, default: 0 })
  viewCount?: number;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  likedBy?: Types.ObjectId[];

  @Prop({ type: Number, default: 0 })
  likeCount?: number;
}

export const PostSchema = SchemaFactory.createForClass(Post);
// Text index for search
PostSchema.index({ title: 'text', content: 'text' });
