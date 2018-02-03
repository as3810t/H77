import { Component, Input, Output, ViewChild, EventEmitter, NgZone } from '@angular/core';
import { OpenFileService } from './../../dialogs/openFile.service';
import { ExportFileService } from './../../dialogs/exportFile.service';
import { ImportService } from './../../dialogs/import/import.service';
import { SaveSuccessService } from './../../dialogs/saveSuccess/saveSuccess.service';
import { TranslateService } from '@ngx-translate/core';

declare var window: any;

@Component({
	moduleId: module.id,
	selector: 'app-split',
	templateUrl: './split.component.html',
	styleUrls: ['./split.component.css']
})
export class SplitComponent {
	Arr = Array;

	errorMessage = '';
	editing = false;

	splitFileName = '';
	splitLength = 0;
	splitNum = 0;
	splitLen = 0;
	splitKeyboard: any = [];
	splitData: any = [];
	splitFileType = 'xlsx';

	saveFolderName = '';
	saveFiles: any = [];

	constructor(
		private openFileService: OpenFileService,
		private exportFileService: ExportFileService,
		private importService: ImportService,
		private saveSuccessService: SaveSuccessService,
		private translate: TranslateService,
		private ngzone: NgZone
	) {
		const ipcRenderer = window.electron.ipcRenderer;

		ipcRenderer.on('splitFile', () => {
			this.ngzone.run(() => {
				this.splitOpenFile();
			});
		});
	}

	ngOnInit() {

	}

	splitOpenFile() {
		this.errorMessage = '';
		this.importService.importDialog().then((imp: any) => {
			this.splitLen = imp.measurementLength;
			this.splitNum = 1;
			this.splitLength = this.splitLen;
			this.splitKeyboard = imp.keyboard;
			this.splitData = imp.data[0];
			this.splitFileName = imp.files[0];
		}).catch((e) => {
			if (e) this.errorMessage = e;
		});
	}

	splitSaveFile() {
		this.errorMessage = '';
		this.saveFiles = [];
		this.saveFolderName = '';

		if (this.splitNum < 1 || parseInt(<any>this.splitNum) != this.splitNum) {
			this.errorMessage = this.translate.instant('afterworks.split.piecesRangeError');
			return;
		}
		else if (this.splitLength <= 0 || this.splitLength > this.splitLen) {
			this.errorMessage = this.translate.instant('afterworks.split.lengthRangeError', { len: this.splitLen });
			return;
		}

		this.openFileService.openFile([], ['openDirectory']).then((folder: any) => {
			var path = window.path.parse(this.splitFileName);
			var promises = [];
			this.saveFolderName = folder;

			var override = undefined;
			for (let i = 0; i < this.splitNum; i++) {
				if (window.fs.existsSync(window.path.join(folder, path.name + '_' + i + '.' + this.splitFileType))) {
					override = this.openFileService.overrideDialog();
					break;
				}
			}
			if (override == false) return;

			for (let i = 0; i < this.splitNum; i++) {
				var begin = i * this.splitLength;
				var end = (i == this.splitNum - 1 ? this.splitLen : (i + 1) * this.splitLength);

				var data = [];
				var interval = {};
				for (var j = 0; j < this.splitData.length; j++) interval[this.splitData[j].ident] = false;

				for (var j = 0; j < this.splitData.length; j++) {
					if ((this.splitData[j].time >= begin && this.splitData[j].time < end) || (j == this.splitData.length - 1 && this.splitData[j].time == end)) {
						var obj = Object.create(this.splitData[j]);
						obj.time -= begin;
						data.push(obj);
					}
					else if (interval[this.splitData[j].ident] == false && this.splitData[j].time >= end && this.splitData[j].type == 'i') {
						interval[this.splitData[j].ident] = true;
						var obj = Object.create(this.splitData[j]);
						obj.time = end;
						data.push(obj);
					}
				}

				promises.push(this.exportFileService.exportFile(path.name + '_' + i, this.splitFileType, data, this.splitKeyboard, {
					length: end - begin,
					folder: folder
				}));

				this.saveFiles.push({
					begin: begin,
					end: end,
					fileName: path.name + '_' + i + '.' + this.splitFileType
				});
			}

			Promise.all(promises).then(() => {
				this.errorMessage = '@' + this.translate.instant('afterworks.successSave');
				this.saveSuccessService.saveSuccess(this.saveFolderName, this.saveFiles);
				this.editing = false;
			}).catch((e) => {
				console.log(e);
				this.errorMessage = this.translate.instant('afterworks.errorSaving');
			});
		}).catch((e) => { })
	}

	splitDropFile() {
		this.splitFileName = '';
		this.errorMessage = '';
		this.editing = false;
	}

	splitLengthChange() {
		this.splitNum = Math.ceil(this.splitLen / this.splitLength);
		this.errorMessage = '';
		this.editing = true;
	}

	splitNumChange() {
		this.splitLength = this.splitLen / this.splitNum;
		this.errorMessage = '';
		this.editing = true;
	}

	saveShowFolder() {
		window.electron.shell.openItem(this.saveFolderName);
	}

	saveShowFile(file) {
		window.electron.shell.showItemInFolder(window.path.join(this.saveFolderName, file));
	}

	canLeave() {
		if (this.editing == true) {
			this.errorMessage = this.translate.instant('afterworks.editInProgress');
			return false;
		}
		return true;
	}
}
