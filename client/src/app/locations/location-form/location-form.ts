import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LocationService } from '../../core/services/location';
import { Location, LocationType } from '../../core/models/location.model';

@Component({
  imports: [FormsModule, RouterLink],
  selector: 'app-location-form',
  styleUrl: './location-form.scss',
  templateUrl: './location-form.html',
})
export class LocationForm {
  private locationService = inject(LocationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  locationTypes: LocationType[] = ['house', 'condo', 'office', 'storage', 'other'];

  id = signal<string | null>(null);
  model: Partial<Location> = { type: 'house' };

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.id.set(id);
      this.locationService.get(id).subscribe((location) => (this.model = location));
    }
  }

  save() {
    const id = this.id();
    const request = id
      ? this.locationService.update(id, this.model)
      : this.locationService.create(this.model);

    request.subscribe(() => this.router.navigate(['/locations']));
  }
}
