import { HostawayReview } from './hostaway-review.interface';

export interface HostawayApiResponse {
  status: string;
  result: HostawayReview[];
  count?: number;
  offset?: any;
}
