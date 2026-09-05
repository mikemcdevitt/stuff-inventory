import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ItemService } from '../../core/services/item';
import { LocationService } from '../../core/services/location';
import { Item, ItemCategory } from '../../core/models/item.model';
import { Location } from '../../core/models/location.model';

@Component({
  imports: [RouterLink, FormsModule],
  selector: 'app-item-list',
  styleUrl: './item-list.scss',
  templateUrl: './item-list.html',
})
export class ItemList {
  private itemService = inject(ItemService);
  private locationService = inject(LocationService);

  categories: ItemCategory[] = [
    'appliance',
    'bike',
    'instrument',
    'electronics',
    'tool',
    'furniture',
    'other',
  ];

  items = signal<Item[]>([]);
  locations = signal<Location[]>([]);

  q = '';
  locationFilter = '';
  categoryFilter = '';

  constructor() {
    this.locationService.list().subscribe((locations) => this.locations.set(locations));
    this.refresh();
  }

  refresh() {
    this.itemService
      .list({ q: this.q, location: this.locationFilter, category: this.categoryFilter })
      .subscribe((items) => this.items.set(items));
  }

  remove(item: Item) {
    if (!item._id) return;
    if (!confirm(`Delete item "${item.name}"?`)) return;
    this.itemService.remove(item._id).subscribe(() => this.refresh());
  }

  locationName(item: Item): string {
    const location = item.location;
    return typeof location === 'string' ? location : location?.name ?? '';
  }
}
