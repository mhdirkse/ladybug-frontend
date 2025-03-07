import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from '../../../services/http.service';
import { CookieService } from 'ngx-cookie-service';
import { ToastComponent } from '../../toast/toast.component';

@Component({
  selector: 'app-table-settings-modal',
  templateUrl: './table-settings-modal.component.html',
  styleUrls: ['./table-settings-modal.component.css'],
})
export class TableSettingsModalComponent {
  @ViewChild('modal') modal!: any;
  settingsForm = new FormGroup({
    generatorEnabled: new FormControl('Enabled'),
    regexFilter: new FormControl('.*'), // Report filter
    transformationEnabled: new FormControl(false),
    transformation: new FormControl(''),
  });

  @Output() openLatestReportsEvent = new EventEmitter<any>();
  @Output() openReportInProgress = new EventEmitter<any>();
  @ViewChild(ToastComponent) toastComponent!: ToastComponent;
  @Input()
  get reportsInProgress(): string {
    return this._reportsInProgress;
  }
  set reportsInProgress(reportsInProgress: string) {
    this._reportsInProgress = reportsInProgress;
  }
  public _reportsInProgress = '';

  constructor(private modalService: NgbModal, private httpService: HttpService, private cookieService: CookieService) {}

  open(): void {
    this.loadSettings();
    this.modalService.open(this.modal);
    this.disableOpenReportInProgressButton(false);
  }

  /**
   * Save the settings of the table
   */
  saveSettings(): void {
    const form: any = this.settingsForm.value;
    this.cookieService.set('generatorEnabled', form.generatorEnabled);
    this.cookieService.set('regexFilter', form.regexFilter);
    this.cookieService.set('transformationEnabled', form.transformationEnabled.toString());
    this.httpService.postTransformation(form.transformation).subscribe();
    let data: any = { generatorEnabled: form.generatorEnabled === 'Enabled' };
    this.httpService.postSettings(data).subscribe();
    this.toastComponent.addAlert({ type: 'warning', message: 'Reopen report to see updated XML' });
  }

  openLatestReports(amount: number): void {
    this.openLatestReportsEvent.next(amount);
  }

  openReportsInProgress(index: number) {
    this.openReportInProgress.next(index);
  }

  resetModal(): void {
    this.loadSettings();
  }

  factoryReset(): void {
    this.settingsForm.get('generatorEnabled')?.setValue('Enabled');
    this.settingsForm.get('regexFilter')?.setValue('.*');
    this.settingsForm.get('transformationEnabled')?.setValue(false);
    this.httpService.getTransformation(true).subscribe((response) => {
      this.settingsForm.get('transformation')?.setValue(response.transformation);
    });
  }

  disableOpenReportInProgressButton(disable: boolean) {
    let element: HTMLButtonElement = document.querySelector('#openReportInProgressButton')!;
    element.disabled = disable || this._reportsInProgress == '0';
  }

  disableButton(index: string): void {
    this.disableOpenReportInProgressButton(index == '0');
  }

  loadSettings(): void {
    this.httpService.getSettings().subscribe((response) => {
      const generatorStatus = response.generatorEnabled ? 'Enabled' : 'Disabled';
      this.cookieService.set('generatorEnabled', generatorStatus);
      this.settingsForm.get('generatorEnabled')?.setValue(generatorStatus);
    });

    if (this.cookieService.get('regexFilter')) {
      this.settingsForm.get('regexFilter')?.setValue(this.cookieService.get('regexFilter'));
    }

    if (this.cookieService.get('transformationEnabled') != undefined) {
      this.settingsForm
        .get('transformationEnabled')
        ?.setValue(this.cookieService.get('transformationEnabled') == 'true');
    }

    this.httpService.getTransformation(false).subscribe((response) => {
      this.settingsForm.get('transformation')?.setValue(response.transformation);
    });
  }

  getRegexFilter(): string {
    return this.settingsForm.get('regexFilter')?.value;
  }
}
