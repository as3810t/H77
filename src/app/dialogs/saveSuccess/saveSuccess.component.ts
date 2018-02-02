import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

declare var window: any;

@Component({
	moduleId: module.id,
	templateUrl: './saveSuccess.component.html',
	styleUrls: ['./saveSuccess.component.css']
})
export class SaveSuccessComponent {
	Arr = Array;

	saveFolderName = '';
	saveFiles: any = [];

	constructor(
		public activeModal: NgbActiveModal
	) { }

	saveSuccess(saveFolderName, saveFiles) {
		this.saveFolderName = saveFolderName;
		this.saveFiles = saveFiles;
	}

	saveShowFolder() {
		window.electron.shell.openItem(this.saveFolderName);
	}

	saveShowFile(file) {
		window.electron.shell.showItemInFolder(window.path.join(this.saveFolderName, file));
	}
}
