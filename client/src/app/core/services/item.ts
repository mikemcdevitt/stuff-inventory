import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Attachment, Item } from '../models/item.model';

export interface ItemFilter {
  location?: string;
  category?: string;
  q?: string;
}

@Service()
export class ItemService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/items`;

  list(filter: ItemFilter = {}): Observable<Item[]> {
    const params: Record<string, string> = {};
    if (filter.location) params['location'] = filter.location;
    if (filter.category) params['category'] = filter.category;
    if (filter.q) params['q'] = filter.q;
    return this.http.get<Item[]>(this.baseUrl, { params });
  }

  get(id: string): Observable<Item> {
    return this.http.get<Item>(`${this.baseUrl}/${id}`);
  }

  create(item: Partial<Item>): Observable<Item> {
    return this.http.post<Item>(this.baseUrl, item);
  }

  update(id: string, item: Partial<Item>): Observable<Item> {
    return this.http.put<Item>(`${this.baseUrl}/${id}`, item);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  addAttachment(id: string, file: File, kind: Attachment['kind']): Observable<Item> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('kind', kind);
    return this.http.post<Item>(`${this.baseUrl}/${id}/attachments`, formData);
  }

  removeAttachment(id: string, attachmentId: string): Observable<Item> {
    return this.http.delete<Item>(`${this.baseUrl}/${id}/attachments/${attachmentId}`);
  }
}
