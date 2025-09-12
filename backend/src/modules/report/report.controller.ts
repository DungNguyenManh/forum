import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ReportService } from './report.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reports')
export class ReportController {
    constructor(private readonly reportService: ReportService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() dto: CreateReportDto, @Req() req: any) {
        return this.reportService.create(dto, req.user.userId);
    }

    // Admin listing - for now simple role check via req.user.role
    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Req() req: any, @Query('status') status?: string, @Query('page') page = '1', @Query('limit') limit = '20') {
        if (req.user.role !== 'admin') {
            throw new Error('Chỉ admin mới xem danh sách báo cáo');
        }
        return this.reportService.findAll(status, Number(page), Number(limit));
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/status')
    updateStatus(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateReportStatusDto) {
        if (req.user.role !== 'admin') {
            throw new Error('Chỉ admin mới cập nhật báo cáo');
        }
        return this.reportService.updateStatus(id, dto, req.user.userId);
    }
}
