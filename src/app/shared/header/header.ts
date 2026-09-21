import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class HeaderComponent {
  isHidden = false;
  private lastScroll = 0;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const current = window.pageYOffset;

    // Si bajas más de 100px y vas hacia abajo → ocultar
    // Si subes → mostrar
    this.isHidden = current > this.lastScroll && current > 100;
    this.lastScroll = current;
  }
}