import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Prisma } from '@prisma/client';
import { HostawayReview } from '../../external/hostaway/interfaces/hostaway-review.interface';
import { GetReviewsFilterDto } from './dto/get-reviews-filter.dto';
import { HostawayService } from 'src/modules/external/hostaway/hostaway.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    private prisma: PrismaService,
    private hostawayService: HostawayService,
  ) {}

  //this function is for my developing purposes, to sync db with mock data json
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
            status: review.status,
            date: new Date(review.submittedAt),
          },
          create: {
            hostawayId: review.id,
            listingName: review.listingName,
            guestName: review.guestName,
            rating: review.rating,
            content: review.publicReview,
            channel: review.channel ?? 'default_channel',
            type: review.type,
            status: review.status,
            date: new Date(review.submittedAt),
            categories: categories as unknown as Prisma.InputJsonValue,
            isVisible: false,
          },
        });
        count++;
      }

      this.logger.log(`${count} reviews synced successfully from Mock File.`);
      return { status: 'success', message: `${count} reviews synced.` };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Sync failed: ${errorMessage}`);
      throw error;
    }
  }

  //fetches reviews from hostaway api service
  async getAndNormalizeHostawayReviews() {
    // fetch data
    const rawReviews = await this.fetchRawReviews();

    // normalize data
    const normalizedReviews = rawReviews.map((review) =>
      this.mapToDomainModel(review),
    );

    return {
      count: normalizedReviews.length,
      data: normalizedReviews,
    };
  }

  //get reviews from db
  async findAll(filterDto: GetReviewsFilterDto) {
    const { listingName, minRating, channel, sortBy, sortOrder, isVisible } =
      filterDto;

    const where: Prisma.ReviewWhereInput = {
      ...(listingName && {
        listingName: { contains: listingName, mode: 'insensitive' },
      }),
      ...(minRating && { rating: { gte: minRating } }),
      ...(channel && { channel: { equals: channel, mode: 'insensitive' } }),
      ...(isVisible !== undefined && { isVisible }),
    };

    const orderBy: Prisma.ReviewOrderByWithRelationInput = sortBy
      ? { [sortBy]: sortOrder ?? 'desc' }
      : { date: 'desc' };

    return this.prisma.review.findMany({
      where,
      orderBy,
    });
  }

  // for manager dashboard , update visibility
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

  private async fetchRawReviews(): Promise<HostawayReview[]> {
    try {
      this.logger.log('Fetching reviews from Hostaway API...');

      // external hostaway service api call
      const apiData = await this.hostawayService.getReviews();

      // API worked but returned empty because it is sandboxed
      if (!apiData || apiData.length === 0) {
        this.logger.warn(
          'Hostaway API returned empty list. Switching to Mock Data.',
        );
        return this.getMockData();
      }

      return apiData;
    } catch (error) {
      this.logger.error(
        `Hostaway API failed (${error instanceof Error ? error.message : error}). Switching to Mock Data.`,
      );
      return this.getMockData();
    }
  }

  private getMockData(): HostawayReview[] {
    try {
      //read file
      const filePath = path.join(process.cwd(), 'mock-reviews.json');
      const fileData = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileData) as HostawayReview[];

      // Log the source is mocked
      const taggedData = data as HostawayReview[] & { _source: string };
      taggedData._source = 'mock_file';
      return taggedData;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(
        `Failed to load Mock Data file! Detail: ${errorMessage}`,
      );

      return [];
    }
  }

  private mapToDomainModel(review: HostawayReview) {
    return {
      id: review.id,
      type: review.type,
      status: review.status,
      rating: Number(review.rating) || 0,
      publicReview: review.publicReview,
      reviewCategory: review.reviewCategory || [],
      submittedAt: review.submittedAt,
      guestName: review.guestName,
      listingName: review.listingName,
      channel: review.channel,
    };
  }
}
