import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ItemService } from '../../core/services/item';
import { Attachment, Item } from '../../core/models/item.model';
import { Location } from '../../core/models/location.model';

@Component({
  imports: [RouterLink, FormsModule],
  selector: 'app-item-detail',
  styleUrl: './item-detail.scss',
  templateUrl: './item-detail.html',
})
export class ItemDetail {
  private itemService = inject(ItemService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  attachmentKinds: Attachment['kind'][] = ['manual', 'photo', 'receipt', 'other'];

  item = signal<Item | null>(null);
  selectedFile: File | null = null;
  selectedKind: Attachment['kind'] = 'manual';
  uploading = signal(false);
  uploadError = signal<string | null>(null);

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

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  upload() {
    const item = this.item();
    if (!item?._id || !this.selectedFile) return;

    this.uploading.set(true);
    this.uploadError.set(null);

    this.itemService.addAttachment(item._id, this.selectedFile, this.selectedKind).subscribe({
      next: (updated) => {
        this.item.set(updated);
        this.selectedFile = null;
        this.uploading.set(false);
      },
      error: () => {
        this.uploadError.set('Upload failed. Please try again.');
        this.uploading.set(false);
      },
    });
  }

  removeAttachment(attachmentId: string) {
    const item = this.item();
    if (!item?._id) return;
    if (!confirm('Delete this attachment?')) return;
    this.itemService
      .removeAttachment(item._id, attachmentId)
      .subscribe((updated) => this.item.set(updated));
  }
}
