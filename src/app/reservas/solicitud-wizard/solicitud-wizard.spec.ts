import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolicitudWizard } from './solicitud-wizard';

describe('SolicitudWizard', () => {
  let component: SolicitudWizard;
  let fixture: ComponentFixture<SolicitudWizard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolicitudWizard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SolicitudWizard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
