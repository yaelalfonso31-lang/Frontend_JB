import { Component, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class HeaderComponent implements OnDestroy {
  isMobileMenuOpen = false;

  /* ---------- Cerrar drawer con Escape ---------- */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isMobileMenuOpen) this.closeMobileMenu();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.manageBodyScroll();
  }

  closeMobileMenu(): void {
    if (!this.isMobileMenuOpen) return;
    this.isMobileMenuOpen = false;
    this.manageBodyScroll();
  }

  private manageBodyScroll(): void {
    if (this.isMobileMenuOpen) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
    }
  }

  ngOnDestroy(): void {
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    document.body.style.overscrollBehavior = '';
  }
}