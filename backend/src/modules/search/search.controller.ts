import { Controller, Get, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SearchService } from './search.service';
import { SearchPostsDto } from './dto/search-posts.dto';

@Controller('search')
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    // Limit search abuse: 30 requests per minute per IP (override global if higher)
    @Get('posts')
    @Throttle({ default: { limit: 30, ttl: 60 } })
    searchPosts(@Query() dto: SearchPostsDto) {
        return this.searchService.searchPosts(dto);
    }
}
