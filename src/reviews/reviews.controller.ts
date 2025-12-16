import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { GetReviewsFilterDto } from './dto/get-reviews-filter.dto';
import { UpdateVisibilityDto } from './dto/update-visibility.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('sync')
  sync() {
    return this.reviewsService.syncReviews();
  }

  @Get()
  findAll(@Query() filterDto: GetReviewsFilterDto) {
    return this.reviewsService.findAll(filterDto);
  }

  @Patch(':id/visibility')
  updateVisibility(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVisibilityDto: UpdateVisibilityDto,
  ) {
    return this.reviewsService.updateVisibility(
      id,
      updateVisibilityDto.isVisible,
    );
  }
}
