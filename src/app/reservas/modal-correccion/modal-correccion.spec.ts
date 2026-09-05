import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalCorreccion } from './modal-correccion';

describe('ModalCorreccion', () => {
  let component: ModalCorreccion;
  let fixture: ComponentFixture<ModalCorreccion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalCorreccion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalCorreccion);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
