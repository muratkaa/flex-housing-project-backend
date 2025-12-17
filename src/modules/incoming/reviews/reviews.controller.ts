import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { GetReviewsFilterDto } from './dto/get-reviews-filter.dto';
import { UpdateVisibilityDto } from './dto/update-visibility.dto';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  //for developing purposes, ive build this for sync mock data json with db
  @Get('sync')
  async syncReviews() {
    return this.reviewsService.syncReviews();
  }

  //calls for hostaway api service
  @Get('hostaway')
  getHostawayReviews() {
    return this.reviewsService.getAndNormalizeHostawayReviews();
  }

  //gets data from db
  @Get()
  findAll(@Query() filterDto: GetReviewsFilterDto) {
    return this.reviewsService.findAll(filterDto);
  }

  //update reviews visibility
  @Patch(':id/visibility')
  updateVisibility(
    @Param('id') id: number,
    @Body() updateVisibilityDto: UpdateVisibilityDto,
  ) {
    return this.reviewsService.updateVisibility(
      id,
      updateVisibilityDto.isVisible,
    );
  }
}
