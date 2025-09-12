import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { QueryPostDto } from './dto/query-post.dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventsGateway } from '../events/events.gateway';
import { NotificationEmitterService } from '../../common/notification-emitter.service';

@Injectable()
export class PostService {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
    private readonly events: EventsGateway,
    private readonly notifier: NotificationEmitterService,
  ) { }

  async create(createPostDto: CreatePostDto) {
    // Normalize tags: lowercase + trim + remove empties + unique
    if (createPostDto.tags) {
      createPostDto.tags = Array.from(new Set(
        createPostDto.tags
          .map(t => t.trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 10)
      ));
    }
    const created = new this.postModel(createPostDto as any);
    const saved = await created.save();
    // Emit realtime event
    this.events.emitToPost(saved._id.toString(), 'post.created', saved.toJSON());
    this.notifier.success('post_create', 'Tạo bài viết thành công', { postId: saved._id });
    return saved;
  }

  async findAll(q: QueryPostDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 10;
    const skip = (page - 1) * limit;
    const and: any[] = [{ $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }] }];
    if (q.author) and.push({ author: q.author });
    if (q.category) and.push({ category: q.category });
    if (q.tag) and.push({ tags: q.tag.toLowerCase() });
    if (q.q) {
      const regex = new RegExp(q.q.trim().replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'), 'i');
      and.push({ $or: [{ title: regex }, { content: regex }] });
    }
    const filter = and.length > 1 ? { $and: and } : and[0];
    const sort = q.sort || '-createdAt';
    const [items, total] = await Promise.all([
      this.postModel
        .find(filter)
        .sort(sort as any)
        .skip(skip)
        .limit(limit)
        .populate('author', 'email username')
        .populate('category', 'name slug')
        .lean(),
      this.postModel.countDocuments(filter),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const doc = await this.postModel.findOneAndUpdate(
      { _id: id, $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }] },
      { $inc: { viewCount: 1 } },
      { new: true }
    )
      .populate('author', 'email username')
      .populate('category', 'name slug')
      .lean();
    return doc;
  }

  async findRelated(id: string, limit = 5) {
    const base = await this.postModel.findById(id).lean();
    if (!base) return [];
    const tagFilter = (base.tags && base.tags.length) ? { tags: { $in: base.tags } } : null;
    const catFilter = base.category ? { category: base.category } : null;
    const criteria: any = { _id: { $ne: base._id } };
    if (tagFilter) {
      Object.assign(criteria, tagFilter);
    } else if (catFilter) {
      Object.assign(criteria, catFilter);
    } else {
      // No tags or category -> return newest others
    }
    const related = await this.postModel.find(criteria)
      .sort('-createdAt')
      .limit(limit)
      .populate('author', 'email username')
      .populate('category', 'name slug')
      .lean();
    return related;
  }

  async update(id: string, updatePostDto: UpdatePostDto, userId?: string, isAdmin?: boolean) {
    const doc = await this.postModel.findById(id);
    if (!doc) throw new NotFoundException('Không tìm thấy bài viết');
    const owner = doc.author?.toString();
    if (!isAdmin && owner && owner !== userId) throw new ForbiddenException('Bạn không phải là chủ sở hữu');
    if (updatePostDto.tags) {
      updatePostDto.tags = Array.from(new Set(
        updatePostDto.tags
          .map(t => t.trim().toLowerCase())
          .filter(Boolean)
          .slice(0, 10)
      ));
    }
    Object.assign(doc, updatePostDto);
    await doc.save();
    const json = doc.toJSON();
    this.events.emitToPost(doc._id.toString(), 'post.updated', json);
    this.notifier.success('post_update', 'Cập nhật bài viết thành công', { postId: doc._id });
    return json;
  }

  async softDelete(id: string, userId?: string, isAdmin?: boolean) {
    const doc = await this.postModel.findById(id);
    if (!doc) throw new NotFoundException('Không tìm thấy bài viết');
    const owner = doc.author?.toString();
    if (!isAdmin && owner && owner !== userId) throw new ForbiddenException('Bạn không phải là chủ sở hữu');
    if (doc.deletedAt) return { message: 'Bài viết đã bị xóa mềm' };
    doc.deletedAt = new Date();
    await doc.save();
    this.events.emitToPost(doc._id.toString(), 'post.soft_deleted', { id: doc._id });
    this.notifier.success('post_soft_deleted', 'Đã xóa (soft) bài viết', { postId: doc._id });
    return { message: 'Xóa mềm thành công' };
  }

  async restore(id: string, isAdmin?: boolean) {
    if (!isAdmin) throw new ForbiddenException('Chỉ admin mới khôi phục');
    const doc = await this.postModel.findById(id);
    if (!doc) throw new NotFoundException('Không tìm thấy bài viết');
    if (!doc.deletedAt) return { message: 'Bài viết chưa bị xóa' };
    doc.deletedAt = null;
    await doc.save();
    this.events.emitToPost(doc._id.toString(), 'post.restored', { id: doc._id });
    this.notifier.success('post_restored', 'Khôi phục bài viết thành công', { postId: doc._id });
    return { message: 'Khôi phục thành công' };
  }

  async like(postId: string, userId: string) {
    const updated = await this.postModel.findOneAndUpdate(
      { _id: postId, likedBy: { $ne: userId } },
      { $addToSet: { likedBy: userId }, $inc: { likeCount: 1 } },
      { new: true }
    )
      .populate('author', 'email username')
      .populate('category', 'name slug');
    if (!updated) {
      // Already liked or post not found -> fetch current state
      const existing = await this.postModel.findById(postId)
        .populate('author', 'email username')
        .populate('category', 'name slug');
      if (!existing) throw new NotFoundException('Không tìm thấy bài viết');
      return existing.toJSON();
    }
    const json = updated.toJSON();
    this.events.emitToPost(postId, 'post.liked', { postId, likeCount: json.likeCount });
    this.events.server.emit('post.metrics', { postId, commentCount: json.commentCount, viewCount: json.viewCount, likeCount: json.likeCount });
    // Award point to author when receiving a like (if not self-like)
    return json;
  }

  async unlike(postId: string, userId: string) {
    const updated = await this.postModel.findOneAndUpdate(
      { _id: postId, likedBy: userId },
      { $pull: { likedBy: userId }, $inc: { likeCount: -1 } },
      { new: true }
    )
      .populate('author', 'email username')
      .populate('category', 'name slug');
    if (!updated) {
      const existing = await this.postModel.findById(postId)
        .populate('author', 'email username')
        .populate('category', 'name slug');
      if (!existing) throw new NotFoundException('Không tìm thấy bài viết');
      return existing.toJSON();
    }
    const json = updated.toJSON();
    this.events.emitToPost(postId, 'post.unliked', { postId, likeCount: json.likeCount });
    this.events.server.emit('post.metrics', { postId, commentCount: json.commentCount, viewCount: json.viewCount, likeCount: json.likeCount });
    return json;
  }
}
