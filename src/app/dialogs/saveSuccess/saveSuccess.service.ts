import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { SaveSuccessComponent } from './saveSuccess.component';

declare var window: any;

@Injectable()
export class SaveSuccessService {
	constructor(
		private modalService: NgbModal
	) { }

	saveSuccess(saveFolderName, saveFiles) {
		const modal = this.modalService.open(SaveSuccessComponent);
		modal.componentInstance.saveSuccess(saveFolderName, saveFiles);
		return modal.result;
	}
}
