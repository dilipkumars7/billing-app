import { Subject, from } from "rxjs";
import { debounceTime, switchMap } from "rxjs/operators";
import { ApiService } from "../api/apiService";
import { PATH } from "../constants/app.constant";


export const itemUpdateSubject = new Subject<any>();

// Function to call API (wrap fetch in RxJS "from")
const updateItemRequest = (payload: any) => {
  return from(
    ApiService.put(`${PATH.GET_ITEMS_DATA}/${payload.itemCode}`, payload)
  );
};

// Stream with debounce + switchMap (cancel previous requests)
export const itemUpdateStream$ = itemUpdateSubject.pipe(
  debounceTime(500),
  switchMap((data) => updateItemRequest(data))
);

// Incoming updates from WebSocket (API → all clients)
export const itemRealtimeSubject = new Subject<any>();
export const itemRealtimeStream$ = itemRealtimeSubject.asObservable();

const DeleteItemData = (key:any)=>{
  
}