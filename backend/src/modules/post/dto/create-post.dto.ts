import { IsArray, IsOptional, IsString, MinLength, ArrayMaxSize, ArrayUnique } from 'class-validator';

export class CreatePostDto {
    @IsString()
    @MinLength(3)
    title: string;

    @IsString()
    content: string;

    @IsOptional()
    @IsString()
    author?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsArray()
    @ArrayMaxSize(10)
    @ArrayUnique()
    @IsString({ each: true })
    tags?: string[];
}
