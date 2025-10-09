import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PPrincipalPage } from './p-principal.page';

describe('PPrincipalPage', () => {
  let component: PPrincipalPage;
  let fixture: ComponentFixture<PPrincipalPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PPrincipalPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
