import { IsEnum, IsMongoId, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateReportDto {
    @IsEnum(['post', 'comment', 'user'])
    targetType: 'post' | 'comment' | 'user';

    @IsMongoId()
    targetId: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    reason: string;
}
