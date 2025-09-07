import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePostDto {
    @IsString()
    @MinLength(3)
    title: string;

    @IsString()
    content: string;

    @IsOptional()
    @IsString()
    author?: string;
}
