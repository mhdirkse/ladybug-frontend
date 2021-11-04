import {Component, OnInit, Output, EventEmitter, Input, ViewChild} from '@angular/core';
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {HttpClient} from '@angular/common/http';
import {Sort} from "@angular/material/sort";
import {ToastComponent} from "../toast/toast.component";

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css']
})
export class TableComponent implements OnInit {
  @Output() emitEvent = new EventEmitter<any>();
  showFilter: boolean = false;
  metadata: any = {}; // The data that is displayed
  isLoaded: boolean = false; // Wait for the page to be loaded
  displayAmount: number = 10; // The amount of data that is displayed
  totalAmount: number = 0;
  filterValue: string = ""; // Value on what table should filter
  sortedData: any = {};
  @ViewChild(ToastComponent) toastComponent!: ToastComponent;

  @Input() // Needed to make a distinction between the two halves in compare component
  get id() {
    return this._id
  }

  set id(id: string) {
    this._id = id
  }

  private _id: string = "";

  constructor(private modalService: NgbModal, private http: HttpClient) {
  }

  /**
   * Open a modal
   * @param content - the specific modal to be opened
   */
  openModal(content: any) {
    this.modalService.open(content);
  }

  getDate(seconds: string) {
    let date = new Date(parseInt(seconds))
    return ('0' + date.getDay()).slice(-2) + "/" +
      ('0' + date.getUTCMonth()).slice(-2) + "/" +
      date.getFullYear() + " - " +
      ('0' + date.getHours()).slice(-2) + ":" +
      ('0' + date.getMinutes()).slice(-2) + ":" +
      ('0' + date.getSeconds()) + "." +
      ('0' + date.getMilliseconds()).slice(-3)
  }

  /**
   * Change the value on what the table should filter
   * @param event - the keyword
   */
  changeFilter(event: any) {
    this.filterValue = event.target.value;
  }

  /**
   * Change the limit of items shown in table
   * @param event - the new table limit
   */
  changeTableLimit(event: any) {
    this.displayAmount = event.target.value;
    this.ngOnInit()
  }

  /**
   * Sort the data accordingly
   * @param sort - sort object to handle sorting
   */
  sortData(sort: Sort) {
    const data = this.metadata.values
    if (!sort.active || sort.direction === '') {
      this.sortedData = data;
      return;
    }
    this.sortedData = data.sort((a: (string | number)[], b: (string | number)[]) => {

      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case '0':
          return this.compare(Number(a[0]), Number(b[0]), isAsc); // Duration
        case '1':
          return this.compare(Number(a[1]), Number(b[1]), isAsc); // StorageSize
        case '2':
          return this.compare(a[2], b[2], isAsc);                 // Name
        case '3':
          return this.compare(a[3], b[3], isAsc);                 // CorrelationId
        case '4':
          return this.compare(a[4], b[4], isAsc);                 // EndTime
        case '5':
          return this.compare(Number(a[5]), Number(b[5]), isAsc); // StorageId
        case '6':
          return this.compare(a[6], b[6], isAsc);                 // Status
        case '7':
          return this.compare(Number(a[7]), Number(b[7]), isAsc); // NumberOfCheckpoints
        case '8':
          return this.compare(Number(a[8]), Number(b[8]), isAsc); // EstimatedMemoryUsage
        default:
          return 0;
      }
    });
  }

  /**
   * Compare two strings or numbers
   * @param a - first string/number
   * @param b - second string/number
   * @param isAsc - whether it is ascending or not
   */
  compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  /**
   * Refresh the table
   */
  refresh() {
    this.showFilter = false;
    this.metadata = {};
    this.isLoaded = false;
    this.displayAmount = 10;
    this.ngOnInit();
  }

  /**
   * Toggle the filter option
   */
  toggleFilter() {
    this.showFilter = !this.showFilter;
  }

  /**
   Request the data based on storageId and send this data along to the tree (via parent)
   */
  openReport(storageId: string) {
    this.http.get<any>('api/report/debugStorage/' + storageId).subscribe(data => {
      data.id = this.id
      this.emitEvent.next(data);
    }, () => {
      this.toastComponent.addAlert({type: 'warning', message: 'Could not retrieve data for report!'})
    })
  }

  /**
   * Open all reports
   */
  openReports(amount: number) {
    if (amount === -1) {
      amount = this.metadata.values.length;
    }

    // The index 5 is the storageId
    for (let row of this.metadata.values.slice(0, amount)) {
      this.openReport(row[5]);
    }
  }

  downloadReports(exportMessages: boolean, exportReports: boolean) {
    let selectedReports = this.metadata.values;

    let queryString = "?";
    for (let i = 0; i < selectedReports.length; i++) {
      queryString += "id=" + selectedReports[i][5] + "&"
    }
    console.log("Query string: " + queryString);
    window.open('api/report/download/testStorage/' + exportMessages + "/" + exportReports + queryString.slice(0, -1));
  }

  uploadReport(event: any) {
    const file: File = event.target.files[0]
    if (file) {
      console.log("Uploading " + file.name);
      const formData = new FormData();
      formData.append("file", file);
      this.http.post('api/report/upload', formData, {headers: {'Content-Type': 'multipart/form-data'}}).subscribe(response => {
        console.log(response)
      })
    }
    this.loadData()

  }

  /**
   * Load in data for the table
   */
  ngOnInit() {
    this.loadData()
  }

  loadData() {
    this.http.get<any>('api/metadata/debugStorage/', {params: {"limit": this.displayAmount}}).subscribe(data => {
      this.metadata = data
      this.isLoaded = true;
    }, () => {
      this.toastComponent.addAlert({type: 'danger', message: 'Could not retrieve data for table!'})
    });
  }
}
