import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { QueryPostDto } from './dto/query-post.dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class PostService {
  constructor(
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
    private readonly events: EventsGateway,
  ) { }

  async create(createPostDto: CreatePostDto) {
    const created = new this.postModel(createPostDto as any);
    const saved = await created.save();
    // Emit realtime event
    this.events.emitToPost(saved._id.toString(), 'post.created', saved.toJSON());
    return saved;
  }

  async findAll(q: QueryPostDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 10;
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (q.author) filter.author = q.author;
    const sort = q.sort || '-createdAt';
    const [items, total] = await Promise.all([
      this.postModel
        .find(filter)
        .sort(sort as any)
        .skip(skip)
        .limit(limit)
        .populate('author', 'email name')
        .lean(),
      this.postModel.countDocuments(filter),
    ]);
    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  findOne(id: string) {
    return this.postModel.findById(id).populate('author', 'email name').lean();
  }

  async update(id: string, updatePostDto: UpdatePostDto, userId?: string, isAdmin?: boolean) {
    const doc = await this.postModel.findById(id);
    if (!doc) throw new NotFoundException('Post not found');
    const owner = doc.author?.toString();
    if (!isAdmin && owner && owner !== userId) throw new ForbiddenException('Not owner');
    Object.assign(doc, updatePostDto);
    await doc.save();
    const json = doc.toJSON();
    this.events.emitToPost(doc._id.toString(), 'post.updated', json);
    return json;
  }

  remove(id: string) {
    return this.postModel.findByIdAndDelete(id).lean().then((res) => {
      if (res?._id) this.events.emitToPost(res._id.toString(), 'post.deleted', { id: res._id });
      return res;
    });
  }
}
