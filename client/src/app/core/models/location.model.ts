export type LocationType = 'house' | 'condo' | 'office' | 'storage' | 'other';

export interface Location {
  _id?: string;
  name: string;
  type: LocationType;
  address?: string;
  notes?: string;
}
