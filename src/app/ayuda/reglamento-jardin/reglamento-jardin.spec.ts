import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReglamentoJardin } from './reglamento-jardin';

describe('ReglamentoJardin', () => {
  let component: ReglamentoJardin;
  let fixture: ComponentFixture<ReglamentoJardin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReglamentoJardin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReglamentoJardin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
