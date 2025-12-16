export interface HostawayReviewCategory {
  category: string;
  rating: number;
}

export interface HostawayReview {
  id: number;
  listingName: string;
  guestName: string;
  rating: number;
  publicReview: string;
  channel: string;
  type: string;
  submittedAt: string;
  reviewCategory?: HostawayReviewCategory[];
}
