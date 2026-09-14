import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Colaborador } from './colaborador';

describe('Colaborador', () => {
  let component: Colaborador;
  let fixture: ComponentFixture<Colaborador>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Colaborador]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Colaborador);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
