/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Prisma } from '@prisma/client';
import { HostawayReview } from '../../external/hostaway/interfaces/hostaway-review.interface';
import { GetReviewsFilterDto } from './dto/get-reviews-filter.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { HostawayService } from '../../../modules/external/hostaway/hostaway.service';

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
      await this.prisma.review.deleteMany({});
      this.logger.log('All existing reviews deleted from DB.');

      const filePath = path.join(process.cwd(), 'mock-reviews.json');
      const fileData = fs.readFileSync(filePath, 'utf-8');
      const reviews = JSON.parse(fileData) as HostawayReview[];

      let count = 0;

      for (const review of reviews) {
        const submittedDate = new Date(review.submittedAt);
        const isValidDate = !isNaN(submittedDate.getTime());

        await this.prisma.review.create({
          data: {
            hostawayId: review.id,
            listingName: review.listingName || 'Unknown Listing',
            guestName: review.guestName || 'Anonymous',
            rating: Number(review.rating) || 0,
            content: review.publicReview || '',
            channel: review.channel || 'direct',
            type: review.type || 'guest-to-host',
            status: review.status || 'published',
            date: isValidDate ? submittedDate : new Date(),
            categories: (review.reviewCategory as any) || [],
            isVisible: true,
          },
        });
        count++;
      }

      this.logger.log(`${count} reviews synced successfully.`);
      return { status: 'success', message: `${count} reviews synced.` };
    } catch (error) {
      console.error(error);
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
    const { sortBy, sortOrder } = filterDto;
    const where = this.buildWhereClause(filterDto);

    // Sıralama mantığı
    let orderBy: Prisma.ReviewOrderByWithRelationInput;
    switch (sortBy) {
      case 'rating':
        orderBy = { rating: sortOrder ?? 'desc' };
        break;

      default:
        orderBy = { date: sortOrder ?? 'desc' };
        break;
    }

    return this.prisma.review.findMany({
      where,
      orderBy,
    });
  }

  //gets reviews with pagination
  async findAllPaginated(filterDto: GetReviewsFilterDto) {
    const { sortBy, sortOrder, page, limit } = filterDto;
    const where = this.buildWhereClause(filterDto);

    let orderBy: Prisma.ReviewOrderByWithRelationInput;
    switch (sortBy) {
      case 'rating':
        orderBy = { rating: sortOrder ?? 'desc' };
        break;

      default:
        orderBy = { date: sortOrder ?? 'desc' };
        break;
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const total = await this.prisma.review.count({ where });

    const data = await this.prisma.review.findMany({
      where,
      orderBy,
      take: limitNum,
      skip: skip,
    });

    return {
      data,
      meta: {
        total,
        page: pageNum,
        lastPage: Math.ceil(total / limitNum),
        limit: limitNum,
      },
    };
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

  //calculate rating with visible ratings
  async getListingRating(listingName: string) {
    const result = await this.prisma.review.aggregate({
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
      where: {
        listingName: listingName,
        isVisible: true,
      },
    });

    const average = result._avg.rating || 0;
    const count = result._count.id || 0;

    return {
      rating: Number(average.toFixed(2)),
      count: count,
    };
  }

  private buildWhereClause(
    filterDto: GetReviewsFilterDto,
  ): Prisma.ReviewWhereInput {
    const { listingName, minRating, channel, isVisible } = filterDto;

    return {
      ...(listingName && {
        listingName: { contains: listingName, mode: 'insensitive' },
      }),
      ...(minRating && { rating: { gte: Number(minRating) } }),
      ...(channel && { channel: { equals: channel, mode: 'insensitive' } }),
      ...(isVisible !== undefined && {
        isVisible: String(isVisible) === 'true',
      }),
    };
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
