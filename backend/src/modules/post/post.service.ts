import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';

@Injectable()
export class PostService {
  constructor(@InjectModel(Post.name) private readonly postModel: Model<PostDocument>) { }

  async create(createPostDto: CreatePostDto) {
    const created = new this.postModel(createPostDto as any);
    return created.save();
  }

  findAll() {
    return this.postModel.find().lean();
  }

  findOne(id: string) {
    return this.postModel.findById(id).lean();
  }

  update(id: string, updatePostDto: UpdatePostDto) {
    return this.postModel.findByIdAndUpdate(id, updatePostDto, { new: true }).lean();
  }

  remove(id: string) {
    return this.postModel.findByIdAndDelete(id).lean();
  }
}
