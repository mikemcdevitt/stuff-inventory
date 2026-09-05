import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Location } from '../models/location.model';

@Service()
export class LocationService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/locations`;

  list(): Observable<Location[]> {
    return this.http.get<Location[]>(this.baseUrl);
  }

  get(id: string): Observable<Location> {
    return this.http.get<Location>(`${this.baseUrl}/${id}`);
  }

  create(location: Partial<Location>): Observable<Location> {
    return this.http.post<Location>(this.baseUrl, location);
  }

  update(id: string, location: Partial<Location>): Observable<Location> {
    return this.http.put<Location>(`${this.baseUrl}/${id}`, location);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
