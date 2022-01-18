import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, timer } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ToURI } from '../functions/base64-to-uri';
import { FaceDetectionService } from '../services/face-detection.service';
import { UserPhoto, Photo2Service } from '../services/photo2.service';
import { ToastController, LoadingController, ActionSheetController } from '@ionic/angular';
import { Storage } from '@capacitor/storage';
@Component({
  selector: 'app-validation',
  templateUrl: 'validation.page.html',
  styleUrls: ['validation.page.scss']
})
export class ValidationPage {
  frameHeight = environment.frameHeight;
  @ViewChild('videoElement') videoElement: any;

  private constraints: MediaStreamConstraints = {
    video: {
      facingMode: 'environment',
      frameRate: { ideal: 60 }
    }
  };

  faceMode: ConstrainDOMString

  video!: HTMLVideoElement;

  isReady = false;
  isLoading = false;
  submitted = false;

  errors: string[] = [];
  messages: string[] = [];
  useCamera = true;
  progress = 0;
  stepperStatus = '';
  imgUrl: string = '';
  responses: any[] = [];
  resCount: number = 0;
  referenceUserFaceTemplate: any;
  faceApiResult: any;
  humanResult: any;
  authFlags: any;
  webCamFeed: HTMLVideoElement | undefined;
  isRunningDetection: boolean = false;
  matched: number = 0;
  misMatched: number = 0;
  eyesClosed: number = 0;
  eyesOpen: number = 0;
  phoneVisibleCount: number =  0;
  wristVisibleCount: number = 0;
  failedTest: number = 0;
  imageURI: string = '';
  flipped = false;

  public photo: UserPhoto | undefined;
  private PHOTO_BASE64: string = 'base64';
  photoUrl: any;

  constructor(
    public photoService: Photo2Service, 
    public actionSheetController: ActionSheetController,
    public loadingController: LoadingController,
    public toastController: ToastController,
    public router: Router,
    private faceDetectervice: FaceDetectionService,
    ) {}

  async ngOnInit() {
    await this.photoService.loadSaved();
  }

  async ngAfterViewInit(): Promise<void> {

    this.video = this.videoElement.nativeElement as HTMLVideoElement;

    const stream = await navigator.mediaDevices.getUserMedia(this.constraints);
    if (stream) {
      this.video.srcObject = stream;
      await this.video.play();
      this.isReady = true;
    }
  }

  async flipCamera() {
    const constraint1: MediaStreamConstraints = {
      video: {
        facingMode: 'environment',
        frameRate: { ideal: 60 }
      }
    };
    
    const constraint2: MediaStreamConstraints = {
      video: {
        facingMode: 'user',
        frameRate: { ideal: 60 }
      }
    };
    let stream;
    this.flipped = !this.flipped;
    if (this.flipped) {
      stream = await navigator.mediaDevices.getUserMedia(constraint1);
    } else {
      stream = await navigator.mediaDevices.getUserMedia(constraint2);
    }

    this.video.srcObject = stream;
    await this.video.play();
    this.isReady = true;
  }

  async stopCamera() {
    this.router.navigateByUrl('tabs/detect-face');
    console.log('stopping camera');
  }

  async authenticate() {
    this.isLoading = true;
    this.useCamera = true;
    this.errors = [];
    this.messages = [];
    this.submitted = true;

    const photo = await Storage.get({ key: this.PHOTO_BASE64 });
    this.photoUrl = JSON.parse(photo.value) || undefined;
    this.imageURI = ToURI(this.photoUrl);
    
    if (!this.photoUrl || this.photoUrl === '' || this.photoUrl === undefined) {
      this.isLoading = false;
      this.submitted = false;
      const toast = await this.toastController.create({
        header: 'Warning',
        color: 'warning',
        message: 'No reference image was set for Face Scan',
        // icon: 'information-circle',
        position: 'middle',
        duration: 7000
      });
      toast.present();
      // this.messageService.warning('No reference image was set for Face Scan');
      this.video.pause();
      this.router.navigateByUrl('tabs/detect-face');
      return;
    }

    this.failedTest = 0;
    await this.scanProcess();

    await timer(5000).toPromise();
    if (this.confirmMatch() === true) {
      if (this.isRunningDetection === true) {
        const toast2 = await this.toastController.create({
          header: 'Success',
          color: 'success',
          message: 'User Authentication Successful',
          // icon: 'information-circle',
          position: 'middle',
          duration: 7000
        });
        toast2.present();
        // this.messageService.success('User Authentication Successful');
        this.isRunningDetection = false;
      }

      setTimeout(() => {
        this.video.pause();
        this.photoService.deletePicture(this.photoService.photo)
        this.router.navigateByUrl('tabs/detect-face');
      }, 7000);

    } else {
      if (this.isRunningDetection === true) {
        const toast3 = await this.toastController.create({
          header: 'Error',
          color: 'danger',
          message: 'Authentication Failed!',
          // icon: 'information-circle',
          position: 'middle',
          duration: 7000
        });
        toast3.present();
        // this.messageService.error(`Authentication Failed!`);
        this.isRunningDetection = false;
      }
    }

    this.isLoading = false;
  }

