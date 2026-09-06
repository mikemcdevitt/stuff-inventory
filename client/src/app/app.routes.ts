import { Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { LocationList } from './locations/location-list/location-list';
import { LocationForm } from './locations/location-form/location-form';
import { ItemList } from './items/item-list/item-list';
import { ItemForm } from './items/item-form/item-form';
import { ItemDetail } from './items/item-detail/item-detail';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard },
  { path: 'locations', component: LocationList },
  { path: 'locations/new', component: LocationForm },
  { path: 'locations/:id/edit', component: LocationForm },
  { path: 'items', component: ItemList },
  { path: 'items/new', component: ItemForm },
  { path: 'items/:id/edit', component: ItemForm },
  { path: 'items/:id', component: ItemDetail },
];
