import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Report, ReportDocument } from './schemas/report.schema';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { NotificationEmitterService } from '../../common/notification-emitter.service';

@Injectable()
export class ReportService {
    constructor(
        @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
        private readonly notifier: NotificationEmitterService,
    ) { }

    async create(dto: CreateReportDto, reporterId: string) {
        const report = await this.reportModel.create({ ...dto, reporter: reporterId });
        // Notify admins (global) and maybe later filter by role
        await this.notifier.success('report_created', 'Báo cáo mới được gửi', { reportId: report._id, targetType: dto.targetType });
        return report;
    }

    async findAll(status?: string, page = 1, limit = 20) {
        const query: any = {};
        if (status) query.status = status;
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            this.reportModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            this.reportModel.countDocuments(query),
        ]);
        return { items, total, page, pages: Math.ceil(total / limit) };
    }

    async updateStatus(id: string, dto: UpdateReportStatusDto, adminUserId: string) {
        const report = await this.reportModel.findById(id);
        if (!report) throw new NotFoundException('Report không tồn tại');
        report.status = dto.status;
        if (dto.adminNote) report.adminNote = dto.adminNote;
        await report.save();

        // Notify reporter about update
        await this.notifier.success(
            'report_status_changed',
            'Trạng thái báo cáo được cập nhật',
            { reportId: report._id, status: report.status },
            report.reporter.toString(),
        );

        return report.toObject();
    }
}
