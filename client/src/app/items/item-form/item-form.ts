import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ItemService } from '../../core/services/item';
import { LocationService } from '../../core/services/location';
import { Item, ItemCategory } from '../../core/models/item.model';
import { Location } from '../../core/models/location.model';

@Component({
  imports: [FormsModule, RouterLink],
  selector: 'app-item-form',
  styleUrl: './item-form.scss',
  templateUrl: './item-form.html',
})
export class ItemForm {
  private itemService = inject(ItemService);
  private locationService = inject(LocationService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  categories: ItemCategory[] = [
    'appliance',
    'bike',
    'instrument',
    'electronics',
    'tool',
    'furniture',
    'other',
  ];

  locations = signal<Location[]>([]);
  id = signal<string | null>(null);
  model: Partial<Item> & { location: string } = { category: 'other', location: '' };

  constructor() {
    this.locationService.list().subscribe((locations) => this.locations.set(locations));

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.id.set(id);
      this.itemService.get(id).subscribe((item) => {
        const location = item.location;
        this.model = {
          ...item,
          location: typeof location === 'string' ? location : location?._id ?? '',
        };
      });
    }
  }

  save() {
    const id = this.id();
    const request = id
      ? this.itemService.update(id, this.model)
      : this.itemService.create(this.model);

    request.subscribe(() => this.router.navigate(['/items']));
  }
}
