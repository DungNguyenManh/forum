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

  // Array of tag slugs / keywords (lowercase, trimmed)
  @Prop({ type: [String], default: [] })
  tags?: string[];

  // Soft delete timestamp
  @Prop({ type: Date, required: false })
  deletedAt?: Date | null;
}

export const PostSchema = SchemaFactory.createForClass(Post);
// Weighted text index for search (title weighted higher than content)
PostSchema.index({ title: 'text', content: 'text' }, { weights: { title: 5, content: 1 }, name: 'PostTextIndex' });
// List posts by author newest first
PostSchema.index({ author: 1, createdAt: -1 });
// List posts by category newest first
PostSchema.index({ category: 1, createdAt: -1 });
// Popularity or leaderboard style queries (compound partial usage later)
PostSchema.index({ likeCount: -1, commentCount: -1 });
// Tag search (compound with createdAt for recency)
PostSchema.index({ tags: 1, createdAt: -1 });
// Soft delete filter index (allow queries to quickly skip deleted docs)
PostSchema.index({ deletedAt: 1, createdAt: -1 });
