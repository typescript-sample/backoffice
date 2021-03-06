import { Build, Controller, Log } from 'express-ext';
import { UploadController } from 'upload-express';
import { Location, LocationFilter, LocationService } from './location';

export class LocationController extends Controller<Location, string, LocationFilter> {
  constructor(log: Log, service: LocationService, build?: Build<Location>) {
    super(log, service, undefined, build);
  }
}

export class LocationUploadController extends UploadController {
  constructor(
    log: Log,
    service: LocationService,
    generateId: () => string,
    sizesCover: number[],
    sizesImage: number[]
  ) {
    super(log, service, service.getGalllery, generateId, sizesCover, sizesImage, 'id');
  }
}
