import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecuperarContra } from './recuperar-contra';

describe('RecuperarContra', () => {
  let component: RecuperarContra;
  let fixture: ComponentFixture<RecuperarContra>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecuperarContra]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecuperarContra);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
