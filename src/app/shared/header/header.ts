import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss']
})
export class HeaderComponent {
  // Aquí puedes inyectar servicios en el futuro si necesitas 
  // mostrar el nombre del usuario logueado o un botón de cerrar sesión
}