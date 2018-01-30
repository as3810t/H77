import { Component, Input, Output, EventEmitter, ApplicationRef, ViewChild, NgZone } from '@angular/core';
import { OpenFileService } from './../dialogs/openFile.service';
import { TranslateService } from '@ngx-translate/core';

declare var localStorage: any;
declare var window: any;

var MIME = {
	'.avi': 'video/avi',
	'.mp4': 'video/mp4',
	'.3gp': 'video/3gpp',
	'.mov': 'video/quicktime',
	'.ogv': 'video/ogg',
	'.webm': 'video/webm'
};

@Component({
	moduleId: module.id,
	selector: 'app-settings',
	templateUrl: './settings.component.html',
	styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
	settings: any = {};
	errorMessage = '';
	saveFile: any = '';
	saved = true;

	recents = [];

	@ViewChild('player') player;

	@Output() settingsChange = new EventEmitter();

	constructor(
		private openFileService: OpenFileService,
		private applicationRef: ApplicationRef,
		private ngzone: NgZone,
		private translate: TranslateService
	) {
		const ipcRenderer = window.electron.ipcRenderer;

		ipcRenderer.on('createSettingsFile', () => {
			this.ngzone.run(() => {
				this.createNewSettings();
			});
		});
		ipcRenderer.on('openSettingsFile', () => {
			this.ngzone.run(() => {
				this.openFileDialog();
			});
		});
		ipcRenderer.on('saveSettingsFile', () => {
			this.ngzone.run(() => {
				if (this.settings == undefined || this.settings.name == '') this.errorMessage = this.translate.instant('settings.nothingToSave');
				else this.saveSettings();
			});
		});
		ipcRenderer.on('saveAsSettingsFile', () => {
			this.ngzone.run(() => {
				if (this.settings == undefined || this.settings.name == '') this.errorMessage = this.translate.instant('settings.nothingToSave');
				else this.saveSettingsAs();
			});
		});
	}

	ngOnInit() {
		try {
			this.recents = JSON.parse(localStorage.getItem('recents') || '[]');
		}
		catch (e) {
			this.recents = [];
		}

		this.player.nativeElement.onerror = (e) => {
			console.log(e);
		}

		var self = this;

		this.settings = new Proxy({
			name: '',
			folder: '',
			acronym: '',
			video: false,
			videoFile: '',
			length: 0,
			begin: 0,
			end: 0
		}, {
				get(target, key) {
					return target[key];
				},
				set(target, key, value) {
					target[key] = value;
					if (target.video == true && key == 'end') {
						if (value < 0 || value > self.player.nativeElement.duration) {
							target[key] = self.player.nativeElement.duration;
						}
						else {
							target[key] = value;
						}
						target.length = target.end - target.begin;
					}
					else if (target.video == true && key == 'begin') {
						if (value < 0 || value > self.player.nativeElement.duration) {
							target[key] = 0;
						}
						else {
							target[key] = value;
						}
						target.length = target.end - target.begin;
					}
					else if (target.video == true && key == 'length') {
						if (value < 0 || target.begin + value > self.player.nativeElement.duration) {
							target[key] = self.player.nativeElement.duration - target.begin;
						}
						else {
							target[key] = value;
						}
						target.end = target.begin + target.length;
					}
					else {
						target[key] = value;
					}

					self.saved = false;

					self.applicationRef.tick();
					self.settingsChange.emit(target);

					return true;
				}
			});
	}

	createNewSettings() {
		this.errorMessage = '';

		this.settings.folder = '';
		this.settings.acronym = '';
		this.settings.length = 0;
		this.settings.video = false;
		this.settings.videoFile = '';
		this.settings.begin = 0;
		this.settings.end = 0;

		this.settings.name = this.translate.instant('settings.newFileName');
		this.saveFile = '---NEW---';
		this.saved = true;
	}

	openFileDialog() {
		this.errorMessage = '';
		this.openFileService.openFile([
			{ name: this.translate.instant('settings.h77SettingsFile'), extensions: ['h77.set'] },
			{ name: this.translate.instant('settings.allFiles'), extensions: ['*'] }
		], ['openFile']).then((name) => {
			this.openFile(name);
		}).catch((e) => { });
	}

	checkSettings(settings) {
		if (settings.video === undefined || settings.acronym === undefined || settings.folder === undefined || settings.length === undefined || (settings.video == true && settings.videoFile === undefined) || (settings.video == true && settings.begin === undefined) || (settings.video == true && settings.end === undefined)) {
			throw this.translate.instant('settings.wrongFileFormat');
		}
		if (settings.video == true && window.fs.existsSync(settings.videoFile) == false) {
			throw this.translate.instant('settings.videoDoesNotExist');
		}
		if (window.fs.existsSync(settings.folder) == false) {
			throw this.translate.instant('settings.saveFolderDoesNotExist');
		}
		if (settings.acronym == '') {
			throw this.translate.instant('settings.acronymNotGiven');
		}
		if (settings.folder == '') {
			throw this.translate.instant('settings.noSaveFolder');
		}
		return true;
	}

	openFile(name) {
		this.errorMessage = '';
		try {
			if (window.fs.existsSync(name)) {
				var file = window.fs.readFileSync(name);

				try {
					var settings = JSON.parse(file.toString());
				}
				catch (e) { throw this.translate.instant('settings.wrongFileFormat'); }

				this.checkSettings(settings);

				this.settings.folder = settings.folder;
				this.settings.acronym = settings.acronym;
				this.settings.length = settings.length;
				this.settings.video = settings.video;
				this.settings.videoFile = settings.videoFile;
				this.settings.begin = settings.begin;
				this.settings.end = settings.end;

				if (settings.video == true) this.openVideo(settings.videoFile);

				this.settings.name = window.path.parse(name).name;
				this.saveFile = name;
				this.saved = true;

				let obj = { path: name, filename: window.path.parse(name).name };
				if (this.recents.find((e) => { return e.filename == obj.filename && e.path == obj.path }) === undefined) {
					if (this.recents.length > 10) this.recents.unshift();
					this.recents.push(obj);
				}

				localStorage.setItem('recents', JSON.stringify(this.recents));
			}
			else {
				this.errorMessage = this.translate.instant('settings.fileNotExists');
				this.saveFile = '';
			}
		}
		catch (e) {
			if (e) this.errorMessage = e;
			else this.errorMessage = this.translate.instant('settings.fileNotExists');
			this.saveFile = '';
		}
	}

	chooseSaveFolder() {
		this.openFileService.openFile([], ['openDirectory']).then((folder) => {
			this.settings.folder = folder;
		}).catch(() => { });
	}

	openSaveFolder() {
		window.electron.shell.openItem(this.settings.folder);
	}

	chooseVideo(e) {
		this.errorMessage = '';
		this.openFileService.openFile([
			{ name: this.translate.instant('settings.videoFile'), extensions: ['mp4', 'avi', 'ogv', 'mov', '3gp', 'webm'] },
			{ name: this.translate.instant('settings.allFiles'), extensions: ['*'] }
		], ['openFile']).then((name) => {
			this.settings.videoFile = name;
			this.openVideo(name, () => {
				this.settings.begin = 0;

				var i = setInterval(() => {
					if (this.player.nativeElement.readyState > 0) {
						this.settings.end = window.parseInt(this.player.nativeElement.duration);
						clearInterval(i);
					}
				}, 200);
			});
		}).catch((e) => { });
	}

	openVideo(name, callback?: any) {
		callback = callback || function() { };
		this.errorMessage = '';
		window.fs.readFile(name, (err, buffer) => {
			if (err) {
				this.errorMessage = this.translate.instant('settings.fileNotExists');
			}
			else {
				try {
					var arrayBuffer = new Uint8Array(buffer).buffer;
					var blob = new Blob([new Uint8Array(arrayBuffer)], { type: MIME[window.require('path').parse(name).ext] });
					this.player.nativeElement.src = name;

					callback();
				}
				catch (e) {
					this.errorMessage = this.translate.instant('settings.corruptedVideo');
				}
			}
		});
	}

	markBegin() {
		this.settings.begin = window.parseInt(this.player.nativeElement.currentTime);
		if (this.settings.end < this.settings.begin) this.settings.end = this.settings.begin;
	}

	markEnd() {
		this.settings.end = window.parseInt(this.player.nativeElement.currentTime);
		if (this.settings.end < this.settings.begin) this.settings.begin = this.settings.end;
	}

	saveSettings() {
		this.exportSettings(this.saveFile);
	}

	saveSettingsAs() {
		this.errorMessage = '';
		this.openFileService.saveFile([
			{ name: this.translate.instant('settings.h77SettingsFile'), extensions: ['h77.set'] },
			{ name: this.translate.instant('settings.allFiles'), extensions: ['*'] }
		]).then((fileName) => {
			this.exportSettings(fileName);
		}).catch((e) => { })
	}

	exportSettings(saveFile) {
		try {
			this.errorMessage = '';
			if (this.checkSettings(this.settings)) {
				var promise;
				if (saveFile == '---NEW---') {
					promise = this.openFileService.saveFile([
						{ name: this.translate.instant('settings.h77SettingsFile'), extensions: ['h77.set'] },
						{ name: this.translate.instant('settings.allFiles'), extensions: ['*'] }
					]).then((name) => {
						this.saveFile = name;
						this.settings.name = window.path.parse(name).name;
						return Promise.resolve();
					})
				}
				else {
					promise = Promise.resolve();
					this.saveFile = saveFile;
					this.settings.name = window.path.parse(saveFile).name;
				}

				promise.then(() => {
					window.fs.writeFileSync(this.saveFile, JSON.stringify(this.settings));
					this.errorMessage = '@' + this.translate.instant('settings.successSave');

					this.saved = true;

					let obj = { path: this.saveFile, filename: window.path.parse(this.saveFile).name };
					if (this.recents.find((e) => { return e.filename == obj.filename && e.path == obj.path }) === undefined) {
						if (this.recents.length > 10) this.recents.unshift();
						this.recents.push(obj);
					}

					localStorage.setItem('recents', JSON.stringify(this.recents));
				}).catch((e) => {
					if (e) this.errorMessage = this.translate.instant('settings.saveFileNotWritable');
				});
			}
		}
		catch (e) {
			this.errorMessage = e;
		}
	}

	restoreSettings() {
		if (this.saveFile == '---NEW---') this.createNewSettings();
		else this.openFile(this.saveFile);
	}

	canLeave() {
		this.errorMessage = '';
		if (this.saveFile == '') return true;
		try {
			this.checkSettings(this.settings);
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
