export type SeasonStatus = 'draft' | 'active' | 'closed';

export interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: SeasonStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SeasonPayload {
  name: string;
  startDate: string;
  endDate: string;
  status: SeasonStatus;
}
