import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { Post, PostSchema } from './schemas/post.schema';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]), EventsModule],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule { }
