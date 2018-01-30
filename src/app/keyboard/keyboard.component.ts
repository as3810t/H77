import { Component, Output, EventEmitter, NgZone } from '@angular/core';
import { OpenFileService } from './../dialogs/openFile.service';
import { TranslateService } from '@ngx-translate/core';

declare var localStorage: any;
declare var window: any;

@Component({
	moduleId: module.id,
	selector: 'app-keyboard',
	templateUrl: './keyboard.component.html',
	styleUrls: ['./keyboard.component.css']
})
export class KeyboardComponent {
	keyboard: any = []
	errorMessage = '';
	saveFile: any = '';
	saved = true;

	recents = [];

	@Output() keyboardChange = new EventEmitter();

	constructor(
		private openFileService: OpenFileService,
		private ngzone: NgZone,
		private translate: TranslateService
	) {
		const ipcRenderer = window.electron.ipcRenderer;

		ipcRenderer.on('createKeyboardFile', () => {
			this.ngzone.run(() => {
				this.createNewBoard();
			});
		});
		ipcRenderer.on('openKeyboardFile', () => {
			this.ngzone.run(() => {
				this.openFileDialog();
			});
		});
		ipcRenderer.on('saveKeyboardFile', () => {
			this.ngzone.run(() => {
				if (this.keyboard == undefined || this.keyboard.length == 0) this.errorMessage = this.translate.instant('keyboard.nothingToSave');
				else this.saveBoard();
			});
		});
		ipcRenderer.on('saveAsKeyboardFile', () => {
			this.ngzone.run(() => {
				if (this.keyboard == undefined || this.keyboard.length == 0) this.errorMessage = this.translate.instant('keyboard.nothingToSave');
				else this.saveBoardAs();
			});
		});
	}

	ngOnInit() {
		try {
			this.recents = JSON.parse(localStorage.getItem('keyboard_recents') || '[]');
		}
		catch (e) {
			this.recents = [];
		}

		var self = this;

		this.keyboard = new Proxy([], {
			get: (target, property) => {
				return target[property];
			},
			set: (target, property, value) => {
				target[property] = value;
				self.saved = false;
				self.keyboardChange.emit(target);
				return true;
			}
		});
	}

	createNewBoard() {
		this.errorMessage = '';

		for (; 0 < this.keyboard.length;) {
			this.keyboard.pop();
		}

		this.keyboard.name = this.translate.instant('keyboard.newFile');
		this.saveFile = '---NEW---';
		this.saved = true;
	}

	openFileDialog() {
		this.errorMessage = '';
		this.openFileService.openFile([
			{ name: this.translate.instant('keyboard.keyFile'), extensions: ['h77.kbd'] },
			{ name: this.translate.instant('keyboard.allFiles'), extensions: ['*'] }
		], ['openFile']).then((name) => {
			this.openFile(name);
		}).catch(() => { });
	}

	checkBoard(board) {
		if (board instanceof Array == false) {
			throw this.translate.instant('keyboard.corruptedFile');
		}
		for (var i = 0; i < board.length; i++) {
			if (board[i].key == undefined || board[i].name == undefined || (board[i].type != 'i' && board[i].type != 'e')) {
				throw this.translate.instant('keyboard.corruptedFile');
			}
			else if (/^[a-z0-9]+$/i.test(board[i].key) == false) {
				throw this.translate.instant('keyboard.corruptedKey');
			}
			else if (board[i].key == '') {
				throw this.translate.instant('keyboard.missingKey');
			}
			else if (board[i].name == '') {
				throw this.translate.instant('keyboard.missingName');
			}
		}

		return true;
	}

	openFile(name) {
		this.errorMessage = '';
		try {
			if (window.fs.existsSync(name)) {
				var file = window.fs.readFileSync(name);

				try {
					var board = JSON.parse(file.toString());
				}
				catch (e) { throw this.translate.instant('keyboard.corruptedFile'); }

				this.checkBoard(board);

				for (; 0 < this.keyboard.length;) {
					this.keyboard.pop();
				}
				for (var i = 0; i < board.length; i++) {
					this.keyboard.push(board[i]);
				}

				this.keyboard.name = window.path.parse(name).name;
				this.saveFile = name;
				this.saved = true;

				let obj = { path: name, filename: window.path.parse(name).name };
				if (this.recents.find((e) => { return e.filename == obj.filename && e.path == obj.path }) === undefined) {
					if (this.recents.length > 10) this.recents.unshift();
					this.recents.push(obj);
				}

				localStorage.setItem('keyboard_recents', JSON.stringify(this.recents));
			}
			else {
				this.errorMessage = this.translate.instant('keyboard.fileNotExists');
				this.saveFile = '';
			}
		}
		catch (e) {
			if (e) this.errorMessage = e;
			else this.errorMessage = this.translate.instant('keyboard.fileNotExists');
			this.saveFile = '';
		}
	}

	saveBoard() {
		this.exportFile(this.saveFile);
	}

	saveBoardAs() {
		this.errorMessage = '';
		this.openFileService.saveFile([
			{ name: this.translate.instant('keyboard.keyFile'), extensions: ['h77.kbd'] },
			{ name: this.translate.instant('keyboard.allFiles'), extensions: ['*'] }
		]).then((fileName) => {
			this.exportFile(fileName);
		}).catch(() => { })
	}

	exportFile(saveFile) {
		try {
			this.errorMessage = '';
			if (this.checkBoard(this.keyboard)) {
				var promise;
				if (saveFile == '---NEW---') {
					promise = this.openFileService.saveFile([
						{ name: this.translate.instant('keyboard.keyFile'), extensions: ['h77.kbd'] },
						{ name: this.translate.instant('keyboard.allFiles'), extensions: ['*'] }
					]).then((name) => {
						this.saveFile = name;
						this.keyboard.name = window.path.parse(name).name;
						return Promise.resolve();
					})
				}
				else {
					promise = Promise.resolve();
					this.saveFile = saveFile;
					this.keyboard.name = window.path.parse(saveFile).name;
				}

				promise.then(() => {
					window.fs.writeFileSync(this.saveFile, JSON.stringify(this.keyboard));
					this.errorMessage = '@' + this.translate.instant('keyboard.successSave');

					this.saved = true;

					let obj = { path: this.saveFile, filename: window.path.parse(this.saveFile).name };
					if (this.recents.find((e) => { return e.filename == obj.filename && e.path == obj.path }) === undefined) {
						if (this.recents.length > 10) this.recents.unshift();
						this.recents.push(obj);
					}

					localStorage.setItem('keyboard_recents', JSON.stringify(this.recents));
				}).catch((e) => {
					if (e) this.errorMessage = this.translate.instant('keyboard.saveFileNotWritable');
				});
			}
		}
		catch (e) {
			this.errorMessage = e;
		}
	}

	restoreBoard() {
		if (this.saveFile == '---NEW---') this.createNewBoard();
		else this.openFile(this.saveFile);
	}

	addKey() {
		this.keyboard.push({
			key: '',
			name: '',
			type: 'i'
		});
	}

	removeKey(i) {
		this.keyboard.splice(i, 1);
	}

	keyChange() {
		for (var i = 0; i < this.keyboard.length; i++) {
			this.keyboard[i].key = /^[a-z0-9]$/i.test(this.keyboard[i].key) ? this.keyboard[i].key.toUpperCase() : '';
		}
	}

	canLeave() {
		this.errorMessage = '';
		if (this.saveFile == '') return true;
		try {
			this.checkBoard(this.keyboard);
			return true;
		}
		catch (e) {
			this.errorMessage = e;
			return false;
		}
	}

	canClose() {
		return this.saved;
	}
}
