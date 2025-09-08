import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { EventsGateway } from '../events/events.gateway';
import { InjectModel as Inject } from '@nestjs/mongoose';
import { Post, PostDocument } from '../post/schemas/post.schema';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(Comment.name) private readonly commentModel: Model<CommentDocument>,
    private readonly events: EventsGateway,
    @Inject(Post.name) private readonly postModel: Model<PostDocument>,
  ) { }

  async create(createCommentDto: CreateCommentDto & { author: string; post: string }) {
    // Validate referenced post exists
    const exists = await this.postModel.exists({ _id: createCommentDto.post });
    if (!exists) throw new BadRequestException('Bài viết không tồn tại');
    const created = await this.commentModel.create(createCommentDto);
    const populated = await this.commentModel
      .findById(created._id)
      .populate('author', 'email username')
      .lean();
    // Emit to post room
    if (populated?.post) this.events.emitToPost(populated.post.toString(), 'comment.created', populated);
    return populated;
  }

  async findAll(post?: string, page = 1, limit = 10, sort: string | any = '-createdAt') {
    const filter = post ? { post } : {};
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.commentModel
        .find(filter)
        .sort(sort as any)
        .skip(skip)
        .limit(limit)
        .populate('author', 'email username')
        .lean(),
      this.commentModel.countDocuments(filter),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  findOne(id: string) {
    return this.commentModel.findById(id).populate('author', 'email username').lean();
  }

  async update(id: string, updateCommentDto: UpdateCommentDto, userId?: string, isAdmin?: boolean) {
    const doc = await this.commentModel.findById(id);
    if (!doc) throw new NotFoundException('Không tìm thấy bình luận');
    const owner = doc.author?.toString();
    if (!isAdmin && owner && owner !== userId) throw new ForbiddenException('Bạn không phải là chủ sở hữu');
    Object.assign(doc, updateCommentDto);
    await doc.save();
    const json = doc.toJSON();
    if (doc.post) this.events.emitToPost(doc.post.toString(), 'comment.updated', json);
    return json;
  }

  async remove(id: string, userId?: string, isAdmin?: boolean) {
    const doc = await this.commentModel.findById(id);
    if (!doc) throw new NotFoundException('Không tìm thấy bình luận');
    const owner = doc.author?.toString();
    if (!isAdmin && owner && owner !== userId) throw new ForbiddenException('Bạn không phải là chủ sở hữu');
    const postId = doc.post?.toString();
    await doc.deleteOne();
    if (postId) this.events.emitToPost(postId, 'comment.deleted', { id });
    return { deleted: true };
  }
}
