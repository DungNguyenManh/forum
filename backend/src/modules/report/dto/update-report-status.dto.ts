import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateReportStatusDto {
    @IsEnum(['pending', 'reviewed', 'rejected', 'action_taken'])
    status: 'pending' | 'reviewed' | 'rejected' | 'action_taken';

    @IsOptional()
    @IsString()
    @MaxLength(500)
    adminNote?: string;
}
