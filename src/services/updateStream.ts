import { Subject, from } from "rxjs";
import { debounceTime, switchMap } from "rxjs/operators";
import { ApiService } from "../api/apiService";
import { PATH } from "../constants/app.constant";


export const itemUpdateSubject = new Subject<any>();
export const supplierUpdateSubject = new Subject<any>();
export const purchaseUpdateSubject = new Subject<any>();
export const customerUpdateSubject = new Subject<any>();
export const invoiceUpdateSubject = new Subject<any>();

// Function to call API (wrap fetch in RxJS "from")
const updateItemRequest = (payload: any) => {
  return from(
    ApiService.put(`${PATH.GET_ITEMS_DATA}/${payload.itemCode}`, payload)
  );
};

const updateSupplierRequest = (payload: any) => {
  return from(
    ApiService.put(`${PATH.SUPPLIERS_DATA}/${payload.supplierCode}`, payload)
  );
};

const updatePurchaseRequest = (payload: any) => {
  return from(
    ApiService.put(`${PATH.PURCHASE_DATA}/${payload.purchaseCode}`, payload)
  );
};

const updateCustomerRequest = (payload: any) => {
  return from(
    ApiService.put(`${PATH.CUSTOMERS_DATA}/${payload.customerCode}`, payload)
  );
};

const updateInvoiceRequest = (payload: any) => {
  return from(
    ApiService.put(`${PATH.INVOICES_DATA}/${payload.invoiceNumber}`, payload)
  );
};

// Stream with debounce + switchMap (cancel previous requests)
export const itemUpdateStream$ = itemUpdateSubject.pipe(
  debounceTime(1000),
  switchMap((data) => updateItemRequest(data))
);
export const supplierUpdateStream$ = supplierUpdateSubject.pipe(
  debounceTime(1500),
  switchMap((data) => updateSupplierRequest(data))
);
export const purchaseUpdateStream$ = purchaseUpdateSubject.pipe(
  debounceTime(1500),
  switchMap((data) => updatePurchaseRequest(data))
)

export const customerUpdateStream$ = customerUpdateSubject.pipe(
  debounceTime(1500),
  switchMap((data) => updateCustomerRequest(data))
);

export const invoiceUpdateStream$ = invoiceUpdateSubject.pipe(
  debounceTime(1000),
  switchMap((data) => updateInvoiceRequest(data))
);

// Incoming updates from WebSocket (API → all clients)
export const itemRealtimeSubject = new Subject<any>();
export const itemRealtimeStream$ = itemRealtimeSubject.asObservable();
