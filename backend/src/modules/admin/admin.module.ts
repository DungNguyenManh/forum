import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { UserModule } from '../user/user.module';
import { CategoryModule } from '../category/category.module';
import { PostModule } from '../post/post.module';
import { CommentModule } from '../comment/comment.module';

@Module({
  imports: [UserModule, CategoryModule, PostModule, CommentModule],
  controllers: [AdminController],
})
export class AdminModule { }
