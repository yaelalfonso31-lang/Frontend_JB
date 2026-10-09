import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EncuestaSatisfaccion } from './encuesta-satisfaccion';

describe('EncuestaSatisfaccion', () => {
  let component: EncuestaSatisfaccion;
  let fixture: ComponentFixture<EncuestaSatisfaccion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EncuestaSatisfaccion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EncuestaSatisfaccion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
