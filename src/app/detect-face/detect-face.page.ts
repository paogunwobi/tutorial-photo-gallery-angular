import { Component } from '@angular/core';
import { ToastController, LoadingController, ActionSheetController } from '@ionic/angular';
import { ToURI } from '../functions/base64-to-uri';
import { UserPhoto, Photo2Service } from '../services/photo2.service';
import { Storage } from '@capacitor/storage';
import { HttpErrorResponse } from "@angular/common/http";
import { FaceDetectionService } from '../services/face-detection.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-detect-face',
  templateUrl: 'detect-face.page.html',
  styleUrls: ['detect-face.page.scss']
})
export class DetectFacePage {
  loading: boolean;
  public photo: UserPhoto | undefined;
  private PHOTO_BASE64: string = 'base64';
  photoUrl: any;
  displayed: boolean;
  
  constructor(
    public photoService: Photo2Service,
    private faceDetectervice: FaceDetectionService,
    public actionSheetController: ActionSheetController,
    public loadingController: LoadingController,
    public toastController: ToastController,
    public router: Router,
  ) {}

  async ngOnInit() {
    this.photoService.deletePicture(this.photoService.photo);
    const photo = await this.photoService.loadSaved();
    console.log('Photo: ', photo);
  }

  async validateReference(): Promise<any> {

    const photo = await Storage.get({ key: this.PHOTO_BASE64 });
    this.photoUrl = JSON.parse(photo.value) || undefined;
    
    let response: any;
    const imageURI = ToURI(this.photoUrl);
    const payload = { image: imageURI };
    const loading = await this.loadingController.create({
      cssClass: 'my-custom-class',
      message: 'Validating...',
      // duration: 2000
    });
    const toast = await this.toastController.create({
      header: 'Success',
      color: 'success',
      message: 'Reference Image Successfully Validated',
      // icon: 'information-circle',
      position: 'middle',
      duration: 4000
    });
    const toast2 = await this.toastController.create({
      header: 'Warning',
      color: 'warning',
      message: 'Face Not Detected in the Reference',
      // icon: 'information-circle',
      position: 'middle',
      duration: 7000
    });

    const toast4 = await this.toastController.create({
      header: 'Error',
      message: 'An Error Occurred',
      color: 'danger',
      // icon: 'information-circle',
      position: 'middle',
      duration: 7000
    });
    this.loading = true;
    await loading.present();
    const subscription = this.faceDetectervice.detect(payload).subscribe(
      async (res): Promise<void> => {
        response = await res;
        if (response && response[0].face.length) {
          this.loading = false;
          await loading.dismiss();
          toast.present();
          this.displayed = true;
          console.log('Detect Response: ', response);
          this.router.navigate(['tabs/validation'])
        } else {
          this.loading = false;
          await loading.dismiss();
          toast2.present();
          this.displayed = true;
          this.photoService.deletePicture(this.photoService.photo);
        }
      }, async (err) => {
        const { message } = err as HttpErrorResponse;
        let errMessage = message ? message : 'An Error Occurred';
        const toast3 = await this.toastController.create({
          header: 'Error',
          message: errMessage,
          color: 'danger',
          // icon: 'information-circle',
          position: 'middle',
          duration: 7000
        });
        this.loading = false;
        await loading.dismiss();
        toast3.present();
        this.displayed = true;
        console.error();
      }
    );

    setTimeout(() => {
      subscription.unsubscribe();
      if (!response || !response === undefined) {
        this.loading = false;
        if(this.displayed !== true) {
          loading.dismiss();
          toast4.present();
        }
        // this.messageService.error('An Error Occurred');
      }
    }, 8000);

  } 

  public async showActionSheet() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Photo',
      buttons: [{
        text: 'Delete',
        role: 'destructive',
        icon: 'trash',
        handler: () => {
          this.photoService.deletePicture(this.photoService.photo);
        }
      }, {
        text: 'Cancel',
        icon: 'close',
        role: 'cancel',
        handler: () => {
          // Nothing to do, action sheet is automatically closed
         }
      }]
    });
    await actionSheet.present();
  }
}
