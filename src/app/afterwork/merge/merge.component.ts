import { Component, Input, Output, ViewChild, EventEmitter, NgZone } from '@angular/core';
import { OpenFileService } from './../../dialogs/openFile.service';
import { ExportFileService } from './../../dialogs/exportFile.service';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';

declare var window :any;

@Component({
	moduleId: module.id,
	selector: 'app-merge',
	templateUrl: './merge.component.html',
	styleUrls: ['./merge.component.css']
})
export class MergeComponent {
	@ViewChild('importFile') importFile;
	@ViewChild('saveSuccess') saveSuccess;
	@ViewChild('confirm') confirm;

	Arr = Array;

	errorMessage = '';

	mergeFileNames :any = [];
	mergeLen = 0;
	mergeKeyboard :any = [];
	mergeData :any = [];
	mergeFileType = 'xlsx';

	openFileNames :any = [];
	openSheets :any = [];
	openSheet :any = [];
	openRow = 2;
	openID = 'A';
	openKey = 'B';
	openName = 'C';
	openType = 'D';
	openFreq = 'E';
	openTime = 'F';
	openIdent = 'G';
	openLength = 'J1';
	openKeyboard = '';
	openKeyboardRow = 2;
	openKeyboardKey = 'A';
	openKeyboardName = 'B';
	openKeyboardType = 'C';

	saveFileName = '';
	saveFolderName = '';

	constructor(
		private openFileService :OpenFileService,
		private exportFileService :ExportFileService,
		private modalService :NgbModal,
		private ngzone :NgZone
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
		this.openFileService.openFile([
			{name: 'Mérés fájlok', extensions: ['xlsx', 'ods']},
			{name: 'Minden fájl', extensions: ['*']}
		], ['openFile', 'multiSelections']).then((names :any) => {
			this.mergeFileNames = names;
			this.openFileNames = names.map((e) => {return window.path.parse(e).name});

			var sheetNamesPromises = [];
			for(let i = 0; i < names.length; i++) {
				sheetNamesPromises.push(this.exportFileService.importSheetNames(names[i]));
			}

			Promise.all(sheetNamesPromises).then((sheetNames) => {
				this.openSheets = sheetNames;
				this.openSheet = [];
				for(let i = 0; i < sheetNames.length; i++) {
					this.openSheet[i] = sheetNames[i].indexOf('Eseménylista') == -1 ? sheetNames[i][0] : 'Eseménylista';
				}

				this.openRow = 2;
				this.openID = 'A';
				this.openKey = 'B';
				this.openName = 'C';
				this.openType = 'D';
				this.openFreq = 'E';
				this.openTime = 'F';
				this.openIdent = 'G';
				this.openLength = 'J1';
				this.openKeyboard = sheetNames[0].indexOf('Események') == -1 ? sheetNames[0][0] : 'Események';
				this.openKeyboardRow = 2;
				this.openKeyboardKey = 'A';
				this.openKeyboardName = 'B';
				this.openKeyboardType = 'C';

				this.modalService.open(this.importFile).result.then(() => {
					var importFilePromises = [];
					for(let i = 0; i < sheetNames.length; i++) {
						importFilePromises.push(this.exportFileService.importFile(this.mergeFileNames[i], {
							sheet: this.openSheet[i],
							row: this.openRow,
							ID: this.openID,
							key: this.openKey,
							name: this.openName,
							type: this.openType,
							freq: this.openFreq,
							time: this.openTime,
							ident: this.openIdent,
							length: this.openLength,
							keyboard: this.openKeyboard,
							keyboardRow: this.openKeyboardRow,
							keyboardKey: this.openKeyboardKey,
							keyboardName: this.openKeyboardName,
							keyboardType: this.openKeyboardType
						}))
					}

					Promise.all(importFilePromises).then((datas) => {
						this.mergeLen = datas[0].length;
						for(let i = 1; i < datas.length; i++) {
							if(this.mergeLen != datas[i].length) {
								this.errorMessage = 'Az importált kísérletek hossza nem egyezik meg';
								return;
							}
						}

						for(let i = 0; i < datas.length; i++) {
							for(let j = 0; j < i; j++) {
								var haystack = datas[j].keyboard.map((e) => {return e.key + '|' + e.name + '|' + e.type});
								for(let k = 0; k < datas[i].keyboard.length; k++) {
									var needle = datas[i].keyboard[k].key + '|' + datas[i].keyboard[k].name + '|' + datas[i].keyboard[k].type;
									if(haystack.indexOf(needle) == -1) {
										this.errorMessage = 'Az importált mérések billentyű adatai nem egyeznek meg';
										return;
									}
								}
							}
						}

						this.mergeKeyboard = datas[0].keyboard;
						this.mergeData = datas.map((e) => {return e.data});
						this.mergeSaveFile();
					}).catch((e) => {
						console.log(e);
						this.errorMessage = 'Hiba az importálás során: hibás fájlformátum';
					})
				}).catch((e) => {})
			}).catch((e) => {
				this.errorMessage = 'Hiba az importálás során: nem megnyitható a fájl';
			});
		}).catch((e) => {});
	}

	mergeSaveFile() {
		this.errorMessage = '';

		this.openFileService.saveFile([
			{name: 'Excel', extensions: ['xlsx']},
			{name: 'Libre Office', extensions: ['ods']},
			{name: 'Nyers', extensions: ['csv']}
		]).then((fileName :any) => {
			var path = window.path.parse(fileName);
			this.saveFileName = path.base;
			this.saveFolderName = path.dir;

			var data = [];
			for(let i = 0; i < this.mergeData.length; i++) {
				data = data.concat(this.mergeData[i]);
			}
			data = data.sort((a, b) => {return a.time > b.time ? 1 : a.time < b.time ? -1 : 0;});

			this.exportFileService.exportFile(path.name, path.ext.slice(1), data, this.mergeKeyboard, {
				length: this.mergeLen,
				folder: this.saveFolderName
			}).then(() => {
				this.errorMessage = '@Sikeres mentés';
				this.modalService.open(this.saveSuccess);
			}).catch((e) => {
				this.errorMessage = 'Hiba a mentés folyamán';
			});
		}).catch((e) => {})
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
