import { Component, OnInit, Output, EventEmitter, Input, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { ToastComponent } from '../toast/toast.component';
import { HelperService } from '../../services/helper.service';
import { HttpService } from '../../services/http.service';
import { LoaderService } from '../../services/loader.service';
import { TableSettingsModalComponent } from '../modals/table-settings-modal/table-settings-modal.component';
import { TableSettings } from '../../interfaces/table-settings';
import { Metadata } from '../../interfaces/metadata';
import { catchError } from 'rxjs';
import { Report } from '../../interfaces/report';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css'],
})
export class TableComponent implements OnInit, OnDestroy {
  DEFAULT_DISPLAY_AMOUNT: number = 10;
  HEADERS: string[] = [
    'Storage Id',
    'End Time',
    'Duration (ms)',
    'Name',
    'Status',
    'Correlation id',
    'Number of Checkpoints',
    'Estimated Memory Usage (Bytes)',
    'Storage Size (Bytes)',
  ];
  tableSettings: TableSettings = {
    tableId: '', // this._id might not be defined yet
    reportMetadata: [],
    tableLoaded: false,
    displayAmount: this.DEFAULT_DISPLAY_AMOUNT,
    showFilter: false,
    filterValue: '',
    filterHeader: '',
    reportsInProgress: '',
    estimatedMemoryUsage: '',
  };
  @Output() openReportEvent = new EventEmitter<any>();
  @ViewChild(ToastComponent) toastComponent!: ToastComponent;
  @ViewChild(TableSettingsModalComponent)
  tableSettingsModal!: TableSettingsModalComponent;
  @Input() // Needed to make a distinction between the two halves in compare component
  get id() {
    return this._id;
  }
  set id(id: string) {
    this._id = id;
  }
  private _id: string = 'debug';

  constructor(
    private httpService: HttpService,
    public helperService: HelperService,
    private loaderService: LoaderService,
    private cookieService: CookieService
  ) {}

  ngOnInit(): void {
    const tableSettings = this.loaderService.getTableSettings(this._id);
    if (!tableSettings.tableLoaded) {
      this.loadData();
    } else {
      this.tableSettings = tableSettings;
    }
  }

  ngOnDestroy(): void {
    this.loaderService.saveTableSettings(this._id, this.tableSettings);
  }

  loadData(): void {
    let regexFilter = '.*';
    if (this.tableSettingsModal) {
      regexFilter = this.tableSettingsModal.getRegexFilter();
    }

    this.httpService.getReports(this.tableSettings.displayAmount, regexFilter).subscribe({
      next: (value) => {
        this.tableSettings.reportMetadata = value;
        this.tableSettings.tableLoaded = true;
        this.toastComponent.addAlert({
          type: 'success',
          message: 'Data loaded!',
        });
      },
      error: () => {
        catchError(this.httpService.handleError());
      },
    });

    this.getTableSettings();
  }

  getTableSettings() {
    this.httpService.getSettings().subscribe({
      next: (settings) => {
        this.tableSettings.reportsInProgress = settings.reportsInProgress;
        this.tableSettings.estimatedMemoryUsage = settings.estMemory;
      },
    });
  }

  openModal(): void {
    this.tableSettingsModal.open();
  }

  getDate(seconds: string): Date {
    return new Date(Number.parseInt(seconds));
  }

  toggleFilter(): void {
    this.tableSettings.showFilter = !this.tableSettings.showFilter;
  }

  changeFilter(event: any, header: string): void {
    this.tableSettings.filterHeader = header;
    this.tableSettings.filterValue = event.target.value;
  }

  changeTableLimit(event: any): void {
    this.tableSettings.displayAmount = event.target.value === '' ? 0 : event.target.value;
    this.loadData();
  }

  refresh(): void {
    this.tableSettings.showFilter = false;
    this.tableSettings.reportMetadata = [];
    this.tableSettings.tableLoaded = false;
    this.tableSettings.displayAmount = 10;
    this.loadData();
  }

  openReport(storageId: string): void {
    this.httpService.getReport(storageId, 'debugStorage').subscribe((data) => {
      let report: Report = data.report;
      report.xml = data.xml;
      report.id = this.id;
      this.openReportEvent.next(report);
    });
  }

  openAllReports(): void {
    this.tableSettings.reportMetadata.forEach((report: Metadata) => this.openReport(report.storageId));
  }

  openLatestReports(amount: number): void {
    this.httpService.getLatestReports(amount).subscribe((data) => {
      data.forEach((report: any) => {
        report.id = this.id;
        this.openReportEvent.next(report);
      });
    });
  }

  openReportInProgress(index: number) {
    this.httpService.getReportInProgress(index).subscribe((report) => {
      report.id = this.id;
      this.openReportEvent.next(report);
    });
  }

  deleteReportInProgress(index: number) {
    this.httpService.deleteReportInProgress(index).subscribe();
    this.getTableSettings();
  }

  downloadReports(exportBinary: boolean, exportXML: boolean): void {
    const queryString: string = this.tableSettings.reportMetadata.reduce(
      (totalQuery: string, selectedReport: Metadata) => totalQuery + 'id=' + selectedReport.storageId + '&',
      '?'
    );
    window.open('api/report/download/debugStorage/' + exportBinary + '/' + exportXML + queryString.slice(0, -1));
  }

  uploadReports(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      const formData: any = new FormData();
      formData.append('file', file);
      this.showUploadedReports(formData);
    }
  }

  showUploadedReports(formData: any) {
    this.httpService.uploadReport(formData).subscribe((data) => {
      for (let report of data) {
        report.id = this.id;
        this.openReportEvent.next(report);
      }
    });
  }
}
