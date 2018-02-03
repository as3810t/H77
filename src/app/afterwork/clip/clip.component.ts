import { Component, NgZone } from '@angular/core';
import { OpenFileService } from './../../dialogs/openFile.service';
import { ExportFileService } from './../../dialogs/exportFile.service';
import { ImportService } from './../../dialogs/import/import.service';
import { SaveSuccessService } from './../../dialogs/saveSuccess/saveSuccess.service';
import { TranslateService } from '@ngx-translate/core';

declare var window: any;

@Component({
	moduleId: module.id,
	selector: 'app-clip',
	templateUrl: './clip.component.html',
	styleUrls: ['./clip.component.css']
})
export class ClipComponent {
	Arr = Array;

	errorMessage = '';
	editing = false;

	clipFileName = '';
	clipFrom = 0;
	clipTo = 0;
	clipLen = 0;
	clipKeyboard: any = [];
	clipData: any = [];
	clipFileType = 'xlsx';

	saveFileName = '';
	saveFolderName = '';

	constructor(
		private openFileService: OpenFileService,
		private exportFileService: ExportFileService,
		private importService: ImportService,
		private successSaveService: SaveSuccessService,
		private translate: TranslateService,
		private ngzone: NgZone
	) {
		const ipcRenderer = window.electron.ipcRenderer;

		ipcRenderer.on('clipFile', () => {
			this.ngzone.run(() => {
				this.clipOpenFile();
			});
		});
	}

	ngOnInit() {

	}

	clipOpenFile() {
		this.errorMessage = '';
		this.importService.importDialog().then((imp: any) => {
			this.clipLen = imp.measurementLength;
			this.clipFrom = 0;
			this.clipTo = this.clipLen;
			this.clipKeyboard = imp.keyboard;
			this.clipData = imp.data[0];
			this.clipFileName = imp.files[0];
		}).catch((e) => {
			if (e) this.errorMessage = e;
		});
	}

	clipSaveFile() {
		this.errorMessage = '';
		this.saveFolderName = '';

		if (this.clipFrom < 0 || this.clipFrom > this.clipLen || this.clipFrom > this.clipTo) {
			this.errorMessage = this.translate.instant('afterworks.clip.rangeBeginError', { len: this.clipLen, end: this.clipTo });
			return;
		}
		else if (this.clipTo < 0 || this.clipTo > this.clipLen) {
			this.errorMessage = this.translate.instant('afterworks.clip.rangeEndError', { len: this.clipLen, begin: this.clipFrom });
			return;
		}

		var filters = [];
		if (this.clipFileType == 'xlsx') {
			filters.push({ name: this.translate.instant('analysis.excel'), extensions: ['xlsx'] });
			filters.push({ name: this.translate.instant('analysis.libreoffice'), extensions: ['ods'] });
			filters.push({ name: this.translate.instant('analysis.raw'), extensions: ['csv'] });
		}
		else if (this.clipFileType == 'ods') {
			filters.push({ name: this.translate.instant('analysis.libreoffice'), extensions: ['ods'] });
			filters.push({ name: this.translate.instant('analysis.excel'), extensions: ['xlsx'] });
			filters.push({ name: this.translate.instant('analysis.raw'), extensions: ['csv'] });
		}
		else if (this.clipFileType == 'csv') {
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

			var data = [];
			var interval = {};
			for (var j = 0; j < this.clipData.length; j++) interval[this.clipData[j].ident] = false;

			for (var j = 0; j < this.clipData.length; j++) {
				if ((this.clipData[j].time >= this.clipFrom && this.clipData[j].time < this.clipTo) || (j == this.clipData.length - 1 && this.clipData[j].time == this.clipTo)) {
					var obj = Object.create(this.clipData[j]);
					obj.time -= this.clipFrom;
					data.push(obj);
				}
				else if (interval[this.clipData[j].ident] == false && this.clipData[j].time >= this.clipTo && this.clipData[j].type == 'i') {
					interval[this.clipData[j].ident] = true;
					var obj = Object.create(this.clipData[j]);
					obj.time = this.clipTo;
					data.push(obj);
				}
			}

			this.exportFileService.exportFile(path.name, this.clipFileType, data, this.clipKeyboard, {
				length: this.clipTo - this.clipFrom,
				folder: this.saveFolderName
			}).then(() => {
				this.errorMessage = '@' + this.translate.instant('afterworks.successSave');
				this.successSaveService.saveSuccess(this.saveFolderName, [{
					begin: this.clipFrom,
					end: this.clipTo,
					fileName: this.saveFileName
				}]);
				this.editing = false;
			}).catch((e) => {
				this.errorMessage = this.translate.instant('afterworks.errorSaving');
			});
		}).catch((e) => { })
	}

	clipDropFile() {
		this.clipFileName = '';
		this.errorMessage = '';
		this.editing = false;
	}

	clipChange() {
		this.editing = true;
		this.errorMessage = '';
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
