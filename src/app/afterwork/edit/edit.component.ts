import { Component, Input, Output, ViewChild, EventEmitter, NgZone } from '@angular/core';
import { OpenFileService } from './../../dialogs/openFile.service';
import { ExportFileService } from './../../dialogs/exportFile.service';
import { ImportService } from './../../dialogs/import/import.service';
import { SaveSuccessService } from './../../dialogs/saveSuccess/saveSuccess.service';
import { TranslateService } from '@ngx-translate/core';

declare var window: any;

@Component({
	moduleId: module.id,
	selector: 'app-edit',
	templateUrl: './edit.component.html',
	styleUrls: ['./edit.component.css']
})
export class EditComponent {
	Arr = Array;

	errorMessage = '';
	editing = false;

	editFileName = '';
	editLen = 0;
	editIdent = '';
	editIdents: any = [];
	editKeyboard: any = [];
	editFileType = 'xlsx';

	eventList: any = [];
	addEventListKey = '';
	addEventListTime = 0;
	addEventListIdent = '';

	saveFileName = '';
	saveFolderName = '';

	constructor(
		private openFileService: OpenFileService,
		private exportFileService: ExportFileService,
		private importService: ImportService,
		private saveSuccessService: SaveSuccessService,
		private translate: TranslateService,
		private ngzone: NgZone
	) {
		const ipcRenderer = window.electron.ipcRenderer;

		ipcRenderer.on('editFile', () => {
			this.ngzone.run(() => {
				this.editOpenFile();
			});
		});
	}

	ngOnInit() {

	}

	editOpenFile() {
		this.errorMessage = '';
		this.importService.importDialog().then((imp: any) => {
			this.editLen = imp.lengthOfMeasurement;
			this.editKeyboard = imp.keyboard;
			this.eventList = imp.data[0];
			this.editFileName = imp.files[0];

			this.editIdent = '*';
			this.editIdents = [];
			for (let i = 0; i < this.eventList.length; i++) {
				if (this.editIdents.indexOf(this.eventList[i].ident) == -1) this.editIdents.push(this.eventList[i].ident);
			}
		}).catch((e) => {
			if (e) this.errorMessage = e;
		});
	}

	editSaveFile() {
		this.errorMessage = '';
		this.saveFolderName = '';

		var filters = [];
		if (this.editFileType == 'xlsx') {
			filters.push({ name: this.translate.instant('analysis.excel'), extensions: ['xlsx'] });
			filters.push({ name: this.translate.instant('analysis.libreoffice'), extensions: ['ods'] });
			filters.push({ name: this.translate.instant('analysis.raw'), extensions: ['csv'] });
		}
		else if (this.editFileType == 'ods') {
			filters.push({ name: this.translate.instant('analysis.libreoffice'), extensions: ['ods'] });
			filters.push({ name: this.translate.instant('analysis.excel'), extensions: ['xlsx'] });
			filters.push({ name: this.translate.instant('analysis.raw'), extensions: ['csv'] });
		}
		else if (this.editFileType == 'csv') {
			filters.push({ name: this.translate.instant('analysis.raw'), extensions: ['csv'] });
			filters.push({ name: this.translate.instant('analysis.excel'), extensions: ['xlsx'] });
			filters.push({ name: this.translate.instant('analysis.libreoffice'), extensions: ['ods'] });
		}
		else {
			return;
		}

		this.openFileService.saveFile(filters).then((fileName: any) => {
			var path = window.path.parse(fileName);
			this.saveFileName = path.base;
			this.saveFolderName = path.dir;

			this.exportFileService.exportFile(path.name, this.editFileType, this.eventList, this.editKeyboard, {
				length: this.editLen,
				folder: this.saveFolderName
			}).then(() => {
				this.errorMessage = '@' + this.translate.instant('afterworks.successSave');
				this.saveSuccessService.saveSuccess(this.saveFolderName, [{
					begin: 0,
					end: this.editLen,
					fileName: this.saveFileName
				}]);
				this.editing = false;
			}).catch((e) => {
				this.errorMessage = this.translate.instant('afterworks.errorSaving');
			});
		}).catch((e) => { })
	}

	editDropFile() {
		this.editFileName = '';
		this.errorMessage = '';
		this.editing = false;
	}

	recalculateEventList() {
		this.errorMessage = '';
		this.editing = true;
		for (let i = 0; i < this.eventList.length; i++) {
			this.eventList[i].name = '';
			this.eventList[i].type = '';
			this.eventList[i].key = this.eventList[i].key.toUpperCase();

			for (let j = 0; j < this.editKeyboard.length; j++) {
				if (this.eventList[i].key == this.editKeyboard[j].key) {
					this.eventList[i].name = this.editKeyboard[j].name;
					this.eventList[i].type = this.editKeyboard[j].type;
					break;
				}
			}
			if (this.eventList[i].name == '') {
				this.removeFromEventList(i);
				this.errorMessage = this.translate.instant('afterworks.edit.unknownKey');
				return;
			}

			if (this.eventList[i].time == '' || this.eventList[i].time < 0 || this.eventList[i].time > this.editLen) {
				this.removeFromEventList(i);
				this.errorMessage = this.translate.instant('afterworks.edit.timeRangeError', { len: this.editLen });
				return;
			}

			if (this.editIdents.indexOf(this.eventList[i].ident) == -1) {
				this.removeFromEventList(i);
				this.errorMessage = this.translate.instant('afterworks.unknownIdentifier');
				return;
			}
		}

		this.eventList.sort((a, b) => { return a.time > b.time ? 1 : a.time < b.time ? -1 : 0 });

		for (let i = 1; i < this.eventList.length; i++) {
			for (let j = i - 1; j >= 0; j--) {
				if (this.eventList[i].key == this.eventList[j].key && this.eventList[i].type == 'i' && this.eventList[i].ident == this.eventList[j].ident) {
					this.eventList.splice(j, 1);
					i--;
					break;
				}
				else if (this.eventList[j].type == 'i' && this.eventList[i].ident == this.eventList[j].ident) {
					break;
				}
			}
		}

		for (let i = 0; i < this.eventList.length; i++) {
			this.eventList[i].freq = 1;
			for (let j = 0; j < i; j++) {
				if (this.eventList[i].key == this.eventList[j].key && this.eventList[i].ident == this.eventList[j].ident) {
					this.eventList[i].freq++;
				}
			}
		}
	}

	removeFromEventList(i) {
		this.eventList.splice(i, 1);
		this.recalculateEventList();
	}

	addToEventList(i) {
		this.eventList.push({
			key: this.addEventListKey,
			time: this.addEventListTime,
			ident: this.addEventListIdent
		});
		this.recalculateEventList();

		this.addEventListKey = '';
		this.addEventListTime = 0;
		this.addEventListIdent = '';
	}

	saveShowFolder() {
		window.electron.shell.openItem(this.saveFolderName);
	}

	saveShowFile() {
		window.electron.shell.showItemInFolder(window.path.join(this.saveFolderName, this.saveFileName));
	}

	canLeave() {
		if (this.editing == true) {
			this.errorMessage = this.translate.instant('afterworks.editInProgress');
			return false;
		}
		return true;
	}
}
