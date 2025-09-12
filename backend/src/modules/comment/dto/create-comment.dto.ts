import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCommentDto {
    @IsString()
    @IsNotEmpty()
    content: string;

    // post id to attach this comment to
    @IsString()
    @IsNotEmpty()
    post: string;

    @IsOptional()
    @IsString()
    parentComment?: string;
}
