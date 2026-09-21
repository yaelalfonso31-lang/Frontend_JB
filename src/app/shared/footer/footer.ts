import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './footer.html',
  styleUrls: ['./footer.scss']
})
export class FooterComponent {

  onSubmit(event: Event) {
    event.preventDefault();
    // Aquí puedes integrar la lógica para guardar el correo o mostrar un Toast
    console.log('Suscripción enviada');
  }
}