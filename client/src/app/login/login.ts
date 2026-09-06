import { AfterViewInit, Component, ElementRef, inject, viewChild } from '@angular/core';
import { AuthService } from '../core/services/auth';

@Component({
  imports: [],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login implements AfterViewInit {
  auth = inject(AuthService);
  private googleButton = viewChild.required<ElementRef<HTMLDivElement>>('googleButton');

  ngAfterViewInit() {
    this.auth.initGoogleButton(this.googleButton().nativeElement);
  }
}
