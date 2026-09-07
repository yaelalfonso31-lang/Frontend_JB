import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface CampoCorreccion {
  id: string; // Ej: 'asistentes', 'cartaMotivos'
  etiqueta: string;
  tipo: 'text' | 'number' | 'file' | 'textarea';
  valorActual: any;
  mensajeError: string; // La razón por la que se rechazó este campo específico
}

@Component({
  selector: 'app-modal-correccion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-correccion.html',
  styleUrls: ['./modal-correccion.scss']
})
export class ModalCorreccionComponent implements OnInit {
  @Input() folio: string = '';
  @Input() campos: CampoCorreccion[] = [];

  // Emisores para comunicarse con el componente padre (Consultar Solicitud)
  @Output() cerrar = new EventEmitter<void>();
  @Output() guardar = new EventEmitter<any>();

  // Objeto para almacenar temporalmente los nuevos valores ingresados
  valoresFormulario: { [key: string]: any } = {};

  ngOnInit(): void {
    // Inicializar el formulario con los valores que el usuario había enviado originalmente
    this.campos.forEach(campo => {
      this.valoresFormulario[campo.id] = campo.valorActual;
    });
  }

  enviarCorrecciones(): void {
    // Emitimos el objeto con las correcciones al componente padre para que haga la petición HTTP
    this.guardar.emit(this.valoresFormulario);
  }
}