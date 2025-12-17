import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { HostawayConfig } from './hostaway.config';
import { lastValueFrom } from 'rxjs';
import { HostawayReview } from './interfaces/hostaway-review.interface';
import { HostawayApiResponse } from './interfaces/hostaway-api-response';

@Injectable()
export class HostawayService {
  private readonly logger = new Logger(HostawayService.name);

  constructor(
    private hostawayConfig: HostawayConfig,
    private httpService: HttpService,
  ) {}

  async getReviews(): Promise<HostawayReview[]> {
    const configData = this.hostawayConfig.getReviewsConfig();

    try {
      this.logger.log(`Fetching reviews from: ${configData.url}`);

      const response = await lastValueFrom(
        this.httpService.get<HostawayApiResponse>(configData.url),
      );

      const apiData = response.data;

      if (apiData && Array.isArray(apiData.result)) {
        return apiData.result;
      }

      this.logger.warn(
        'Hostaway API response valid but "result" array is missing or empty.',
      );
      return [];
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';

      this.logger.error(
        `Error fetching reviews from Hostaway: ${errorMessage}`,
      );
      throw error;
    }
  }
}