  private async scanProcess() {
    this.progress = 0;
    this.isRunningDetection = true;

    while (this.isLoading && this.progress < 100 && this.isRunningDetection === true) {
      this.progress += 4;
      await Promise.all([this.runDetection()]);
      await timer(700).toPromise();
      if (this.progress < 30) {
        this.stepperStatus = 'primary';
      } else if (30 < this.progress && this.progress < 60) {
        this.stepperStatus = 'warning'
      } else {
        this.stepperStatus = 'success'
      }
    }
  }


  private async runDetection() {
    if (!this.isRunningDetection) { return; }
    let newImageURI = this.fetchImageURI(this.video);

    // let ApiResponse: any;
    // const subscription = this.faceDetectervice.authenticate({ referenceImage: this.imageURI, inputImage: newImageURI }).subscribe(
    //   async (res): Promise<void> => {
    //     ApiResponse = await res;
    //     this.updateResults(ApiResponse);
    //   }
    // );

    // setTimeout(() => {
    //   subscription.unsubscribe();
    // }, 7000);

    const subscription1 = this.faceDetectervice.authenticate({ referenceImage: this.imageURI, inputImage: newImageURI });
    const subscription2 = this.faceDetectervice.authenticate({ referenceImage: this.imageURI, inputImage: newImageURI });
    const subscription3 = this.faceDetectervice.authenticate({ referenceImage: this.imageURI, inputImage: newImageURI });
    const subscription4 = this.faceDetectervice.authenticate({ referenceImage: this.imageURI, inputImage: newImageURI });
    const subscription5 = this.faceDetectervice.authenticate({ referenceImage: this.imageURI, inputImage: newImageURI });

    const totalRes = forkJoin([subscription1, subscription2, subscription3, subscription4, subscription5]).subscribe(
      async (response) => {
        let res = await Promise.all(response);
        await timer(1000).toPromise();
        console.log('Response: ', res);
        if(res.length) {
          this.responses.push(...res);
          for (const resp of res) {
            this.updateResults(resp);
          }
        } else {
          this.failedTest++
          console.log('no response');
          return;
        }
      }
    );

    setTimeout(() => {
      totalRes.unsubscribe();
    }, 40000);

    requestAnimationFrame;
  }

  private fetchImageURI(video: HTMLVideoElement): string {
    let newImageSRC = '';
    let newImageURI = '';
    if(video) {
      newImageSRC = this.getImageSRC(video);
      newImageURI = ToURI(newImageSRC);
    }
    return newImageURI;
  }

  private getImageSRC(image: HTMLVideoElement) {
    let imageSRC = '';
    let canvas = document.getElementById('target-canvas') as HTMLCanvasElement;
    canvas.width = environment.frameWidth;
    canvas.height = environment.frameHeight;
    let ctx = canvas.getContext("2d");
    ctx?.drawImage(image, 0, 0, environment.frameWidth, environment.frameHeight);
    imageSRC = canvas.toDataURL('image/jpeg', 1.0);
    return imageSRC;
  }

  whole(progress: number): number {
    return Math.floor(progress);
  }

  updateResults(res: any) {
    this.matched += res.match;
    this.misMatched += res.misMatch;
    this.eyesClosed += res.eyesClosed;
    this.eyesOpen += res.eyesOpen;
    this.phoneVisibleCount += res.phoneVisibleCount;
    this.wristVisibleCount += res.wristVisibleCount;
    // this.responses.push(res);
    this.resCount++;

    console.log('Matched Count: ', this.matched);
    console.log('MisMatched Count: ', this.misMatched);
    console.log('EyesOpen Count: ', this.eyesOpen);
    console.log('EyesClosed Count: ', this.eyesClosed);
    console.log('Wrist Visible Count: ', this.wristVisibleCount);
    console.log('Response Count: ', this.resCount);
  }

  private confirmMatch(): boolean {
    let percentageMatch = 0
    let percentageMisMatch = 0
    percentageMatch = (this.matched / this.resCount) * 100;
    percentageMisMatch = (this.misMatched / this.resCount) * 100;
    console.log("Response Data: ", this.responses);
    if (percentageMatch < 80 || this.matched < 10) { return false; }
    if (percentageMisMatch > 20) { return false; }
    return true;
  }

  ngOnDestroy() {
    this.video.pause();
    (this.video.srcObject as MediaStream).getTracks().forEach(s => s.stop());
  }

}
