import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultarSolicitud } from './consultar-solicitud';

describe('ConsultarSolicitud', () => {
  let component: ConsultarSolicitud;
  let fixture: ComponentFixture<ConsultarSolicitud>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultarSolicitud]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConsultarSolicitud);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
