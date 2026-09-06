import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ItemService } from '../core/services/item';
import { LocationService } from '../core/services/location';
import { Item, ItemCategory } from '../core/models/item.model';
import { Location } from '../core/models/location.model';

interface CountRow {
  label: string;
  count: number;
  queryParams: Record<string, string>;
}

@Component({
  imports: [RouterLink],
  selector: 'app-dashboard',
  styleUrl: './dashboard.scss',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private itemService = inject(ItemService);
  private locationService = inject(LocationService);

  private items = signal<Item[]>([]);
  private locations = signal<Location[]>([]);

  totalItems = computed(() => this.items().length);

  byLocation = computed<CountRow[]>(() => {
    const items = this.items();
    return this.locations()
      .map((location) => ({
        label: location.name,
        count: items.filter((item) => this.itemLocationId(item) === location._id).length,
        queryParams: { location: location._id ?? '' },
      }))
      .sort((a, b) => b.count - a.count);
  });

  byCategory = computed<CountRow[]>(() => {
    const items = this.items();
    const categories: ItemCategory[] = [
      'appliance',
      'bike',
      'instrument',
      'electronics',
      'tool',
      'furniture',
      'other',
    ];
    return categories
      .map((category) => ({
        label: category,
        count: items.filter((item) => item.category === category).length,
        queryParams: { category },
      }))
      .filter((row) => row.count > 0)
      .sort((a, b) => b.count - a.count);
  });

  incompleteItems = computed<Item[]>(() =>
    this.items().filter((item) => !item.modelNumber || !item.serialNumber)
  );

  constructor() {
    this.itemService.list().subscribe((items) => this.items.set(items));
    this.locationService.list().subscribe((locations) => this.locations.set(locations));
  }

  private itemLocationId(item: Item): string | undefined {
    const location = item.location;
    return typeof location === 'string' ? location : location?._id;
  }
}
