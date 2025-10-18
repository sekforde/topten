// Core data structures for the Top 10 app

export interface Criterion {
  id: string;
  name: string;
}

export interface Rating {
  userId: string;
  criterionId: string;
  value: number; // 1-5 stars, or -1 for "no experience"
}

export interface Item {
  id: string;
  name: string;
  addedBy: string;
  addedAt: number;
  ratings: Rating[];
}

export interface User {
  id: string;
  displayName: string;
  joinedAt: number;
  userToken: string; // Secret token for cross-device authentication
}

export interface TopTenList {
  id: string;
  name: string;
  criteria: Criterion[];
  items: Item[];
  users: User[];
  ownerId: string;
  ownerToken: string; // Only stored server-side
  createdAt: number;
  isLocked: boolean;
}

// Client-side user identity stored in cookie
export interface UserIdentity {
  listId: string;
  userId: string;
  displayName: string;
}

// Computed ranking information
export interface ItemWithScore {
  item: Item;
  averageScore: number;
  totalRatings: number;
  ratingsByUser: Map<string, number>;
  criteriaScores: Map<string, { average: number; count: number }>;
}

