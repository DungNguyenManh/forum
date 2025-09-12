import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ForbiddenException, Query } from '@nestjs/common';
import { UsersService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Req() req: any) {
    const user = req.user;
    if (user.role !== 'admin') {
      throw new ForbiddenException('Quyền truy cập bị từ chối. Cần có vai trò quản trị viên để xem tất cả người dùng.');
    }
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Req() req: any) {
    return this.usersService.findOne(req.user.userId);
  }


  // Public profile endpoint (no password included)
  @Get(':id')
  async publicProfile(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = req.user;
    if (user.role === 'admin' || user.userId === id) {
      return this.usersService.update(id, updateUserDto);
    }
    throw new ForbiddenException('Quyền truy cập bị từ chối. Bạn chỉ có thể cập nhật thông tin của chính mình.');
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const user = req.user;
    if (user.role === 'admin' || user.userId === id) {
      return this.usersService.remove(id);
    }
    throw new ForbiddenException('Quyền truy cập bị từ chối. Bạn chỉ có thể xóa tài khoản của chính mình.');
  }

  // FOLLOW FEATURE
  @UseGuards(JwtAuthGuard)
  @Post(':id/follow')
  async follow(@Req() req: any, @Param('id') id: string) {
    return this.usersService.follow(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/follow')
  async unfollow(@Req() req: any, @Param('id') id: string) {
    return this.usersService.unfollow(req.user.userId, id);
  }

  @Get(':id/followers')
  async followers(@Param('id') id: string, @Query('page') page = '1', @Query('limit') limit = '20') {
    return this.usersService.listFollowers(id, Number(page), Number(limit));
  }

  @Get(':id/following')
  async following(@Param('id') id: string, @Query('page') page = '1', @Query('limit') limit = '20') {
    return this.usersService.listFollowing(id, Number(page), Number(limit));
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/is-following')
  async isFollowing(@Req() req: any, @Param('id') id: string) {
    return this.usersService.isFollowing(req.user.userId, id);
  }
}
