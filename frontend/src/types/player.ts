export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  shirtNumber: number | null;
  position: string;
  photoUrl: string | null;
  active: boolean;
  joinedAt: string | null;
  leftAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerPayload {
  firstName: string;
  lastName: string;
  shirtNumber: number | null;
  position: string;
  photoUrl: string | null;
  active: boolean;
  joinedAt: string | null;
  leftAt: string | null;
}

export interface PlayerFilters {
  search?: string;
  position?: string;
  active?: boolean;
  page: number;
  limit: number;
}

export interface PlayerPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
