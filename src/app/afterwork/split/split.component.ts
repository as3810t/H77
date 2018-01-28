import { Component, Input, Output, ViewChild, EventEmitter, NgZone } from '@angular/core';
import { OpenFileService } from './../../dialogs/openFile.service';
import { ExportFileService } from './../../dialogs/exportFile.service';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';

declare var window :any;

@Component({
	moduleId: module.id,
	selector: 'app-split',
	templateUrl: './split.component.html',
	styleUrls: ['./split.component.css']
})
export class SplitComponent {
	@ViewChild('importFile') importFile;
	@ViewChild('saveSuccess') saveSuccess;
	@ViewChild('confirm') confirm;

	Arr = Array;

	errorMessage = '';
	editing = false;

	splitFileName = '';
	splitLength = 0;
	splitNum = 0;
	splitLen = 0;
	splitKeyboard :any = [];
	splitData :any = [];
	splitFileType = 'xlsx';

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

	saveFolderName = '';
	saveFiles :any = [];

	constructor(
		private openFileService :OpenFileService,
		private exportFileService :ExportFileService,
		private modalService :NgbModal,
		private ngzone :NgZone
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
		this.openFileService.openFile([
			{name: 'Mérés fájlok', extensions: ['xlsx', 'ods']},
			{name: 'Minden fájl', extensions: ['*']}
		], ['openFile']).then((name :any) => {
			this.splitFileName = name;
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
						this.splitFileName = name;
						this.splitLen = data.length;
						this.splitKeyboard = data.keyboard;
						this.splitData = data.data;

						this.splitLength = data.length;
						this.splitNum = 1;
					}).catch((e) => {
						this.errorMessage = 'Hiba az importálás során: hibás fájlformátum';
						this.splitFileName = '';
					})
				}).catch((e) => {
					this.splitFileName = '';
				});
			}).catch((e) => {
				this.errorMessage = 'Hiba az importálás során: nem megnyitható a fájl';
				this.splitFileName = '';
			})
		}).catch((e) => {
			this.splitFileName = '';
		});
	}

	splitSaveFile() {
		this.errorMessage = '';
		this.saveFiles = [];
		this.saveFolderName = '';

		if(this.splitNum < 1 || parseInt(<any>this.splitNum) != this.splitNum) {
			this.errorMessage = 'A darabszámnak egy pozitív egész számnak kell lennie';
			return;
		}
		else if(this.splitLength <= 0 || this.splitLength > this.splitLen) {
			this.errorMessage = 'A hossznak 0 és a mérés hossza (' + this.splitLen + ' mp) közé kell esnie';
			return;
		}

		this.openFileService.openFile([], ['openDirectory']).then((folder :any) => {
			var path = window.path.parse(this.splitFileName);
			var promises = [];
			this.saveFolderName = folder;

			var override = undefined;
			for(let i = 0; i < this.splitNum; i++) {
				if(window.fs.existsSync(window.path.join(folder, path.name+'_'+i+'.'+this.splitFileType))) {
					override = this.openFileService.showDialog({
						type: 'question',
						buttons: ['Mégse', 'Felülírás'],
						defaultId: 0,
						title: 'Megerősítés',
						message: 'A megadott nevű fájl már létezik. Biztos felülírja?',
						cancelId: 0
					}) == 1;
					break;
				}
			}
			if(override == false) return;

			for(let i = 0; i < this.splitNum; i++) {
				var begin = i * this.splitLength;
				var end = (i == this.splitNum - 1 ? this.splitLen : (i+1) * this.splitLength);

				var data = [];
				var interval = {};
				for(var j = 0; j < this.splitData.length; j++) interval[this.splitData[j].ident] = false;

				for(var j = 0; j < this.splitData.length; j++) {
					if((this.splitData[j].time >= begin && this.splitData[j].time < end) || (j == this.splitData.length - 1 && this.splitData[j].time == end)) {
						var obj = Object.create(this.splitData[j]);
						obj.time -= begin;
						data.push(obj);
					}
					else if(interval[this.splitData[j].ident] == false && this.splitData[j].time >= end && this.splitData[j].type == 'i') {
						interval[this.splitData[j].ident] = true;
						var obj = Object.create(this.splitData[j]);
						obj.time = end;
						data.push(obj);
					}
				}

				promises.push(this.exportFileService.exportFile(path.name+'_'+i, this.splitFileType, data, this.splitKeyboard, {
					length: end-begin,
					folder: folder
				}));

				this.saveFiles.push({
					begin: begin,
					end: end,
					fileName: path.name+'_'+i+'.'+this.splitFileType
				});
			}

			Promise.all(promises).then(() => {
				this.errorMessage = '@Sikeres mentés';
				this.modalService.open(this.saveSuccess);
				this.editing = false;
			}).catch((e) => {
				console.log(e);
				this.errorMessage = 'Hiba a mentés folyamán';
			});
		}).catch((e) => {})
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
		if(this.editing == true) {
			this.errorMessage = 'Szerkesztés folyamatban, nem lehet kilépni mentés vagy elvetés előtt';
			return false;
		}
		return true;
	}
}
