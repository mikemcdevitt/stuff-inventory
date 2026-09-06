import { Service, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  email: string;
  name?: string;
  picture?: string;
}

declare const google: any;

const TOKEN_KEY = 'stuff-inventory.token';
const USER_KEY = 'stuff-inventory.user';

@Service()
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  user = signal<AuthUser | null>(this.readStoredUser());
  loginError = signal<string | null>(null);

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  initGoogleButton(container: HTMLElement, attempt = 0) {
    if (typeof google === 'undefined') {
      if (attempt >= 25) {
        this.loginError.set('Could not load Google Sign-In. Check your connection and reload.');
        return;
      }
      setTimeout(() => this.initGoogleButton(container, attempt + 1), 200);
      return;
    }

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: { credential: string }) => this.handleCredential(response.credential),
    });
    google.accounts.id.renderButton(container, { theme: 'outline', size: 'large' });
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.user.set(null);
    if (typeof google !== 'undefined') {
      google.accounts.id.disableAutoSelect();
    }
    this.router.navigate(['/login']);
  }

  private handleCredential(credential: string) {
    this.loginError.set(null);
    this.http
      .post<{ token: string; user: AuthUser }>(`${environment.apiUrl}/auth/google`, { credential })
      .subscribe({
        next: ({ token, user }) => {
          localStorage.setItem(TOKEN_KEY, token);
          localStorage.setItem(USER_KEY, JSON.stringify(user));
          this.user.set(user);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.loginError.set(
            err.status === 403
              ? 'This Google account is not authorized for this app.'
              : 'Sign-in failed. Please try again.'
          );
        },
      });
  }

  private readStoredUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
