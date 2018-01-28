import { Component, Input, Output, ViewChild, EventEmitter, NgZone } from '@angular/core';
import { OpenFileService } from './../../dialogs/openFile.service';
import { ExportFileService } from './../../dialogs/exportFile.service';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';

declare var window :any;

@Component({
	moduleId: module.id,
	selector: 'app-clip',
	templateUrl: './clip.component.html',
	styleUrls: ['./clip.component.css']
})
export class ClipComponent {
	@ViewChild('importFile') importFile;
	@ViewChild('saveSuccess') saveSuccess;
	@ViewChild('confirm') confirm;

	Arr = Array;

	errorMessage = '';
	editing = false;

	clipFileName = '';
	clipFrom = 0;
	clipTo = 0;
	clipLen = 0;
	clipKeyboard :any = [];
	clipData :any = [];
	clipFileType = 'xlsx';

	openFileName = '';
	openSheets :any = [];
	openSheet = '';
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
		this.openFileService.openFile([
			{name: 'Mérés fájlok', extensions: ['xlsx', 'ods']},
			{name: 'Minden fájl', extensions: ['*']}
		], ['openFile']).then((name :any) => {
			this.clipFileName = name;
			this.openFileName = name;
			this.exportFileService.importSheetNames(name).then((sheetNames :any) => {
				this.openSheets = sheetNames;
				this.openSheet = sheetNames.indexOf('Eseménylista') == -1 ? sheetNames[0] : 'Eseménylista';
				this.openRow = 2;
				this.openID = 'A';
				this.openKey = 'B';
				this.openName = 'C';
				this.openType = 'D';
				this.openFreq = 'E';
				this.openTime = 'F';
				this.openIdent = 'G';
				this.openLength = 'J1';
				this.openKeyboard = sheetNames.indexOf('Események') == -1 ? sheetNames[0] : 'Események';
				this.openKeyboardRow = 2;
				this.openKeyboardKey = 'A';
				this.openKeyboardName = 'B';
				this.openKeyboardType = 'C';

				this.modalService.open(this.importFile).result.then(() => {
					this.exportFileService.importFile(name, {
						sheet: this.openSheet,
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
					}).then((data :any) => {
						this.clipFileName = name;
						this.clipLen = data.length;
						this.clipKeyboard = data.keyboard;
						this.clipData = data.data;

						this.clipFrom = 0;
						this.clipTo = data.length;
					}).catch((e) => {
						this.errorMessage = 'Hiba az importálás során: hibás fájlformátum';
						this.clipFileName = '';
					})
				}).catch((e) => {
					this.clipFileName = '';
				});
			}).catch((e) => {
				this.errorMessage = 'Hiba az importálás során: nem megnyitható a fájl';
				this.clipFileName = '';
			})
		}).catch((e) => {
			this.clipFileName = '';
		});
	}

	clipSaveFile() {
		this.errorMessage = '';
		this.saveFolderName = '';

		if(this.clipFrom < 0 || this.clipFrom > this.clipLen || this.clipFrom > this.clipTo) {
			this.errorMessage = 'A kezdetnek egy pozitív számnak kell lennie, ami kisebb mint a kísérlet hossza (' + this.clipLen + ' mp) és a vég (' + this.clipTo + ' mp)';
			return;
		}
		else if(this.clipTo < 0 || this.clipTo > this.clipLen) {
			this.errorMessage = 'A végnek egy pozitív számnak kell lennie, ami kisebb mint a kísérlet hossza (' + this.clipLen + ' mp) és nagyobb mint a kezdet (' + this.clipFrom + ' mp)';
			return;
		}

		var filters = [];
		if(this.clipFileType == 'xlsx') {
			filters.push({name: 'Excel', extensions: ['xlsx']});
			filters.push({name: 'Libre Office', extensions: ['ods']});
			filters.push({name: 'Nyers', extensions: ['csv']});
		}
		else if(this.clipFileType == 'ods') {
			filters.push({name: 'Libre Office', extensions: ['ods']});
			filters.push({name: 'Excel', extensions: ['xlsx']});
			filters.push({name: 'Nyers', extensions: ['csv']});
		}
		else if(this.clipFileType == 'csv') {
			filters.push({name: 'Nyers', extensions: ['csv']});
			filters.push({name: 'Excel', extensions: ['xlsx']});
			filters.push({name: 'Libre Office', extensions: ['ods']});
		}
		else {
			return;
		}

		this.openFileService.saveFile(filters).then((fileName :any) => {
			var path = window.path.parse(fileName);
			this.saveFileName = path.base;
			this.saveFolderName = path.dir;

			var data = [];
			var interval = {};
			for(var j = 0; j < this.clipData.length; j++) interval[this.clipData[j].ident] = false;

			for(var j = 0; j < this.clipData.length; j++) {
				if((this.clipData[j].time >= this.clipFrom && this.clipData[j].time < this.clipTo) || (j == this.clipData.length - 1 && this.clipData[j].time == this.clipTo)) {
					var obj = Object.create(this.clipData[j]);
					obj.time -= this.clipFrom;
					data.push(obj);
				}
				else if(interval[this.clipData[j].ident] == false && this.clipData[j].time >= this.clipTo && this.clipData[j].type == 'i') {
					interval[this.clipData[j].ident] = true;
					var obj = Object.create(this.clipData[j]);
					obj.time = this.clipTo;
					data.push(obj);
				}
			}

			this.exportFileService.exportFile(path.name, this.clipFileType, data, this.clipKeyboard, {
				length: this.clipTo-this.clipFrom,
				folder: this.saveFolderName
			}).then(() => {
				this.errorMessage = '@Sikeres mentés';
				this.modalService.open(this.saveSuccess);
				this.editing = false;
			}).catch((e) => {
				this.errorMessage = 'Hiba a mentés folyamán';
			});
		}).catch((e) => {})
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
		if(this.editing == true) {
			this.errorMessage = 'Szerkesztés folyamatban, nem lehet kilépni mentés vagy elvetés előtt';
			return false;
		}
		return true;
	}
}
