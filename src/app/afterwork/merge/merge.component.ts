import { Component, ViewChild, NgZone } from '@angular/core';
import { OpenFileService } from './../../dialogs/openFile.service';
import { ExportFileService } from './../../dialogs/exportFile.service';
import { ImportService } from './../../dialogs/import/import.service';
import { SaveSuccessService } from './../../dialogs/saveSuccess/saveSuccess.service';
import { TranslateService } from '@ngx-translate/core';


declare var window: any;

@Component({
	moduleId: module.id,
	selector: 'app-merge',
	templateUrl: './merge.component.html',
	styleUrls: ['./merge.component.css']
})
export class MergeComponent {
	Arr = Array;

	errorMessage = '';

	mergeFileNames: any = [];
	mergeLen = 0;
	mergeKeyboard: any = [];
	mergeData: any = [];
	mergeFileType = 'xlsx';

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

		ipcRenderer.on('mergeFiles', () => {
			this.ngzone.run(() => {
				this.mergeOpenFile();
			});
		});
	}

	ngOnInit() {

	}

	mergeOpenFile() {
		this.errorMessage = '';
		this.importService.importDialog(true).then((imp: any) => {
			this.mergeLen = imp.measurementLength;
			this.mergeKeyboard = imp.keyboard;
			this.mergeData = imp.data;
			this.mergeFileNames = imp.files;
			this.mergeSaveFile();
		}).catch((e) => {
			if (e) this.errorMessage = e;
		});
	}

	mergeSaveFile() {
		this.errorMessage = '';

		this.openFileService.saveFile([
			{ name: 'Excel', extensions: ['xlsx'] },
			{ name: 'Libre Office', extensions: ['ods'] },
			{ name: 'Nyers', extensions: ['csv'] }
		]).then((fileName: any) => {
			var path = window.path.parse(fileName);
			this.saveFileName = path.base;
			this.saveFolderName = path.dir;

			var data = [];
			for (let i = 0; i < this.mergeData.length; i++) {
				data = data.concat(this.mergeData[i]);
			}
			data = data.sort((a, b) => { return a.time > b.time ? 1 : a.time < b.time ? -1 : 0; });

			this.exportFileService.exportFile(path.name, path.ext.slice(1), data, this.mergeKeyboard, {
				length: this.mergeLen,
				folder: this.saveFolderName
			}).then(() => {
				this.errorMessage = '@' + this.translate.instant('afterworks.successSave');
				this.saveSuccessService.saveSuccess(this.saveFolderName, [{
					begin: 0,
					end: this.mergeLen,
					fileName: this.saveFileName
				}]);
			}).catch((e) => {
				this.errorMessage = this.translate.instant('afterworks.errorSaving');
			});
		}).catch((e) => { })
	}

	saveShowFolder() {
		window.electron.shell.openItem(this.saveFolderName);
	}

	saveShowFile() {
		window.electron.shell.showItemInFolder(window.path.join(this.saveFolderName, this.saveFileName));
	}

	canLeave() {
		return true;
	}
}
