import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LocationService } from '../../core/services/location';
import { Location } from '../../core/models/location.model';

@Component({
  imports: [RouterLink],
  selector: 'app-location-list',
  styleUrl: './location-list.scss',
  templateUrl: './location-list.html',
})
export class LocationList {
  private locationService = inject(LocationService);

  locations = signal<Location[]>([]);

  constructor() {
    this.refresh();
  }

  refresh() {
    this.locationService.list().subscribe((locations) => this.locations.set(locations));
  }

  remove(location: Location) {
    if (!location._id) return;
    if (!confirm(`Delete location "${location.name}"?`)) return;
    this.locationService.remove(location._id).subscribe(() => this.refresh());
  }
}
