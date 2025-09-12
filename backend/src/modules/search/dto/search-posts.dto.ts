import { IsInt, IsOptional, IsPositive, IsString, Min, MaxLength, IsMongoId } from 'class-validator';

export class SearchPostsDto {
    @IsString()
    @MaxLength(200)
    q: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @IsInt()
    @Min(1)
    @IsPositive()
    limit?: number = 10;

    // Filter by author (user) id
    @IsOptional()
    @IsMongoId()
    authorId?: string;

    // Filter by a single tag (exact match after normalization)
    @IsOptional()
    @IsString()
    @MaxLength(40)
    tag?: string;

    // Filter by category id (assuming category reference exists in Post schema)
    @IsOptional()
    @IsMongoId()
    categoryId?: string;
}
