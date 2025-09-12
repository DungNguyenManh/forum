import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryPostDto {
    @IsOptional()
    @IsString()
    author?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;

    @IsOptional()
    @IsString()
    sort?: string; // e.g. '-createdAt' or 'title'

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsString()
    q?: string; // full-text search (title/content)

    @IsOptional()
    @IsString()
    tag?: string; // filter by a single tag
}
