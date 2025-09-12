import { Body, Controller, Delete, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { UsersService } from '../user/user.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CategoryService } from '../category/category.service';
import { PostService } from '../post/post.service';
import { CommentService } from '../comment/comment.service';
import { NotificationEmitterService } from '../../common/notification-emitter.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly categories: CategoryService,
    private readonly posts: PostService,
    private readonly comments: CommentService,
    private readonly notifier: NotificationEmitterService,
  ) { }

  // Kiểm tra quyền truy cập admin
  @Get('health')
  health() {
    return { ok: true, time: new Date().toISOString() };
  }

  // Quản lý users
  @Get('users')
  getAllUsers() {
    return this.usersService.findAll();
  }

  @Patch('users/:id/role')
  async updateRole(@Param('id') id: string, @Body() body: { role: 'user' | 'admin' }) {
    const updated = await this.usersService.setRole(id, body.role);
    if (updated) this.notifier.success('admin_user_role', 'Cập nhật quyền người dùng thành công', { userId: updated.id, role: updated.role });
    return updated;
  }

  // Quản lý categories (chỉ đọc ở admin, tạo/sửa/xóa đã có trong CategoryController và bảo vệ bằng admin)
  @Get('categories')
  getAllCategories() {
    return this.categories.findAll();
  }

  // Quản lý posts: liệt kê, xóa, cập nhật trạng thái (tùy yêu cầu, ở đây cho phép xóa)
  @Get('posts')
  getAllPosts(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.posts.findAll({ page: page ? Number(page) : 1, limit: limit ? Number(limit) : 20 } as any);
  }

  @Delete('posts/:id')
  removePost(@Param('id') id: string) {
    return this.posts.remove(id).then(res => { if (res) this.notifier.success('admin_post_delete', 'Xóa bài viết (admin) thành công', { postId: id }); return res; });
  }

  // Quản lý comments: liệt kê theo post hoặc toàn bộ, xóa
  @Get('comments')
  getAllComments(@Query('post') post?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.comments.findAll(post, page ? Number(page) : 1, limit ? Number(limit) : 20);
  }

  @Delete('comments/:id')
  removeComment(@Param('id') id: string) {
    return this.comments.remove(id, undefined, true).then(res => { if (res) this.notifier.success('admin_comment_delete', 'Xóa bình luận (admin) thành công', { commentId: id }); return res; });
  }
}
