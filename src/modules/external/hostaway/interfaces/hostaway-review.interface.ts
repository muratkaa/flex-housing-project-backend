export interface HostawayReviewCategory {
  category: string;
  rating: number;
}

export interface HostawayReview {
  id: number;
  type: string;
  status: string;
  rating: number;
  publicReview: string;
  reviewCategory?: HostawayReviewCategory[];
  submittedAt: string;
  guestName: string;
  listingName: string;
  channel?: string;
}
