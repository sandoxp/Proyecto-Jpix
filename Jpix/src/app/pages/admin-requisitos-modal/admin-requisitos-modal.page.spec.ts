import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminRequisitosModalPage } from './admin-requisitos-modal.page';

describe('AdminRequisitosModalPage', () => {
  let component: AdminRequisitosModalPage;
  let fixture: ComponentFixture<AdminRequisitosModalPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminRequisitosModalPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
