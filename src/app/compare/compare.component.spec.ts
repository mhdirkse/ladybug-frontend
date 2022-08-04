import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompareComponent, CompareData } from './compare.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { jqxTreeComponent } from 'jqwidgets-ng/jqxtree';

describe('CompareComponent', () => {
  let component: CompareComponent;
  let fixture: ComponentFixture<CompareComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CompareComponent, jqxTreeComponent],
      providers: [CompareData],
      imports: [HttpClientTestingModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CompareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
