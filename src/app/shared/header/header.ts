import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class HeaderComponent implements OnInit {
  isHidden = false;
  isMobileMenuOpen = false;
  private lastScroll = 0;

  ngOnInit() {
    // Inicializar el scroll al recargar para evitar que se oculte de golpe
    this.lastScroll = window.pageYOffset || document.documentElement.scrollTop;
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    // Bloquear comportamiento de ocultamiento si el menú lateral está abierto
    if (this.isMobileMenuOpen) return;

    const current = window.pageYOffset || document.documentElement.scrollTop;

    // Tolerancia de 10px para evitar el efecto de "goma" en dispositivos móviles
    if (Math.abs(current - this.lastScroll) < 10) return;

    // Lógica para ocultar/mostrar
    this.isHidden = current > this.lastScroll && current > 100;
    this.lastScroll = current;
  }


  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.manageBodyScroll();
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    this.manageBodyScroll();
  }

  private manageBodyScroll() {
    if (this.isMobileMenuOpen) {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';   // ⬅️ clave en móviles
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.overscrollBehavior = '';
    }
  }
}