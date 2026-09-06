import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ItemService } from '../../core/services/item';
import { Item } from '../../core/models/item.model';
import { Location } from '../../core/models/location.model';

@Component({
  imports: [RouterLink],
  selector: 'app-item-detail',
  styleUrl: './item-detail.scss',
  templateUrl: './item-detail.html',
})
export class ItemDetail {
  private itemService = inject(ItemService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  item = signal<Item | null>(null);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.itemService.get(id).subscribe((item) => this.item.set(item));
  }

  locationName(item: Item): string {
    const location = item.location;
    return typeof location === 'string' ? location : (location as Location)?.name ?? '';
  }

  remove() {
    const item = this.item();
    if (!item?._id) return;
    if (!confirm(`Delete item "${item.name}"?`)) return;
    this.itemService.remove(item._id).subscribe(() => this.router.navigate(['/items']));
  }
}
