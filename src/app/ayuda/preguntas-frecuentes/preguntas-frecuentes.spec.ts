import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreguntasFrecuentes } from './preguntas-frecuentes';

describe('PreguntasFrecuentes', () => {
  let component: PreguntasFrecuentes;
  let fixture: ComponentFixture<PreguntasFrecuentes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreguntasFrecuentes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreguntasFrecuentes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
