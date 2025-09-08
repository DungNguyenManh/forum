import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { QueryCommentDto } from './dto/query-comment.dto';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createCommentDto: CreateCommentDto, @GetUser() user: any) {
    return this.commentService.create({ ...createCommentDto, author: user?.sub });
  }

  @Get()
  findAll(@Query() q: QueryCommentDto) {
    return this.commentService.findAll(q.post, q.page, q.limit, q.sort);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commentService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCommentDto: UpdateCommentDto, @GetUser() user: any) {
    const isAdmin = (user?.roles || []).includes('admin');
    return this.commentService.update(id, updateCommentDto, user?.sub, isAdmin);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: any) {
    const isAdmin = (user?.roles || []).includes('admin');
    return this.commentService.remove(id, user?.sub, isAdmin);
  }
}
