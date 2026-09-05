import { Location } from './location.model';

export type ItemCategory =
  | 'appliance'
  | 'bike'
  | 'instrument'
  | 'electronics'
  | 'tool'
  | 'furniture'
  | 'other';

export interface Attachment {
  _id?: string;
  kind: 'manual' | 'photo' | 'receipt' | 'other';
  url: string;
  originalName?: string;
}

export interface Item {
  _id?: string;
  name: string;
  category: ItemCategory;
  location: Location | string;
  brand?: string;
  modelNumber?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  purchasedFrom?: string;
  warrantyExpiration?: string;
  tags?: string[];
  notes?: string;
  attachments?: Attachment[];
}
