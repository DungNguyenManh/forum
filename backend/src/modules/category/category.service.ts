import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

function toSlug(name: string): string {
    return name
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

@Injectable()
export class CategoryService {
    constructor(@InjectModel(Category.name) private readonly catModel: Model<CategoryDocument>) { }

    async create(dto: CreateCategoryDto) {
        const slug = toSlug(dto.name);
        const exists = await this.catModel.exists({ $or: [{ name: dto.name }, { slug }] });
        if (exists) throw new BadRequestException('Danh mục đã tồn tại');
        return this.catModel.create({ name: dto.name, slug });
    }

    findAll() {
        return this.catModel.find().sort('name').lean();
    }

    async update(id: string, dto: UpdateCategoryDto) {
        const cat = await this.catModel.findById(id);
        if (!cat) throw new NotFoundException('Không tìm thấy danh mục');
        if (dto.name && dto.name !== cat.name) {
            const slug = toSlug(dto.name);
            const dup = await this.catModel.exists({ $or: [{ name: dto.name }, { slug }], _id: { $ne: id } });
            if (dup) throw new BadRequestException('Danh mục đã tồn tại');
            cat.name = dto.name;
            cat.slug = slug;
        }
        await cat.save();
        return cat.toJSON();
    }

    async remove(id: string) {
        const cat = await this.catModel.findByIdAndDelete(id);
        if (!cat) throw new NotFoundException('Không tìm thấy danh mục');
        return { deleted: true };
    }
}
