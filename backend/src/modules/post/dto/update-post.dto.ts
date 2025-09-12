import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from './create-post.dto';

// Inherits optional tags from CreatePostDto
export class UpdatePostDto extends PartialType(CreatePostDto) { }
