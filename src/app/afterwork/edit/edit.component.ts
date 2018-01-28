import { Component, Input, Output, ViewChild, EventEmitter, NgZone } from '@angular/core';
import { OpenFileService } from './../../dialogs/openFile.service';
import { ExportFileService } from './../../dialogs/exportFile.service';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';

declare var window :any;

@Component({
	moduleId: module.id,
	selector: 'app-edit',
	templateUrl: './edit.component.html',
	styleUrls: ['./edit.component.css']
})
export class EditComponent {
	@ViewChild('importFile') importFile;
	@ViewChild('saveSuccess') saveSuccess;
	@ViewChild('confirm') confirm;

	Arr = Array;

	errorMessage = '';
	editing = false;

	editFileName = '';
	editLen = 0;
	editIdent = '';
	editIdents :any = [];
	editKeyboard :any = [];
	editFileType = 'xlsx';

	eventList :any = [];
	addEventListKey = '';
	addEventListTime = 0;
	addEventListIdent = '';

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
		this.openFileService.openFile([
			{name: 'Mérés fájlok', extensions: ['xlsx', 'ods']},
			{name: 'Minden fájl', extensions: ['*']}
		], ['openFile']).then((name :any) => {
			this.editFileName = name;
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
						this.editFileName = name;
						this.editLen = data.length;
						this.editKeyboard = data.keyboard;
						this.eventList = data.data;

						this.editIdent = '*';
						this.editIdents = [];
						for(let i = 0; i < this.eventList.length; i++) {
							if(this.editIdents.indexOf(this.eventList[i].ident) == -1) this.editIdents.push(this.eventList[i].ident);
						}
					}).catch((e) => {
						this.errorMessage = 'Hiba az importálás során: hibás fájlformátum';
						this.editFileName = '';
					})
				}).catch((e) => {
					this.editFileName = '';
				});
			}).catch((e) => {
				this.errorMessage = 'Hiba az importálás során: nem megnyitható a fájl';
				this.editFileName = '';
			})
		}).catch((e) => {
			this.editFileName = '';
		});
	}

	editSaveFile() {
		this.errorMessage = '';
		this.saveFolderName = '';

		var filters = [];
		if(this.editFileType == 'xlsx') {
			filters.push({name: 'Excel', extensions: ['xlsx']});
			filters.push({name: 'Libre Office', extensions: ['ods']});
			filters.push({name: 'Nyers', extensions: ['csv']});
		}
		else if(this.editFileType == 'ods') {
			filters.push({name: 'Libre Office', extensions: ['ods']});
			filters.push({name: 'Excel', extensions: ['xlsx']});
			filters.push({name: 'Nyers', extensions: ['csv']});
		}
		else if(this.editFileType == 'csv') {
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

			this.exportFileService.exportFile(path.name, this.editFileType, this.eventList, this.editKeyboard, {
				length: this.editLen,
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

	editDropFile() {
		this.editFileName = '';
		this.errorMessage = '';
		this.editing = false;
	}

	recalculateEventList() {
		this.errorMessage = '';
		this.editing = true;
		for(let i = 0; i < this.eventList.length; i++) {
			this.eventList[i].name = '';
			this.eventList[i].type = '';
			this.eventList[i].key = this.eventList[i].key.toUpperCase();

			for(let j = 0; j < this.editKeyboard.length; j++) {
				if(this.eventList[i].key == this.editKeyboard[j].key) {
					this.eventList[i].name = this.editKeyboard[j].name;
					this.eventList[i].type = this.editKeyboard[j].type;
					break;
				}
			}
			if(this.eventList[i].name == '') {
				this.removeFromEventList(i);
				this.errorMessage = 'Nem létező billentyűkód';
				return;
			}

			if(this.eventList[i].time == '' || this.eventList[i].time < 0 || this.eventList[i].time > this.editLen) {
				this.removeFromEventList(i);
				this.errorMessage = 'Az idő egy pozitív szám, ami kisebb mint a mérés hossza (' + this.editLen + ' mp)';
				return;
			}

			if(this.editIdents.indexOf(this.eventList[i].ident) == -1) {
				this.removeFromEventList(i);
				this.errorMessage = 'Nem létező azonosító';
				return;
			}
		}

		this.eventList.sort((a, b) => {return a.time > b.time ? 1 : a.time < b.time ? -1 : 0});

		for(let i = 1; i < this.eventList.length; i++) {
			for(let j = i - 1; j >= 0; j--) {
				if(this.eventList[i].key == this.eventList[j].key && this.eventList[i].type == 'i' && this.eventList[i].ident == this.eventList[j].ident) {
					this.eventList.splice(j, 1);
					i--;
					break;
				}
				else if(this.eventList[j].type == 'i' && this.eventList[i].ident == this.eventList[j].ident) {
					break;
				}
			}
		}

		for(let i = 0; i < this.eventList.length; i++) {
			this.eventList[i].freq = 1;
			for(let j = 0; j < i; j++) {
				if(this.eventList[i].key == this.eventList[j].key && this.eventList[i].ident == this.eventList[j].ident) {
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
		if(this.editing == true) {
			this.errorMessage = 'Szerkesztés folyamatban, nem lehet kilépni mentés vagy elvetés előtt';
			return false;
		}
		return true;
	}
}
