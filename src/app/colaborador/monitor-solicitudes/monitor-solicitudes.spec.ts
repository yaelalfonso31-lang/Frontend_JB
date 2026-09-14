import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonitorSolicitudes } from './monitor-solicitudes';

describe('MonitorSolicitudes', () => {
  let component: MonitorSolicitudes;
  let fixture: ComponentFixture<MonitorSolicitudes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonitorSolicitudes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MonitorSolicitudes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
