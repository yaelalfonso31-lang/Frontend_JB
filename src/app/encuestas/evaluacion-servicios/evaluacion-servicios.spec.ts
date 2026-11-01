import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaluacionServiciosComponent } from './evaluacion-servicios';

describe('EvaluacionServicios', () => {
  let component: EvaluacionServiciosComponent;
  let fixture: ComponentFixture<EvaluacionServiciosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EvaluacionServiciosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EvaluacionServiciosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
