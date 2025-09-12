import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from '../post/schemas/post.schema';
import { SearchPostsDto } from './dto/search-posts.dto';

@Injectable()
export class SearchService {
    constructor(
        @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
    ) { }

    async searchPosts(dto: SearchPostsDto) {
        const q = (dto.q || '').trim();
        if (!q) throw new BadRequestException('Query q is required');

        const page = dto.page || 1;
        const limit = Math.min(dto.limit || 10, 50);
        const skip = (page - 1) * limit;

        // Base filter (exclude soft-deleted)
        const baseFilter: any = { $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }] };
        if (dto.authorId) baseFilter.author = dto.authorId;
        if (dto.categoryId) baseFilter.category = dto.categoryId;
        if (dto.tag) baseFilter.tags = dto.tag.toLowerCase();

        // Text search primary path
        const textQuery: any = { $text: { $search: q }, $and: [baseFilter] };

        let usedFallback = false;
        let items = await this.postModel
            .find(textQuery, { score: { $meta: 'textScore' } })
            .sort({ score: { $meta: 'textScore' } })
            .skip(skip)
            .limit(limit)
            .lean();

        // Fallback regex if no text results (or if filters made text index not usable)
        if (!items.length) {
            usedFallback = true;
            const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(safe, 'i');
            const or: any[] = [{ title: regex }, { content: regex }];
            const fallbackQuery: any = { $and: [baseFilter, { $or: or }] };
            items = await this.postModel
                .find(fallbackQuery)
                .sort('-createdAt')
                .skip(skip)
                .limit(limit)
                .lean();
        }

        // Total count depends on path
        let total = 0;
        if (!usedFallback) {
            try {
                total = await this.postModel.countDocuments(textQuery);
            } catch { total = items.length; }
        } else {
            // Rough count for fallback (avoid large count regex cost if huge)
            total = skip + items.length + (items.length === limit ? limit : 0); // heuristic
        }

        // Highlighting & tag aggregation
        const tagsMap: Record<string, number> = {};
        const lowered = q.toLowerCase();
        const HIGHLIGHT_LIMIT = 160;
        const highlightTerms = Array.from(new Set(lowered.split(/\s+/).filter(Boolean))).sort((a, b) => b.length - a.length);
        const highlightRegex = new RegExp(`(${highlightTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');

        const decorated = items.map(p => {
            if (Array.isArray(p.tags)) for (const t of p.tags) if (t) tagsMap[t] = (tagsMap[t] || 0) + 1;
            const source = (p.content || '').toString();
            let firstIdx = -1;
            for (const term of highlightTerms) {
                const idx = source.toLowerCase().indexOf(term);
                if (idx !== -1 && (firstIdx === -1 || idx < firstIdx)) firstIdx = idx;
            }
            if (firstIdx === -1) firstIdx = 0;
            const start = Math.max(0, firstIdx - 40);
            const rawSlice = source.slice(start, start + HIGHLIGHT_LIMIT);
            const escaped = rawSlice.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const highlighted = escaped.replace(highlightRegex, '<mark>$1</mark>');
            return { ...p, snippet: highlighted + (source.length > start + HIGHLIGHT_LIMIT ? '…' : '') };
        });

        const tags = Object.entries(tagsMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([tag]) => tag);

        return { items: decorated, total, page, pages: Math.ceil(total / limit), tags };
    }
}
