import { environment } from 'src/environments/environment';
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FaceDetectionService {
  constructor(private http: HttpClient) { }

  detect(payload: any): Observable<any> {
    return this.http.post<any>(`${environment.config.API_URL}/face-detection/detect`, payload);
  }

  authenticate(payload: { referenceImage: string; inputImage: string; }): Observable<any> {
    return this.http.post<any>(`${environment.config.API_URL}/face-detection/authenticate`, payload);
  }
  async authenticate2(payload: any) {
    return this.http.post<any>(`${environment.config.API_URL}/face-detection/authenticate`, payload).toPromise();
  }
}
