import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminSeccionesModalPage } from './admin-secciones-modal.page';

describe('AdminSeccionesModalPage', () => {
  let component: AdminSeccionesModalPage;
  let fixture: ComponentFixture<AdminSeccionesModalPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminSeccionesModalPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
