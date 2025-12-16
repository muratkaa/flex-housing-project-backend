import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { Prisma } from '@prisma/client';
import { HostawayReview } from './interfaces/hostaway-review.interface';
import { GetReviewsFilterDto } from './dto/get-reviews-filter.dto';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(private prisma: PrismaService) {}

  async syncReviews() {
    try {
      const filePath = path.join(process.cwd(), 'mock-reviews.json');
      const fileData = fs.readFileSync(filePath, 'utf-8');

      const reviews = JSON.parse(fileData) as HostawayReview[];

      let count = 0;

      for (const review of reviews) {
        const categories = review.reviewCategory ?? [];

        await this.prisma.review.upsert({
          where: { hostawayId: review.id },
          update: {
            rating: review.rating,
            content: review.publicReview,
          },
          create: {
            hostawayId: review.id,
            listingName: review.listingName,
            guestName: review.guestName,
            rating: review.rating,
            content: review.publicReview,
            channel: review.channel,
            type: review.type,
            date: new Date(review.submittedAt),
            categories: categories as unknown as Prisma.InputJsonValue,
            isVisible: false,
          },
        });
        count++;
      }

      this.logger.log(`${count} reviews synced successfully.`);
      return { status: 'success', message: `${count} reviews synced.` };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Sync failed: ${errorMessage}`);
      throw error;
    }
  }

  async findAll(filterDto: GetReviewsFilterDto) {
    const { listingName, minRating, channel, sortBy, sortOrder, isVisible } =
      filterDto;

    const where: Prisma.ReviewWhereInput = {};

    if (listingName) {
      where.listingName = { contains: listingName, mode: 'insensitive' };
    }

    if (minRating) {
      where.rating = { gte: minRating };
    }

    if (channel) {
      where.channel = { equals: channel, mode: 'insensitive' };
    }

    if (isVisible !== undefined) {
      where.isVisible = isVisible;
    }

    const orderBy: Prisma.ReviewOrderByWithRelationInput = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder || 'desc';
    } else {
      orderBy.date = 'desc';
    }

    return this.prisma.review.findMany({
      where,
      orderBy,
    });
  }

  async updateVisibility(id: number, isVisible: boolean) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return this.prisma.review.update({
      where: { id },
      data: { isVisible },
    });
  }
}
