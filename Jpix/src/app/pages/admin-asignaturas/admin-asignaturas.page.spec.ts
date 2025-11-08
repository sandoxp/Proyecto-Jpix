import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminAsignaturasPage } from './admin-asignaturas.page';

describe('AdminAsignaturasPage', () => {
  let component: AdminAsignaturasPage;
  let fixture: ComponentFixture<AdminAsignaturasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminAsignaturasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
