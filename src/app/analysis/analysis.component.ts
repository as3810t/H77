import { Component, Input, Output, ViewChild, EventEmitter, HostListener, NgZone } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { OpenFileService } from './../dialogs/openFile.service';
import { ExportFileService } from './../dialogs/exportFile.service';

declare var window :any;

@Component({
	moduleId: module.id,
	selector: 'app-analysis',
	templateUrl: './analysis.component.html',
	styleUrls: ['./analysis.component.css']
})
export class AnalysisComponent {
	errorMessage :any = '';
	videoFile = '';
	videoBlob :any = '';
	saved = true;

	paused = true;
	time = 0;
	lastTime :any = 0;
	timeInterval :any;

	speed = 1;
	jumpTo = 0;

	eventList :any = [];

	savedEventList :any = [];
	editing = false;
	addEventListKey = '';
	addEventListTime = 0;

	fileName = '';
	fileType = 'xlsx';

	videoFilter :any = {
		filter: '',
		transform: ''
	};
	videoConfigBrightness = 1;
	videoConfigContrast = 1;
	videoConfigGrayscale = 0;
	videoConfigSepia = 0;
	videoConfigHue = 0;
	videoConfigInvert = 0;
	videoConfigSaturate = 1;
	videoConfigVertical = false;
	videoConfigHorizontal = false;

	@Input() settings :any = {};
	@Input() keyboard :any = [];

	@ViewChild('player') player;
	@ViewChild('player2') player2;
	@ViewChild('videoConfig') videoConfig;
	@ViewChild('endOfAnalysis') endOfAnalysis;
	showKeyboard = true;
	showData = false;

	constructor(
		private openFileService :OpenFileService,
		private exportFileService :ExportFileService,
		private modalService :NgbModal,
		private ngzone :NgZone,
		private sanitizer :DomSanitizer
	) {
		const ipcRenderer = window.electron.ipcRenderer;

		ipcRenderer.on('saveAnalysis', () => {
			this.ngzone.run(() => {
				if(this.settings == undefined || this.settings.name == undefined || this.settings.name == '' || this.keyboard == undefined || this.keyboard.length == undefined || this.keyboard.length == 0) this.errorMessage = 'Nincs mit menteni';
				else this.saveFile();
			});
		});
		ipcRenderer.on('editAnalysis', () => {
			this.ngzone.run(() => {
				if(!this.editing || this.settings == undefined || this.settings.name == undefined || this.settings.name == '' || this.keyboard == undefined || this.keyboard.length == undefined || this.keyboard.length == 0) this.errorMessage = 'Nincs mit szerkeszteni';
				else this.startEditing();
			});
		});
		ipcRenderer.on('showKeyboardAnalysis', () => {
			this.ngzone.run(() => {
				this.showKeyboard = !this.showKeyboard;
			});
		});
		ipcRenderer.on('showDataAnalysis', () => {
			this.ngzone.run(() => {
				this.showData = !this.showData;
			});
		});
		ipcRenderer.on('configureVideo', () => {
			this.ngzone.run(() => {
				if(this.settings == undefined || this.settings.name == undefined || this.settings.name == '' || this.keyboard == undefined || this.keyboard.length == undefined || this.keyboard.length == 0) return;
				this.modalService.open(this.videoConfig);
			});
		});
	}

	ngDoCheck() {
		if(this.settings && this.settings.video == true && this.settings.videoFile != this.videoFile) {
			this.videoFile = this.settings.videoFile;
			this.openVideo(this.videoFile);
		}
		else if(this.settings && this.settings.video == false) {
			this.videoFile = '';
			this.videoBlob = '';
		}
	}

	openVideo(name) {
		this.errorMessage = '';
		window.fs.readFile(name, (err, buffer) => {
			if(err) {
				this.errorMessage = 'A videófájl nem létezik, vagy nincs jogosultság az elérésére.';
			}
			else {
				try {
					var arrayBuffer = new Uint8Array(buffer).buffer;
					var blob = new Blob([new Uint8Array(arrayBuffer)]);
					this.videoBlob = this.sanitizer.bypassSecurityTrustUrl(window.URL.createObjectURL(blob));
					//this.player.nativeElement.src = this.videoBlob;
				}
				catch(e) {
					this.errorMessage = 'Hibás videófájl vagy nem támogatott fájlformátum.'
				}
			}
		});
	}

	playPause() {
		this.errorMessage = '';
		this.saved = false;
		if(this.editing) {
			this.errorMessage = 'A mérés folytatása előtt be kell felyezni a szerkesztést';
		}
		else if(this.paused) {
			for(var i = 0; i < this.eventList.length; i++) {
				if(this.eventList[i].time > this.time / 1000) {
					this.eventList.splice(i, 1);
					i--;
				}
			}

			if(this.time == 0) this.player.nativeElement.currentTime = this.settings.begin;
			this.paused = false;
			this.lastTime = new Date();
			this.timeInterval = setInterval(() => {
				if(this.settings.video == true) {
					if(this.player.nativeElement.currentTime < this.settings.begin) this.player.nativeElement.currentTime = this.settings.begin;
					this.time = (this.player.nativeElement.currentTime - this.settings.begin) * 1000;
					if(this.time/1000 > this.settings.length) this.player.nativeElement.pause();
				}
				else {
					var act :any = new Date()
					var dt :any = act - this.lastTime;
					dt *= this.speed;
					this.lastTime = act;
					this.time += dt;
				}
				this.jumpTo = this.time / 1000;
			}, 10);

			if(this.settings.video == true) {
				this.player.nativeElement.play();
			}
		}
		else {
			this.paused = true;
			window.clearInterval(this.timeInterval);

			if(this.settings.video == true) {
				this.player.nativeElement.pause();
			}
		}
	}

	stop() {
		this.errorMessage = '';

		if(this.paused == false) this.playPause();
		window.clearInterval(this.timeInterval);
		this.time = 0;

		if(this.settings.video == true) {
			this.player.nativeElement.pause();
			this.player.nativeElement.currentTime = this.settings.begin;
		}
	}

	speedChange() {
		this.errorMessage = '';
		if(this.settings.video == true) {
			this.player.nativeElement.playbackRate = this.speed;
		}
	}

	jump() {
		this.errorMessage = '';
		if(this.paused == false) return;
		if(this.jumpTo > this.settings.length) {
			this.errorMessage = 'Nem lehet túlugrani a kísérlet végén (' + this.settings.length + ' mp)'
		}
		else {
			if(this.settings.video == true) {
				this.player.nativeElement.pause();
				this.player.nativeElement.currentTime = window.parseFloat(this.jumpTo) + this.settings.begin;
			}
			this.time = window.parseFloat(this.jumpTo) * 1000;
		}
	}

	@HostListener('document:keydown', ['$event'])
	keyPress(event) {
		if(this.settings == undefined || this.settings.name == '' || this.keyboard == undefined || this.keyboard.length == 0) {}
		else if(event.key == ' ') {
			event.preventDefault();
			this.playPause();
		}
		else if(this.paused == false) {
			for(var i = 0; i < this.keyboard.length; i++) {
				if(this.keyboard[i].key == event.key.toUpperCase()) {
					var lastInterval = -1;
					for(var j = 0; j < this.eventList.length; j++) {
						if(this.eventList[j].type == 'i') lastInterval = j;
					}

					if(this.keyboard[i].type == 'i' && lastInterval != -1 && this.eventList[lastInterval].key == this.keyboard[i].key) {
						this.eventList[lastInterval].time = this.time/1000 > this.settings.length ? this.settings.length : this.time/1000;
					}
					else {
						var freq = this.eventList.filter((e)=>{return e.key == this.keyboard[i].key}).length + 1;
						this.eventList.push({
							key: this.keyboard[i].key,
							name: this.keyboard[i].name,
							time: this.time/1000 > this.settings.length ? this.settings.length : this.time/1000,
							freq: freq,
							type: this.keyboard[i].type
						});
					}
					if(this.keyboard[i].type == 'i' && (this.time/1000) > this.settings.length) {
						this.paused = true;
						this.time = 0;
						window.clearInterval(this.timeInterval);

						this.modalService.open(this.endOfAnalysis);

						if(this.settings.video == true) {
							this.player.nativeElement.pause();
							this.player.nativeElement.currentTime = this.settings.begin;
						}
					}
				}
			}
		}
	}

	saveFile() {
		this.errorMessage = '';
		if(this.paused == false || this.time != 0) {
			this.errorMessage = 'Mérés folyamatban, nem lehet menteni';
		}
		else if(this.editing == true) {
			this.errorMessage = 'Adatok szerkesztése folyamatban, nem lehet menteni';
		}
		else {
			this.openFileService.saveFile([
				{name: 'Excel', extensions: ['xlsx']},
				{name: 'Libre Office', extensions: ['ods']},
				{name: 'Nyers', extensions: ['csv']}
			]).then((fileName) => {
				for(var i = 0; i < this.eventList.length; i++) {
					this.eventList[i].ident = window.path.parse(fileName).name;
				}

				this.exportFileService.exportFile(window.path.parse(fileName).name, window.path.parse(fileName).ext.slice(1), this.eventList, this.keyboard, {
					length: this.settings.length,
					folder: window.path.parse(fileName).dir
				}).then(() => {
					this.errorMessage = '@Sikeres mentés';
				}).catch((e) => {
					this.errorMessage = 'Hiba a fájl mentése közben';
				});
			}).catch((e) => {});
		}
	}

	exportFile() {
		this.errorMessage = '';
		if(this.fileName == '') this.errorMessage = 'Nevet kell adni a fájlnak';
		else if(this.paused == false || this.time != 0) {
			this.errorMessage = 'Mérés folyamatban, nem lehet menteni';
		}
		else if(this.editing == true) {
			this.errorMessage = 'Adatok szerkesztése folyamatban, nem lehet menteni';
		}
		else {
			if(window.fs.existsSync(window.path.join(this.settings.folder, this.settings.acronym + this.fileName + '.' + this.fileType))) {
				if(this.openFileService.showDialog({
					type: 'question',
					buttons: ['Mégse', 'Felülírás'],
					defaultId: 0,
					title: 'Megerősítés',
					message: 'A megadott nevű fájl már létezik. Biztos felülírja?',
					cancelId: 0
				}) == 0) return;
			}

			for(var i = 0; i < this.eventList.length; i++) {
				this.eventList[i].ident = this.settings.acronym + this.fileName;
			}

			this.exportFileService.exportFile(this.settings.acronym + this.fileName, this.fileType, this.eventList, this.keyboard, this.settings).then(() => {
				this.errorMessage = '@Sikeres mentés';
				this.saved = true;
			}).catch((e) => {
				this.errorMessage = 'Hiba a fájl mentése közben';
			});
		}
	}

	startEditing() {
		this.errorMessage = '';
		if(this.paused == false) {
			this.errorMessage = 'Mérési adatok szerkesztése előtt meg kell állítani az órát';
			return;
		}
		this.editing = true;
		this.savedEventList = Object.create(this.eventList);
	}

	dropEditing() {
		this.errorMessage = '';
		this.editing = false;
		this.eventList = this.savedEventList;
	}

	saveEditing() {
		this.errorMessage = '';
		this.recalculateEventList();
		this.editing = false;
		this.saved = false;
	}

	recalculateEventList() {
		this.errorMessage = '';
		for(let i = 0; i < this.eventList.length; i++) {
			this.eventList[i].name = '';
			this.eventList[i].type = '';
			this.eventList[i].key = this.eventList[i].key.toUpperCase();

			for(let j = 0; j < this.keyboard.length; j++) {
				if(this.eventList[i].key == this.keyboard[j].key) {
					this.eventList[i].name = this.keyboard[j].name;
					this.eventList[i].type = this.keyboard[j].type;
					break;
				}
			}
			if(this.eventList[i].name == '') {
				this.removeFromEventList(i);
				this.errorMessage = 'Nem létező billentyűkód';
				return;
			}

			if(this.eventList[i].time == '' || this.eventList[i].time < 0 || this.eventList[i].time > this.settings.length) {
				this.removeFromEventList(i);
				this.errorMessage = 'Az idő egy pozitív szám, ami kisebb mint a mérés hossza (' + this.settings.length + ' mp)';
				return;
			}
		}

		this.eventList.sort((a, b) => {return a.time > b.time ? 1 : a.time < b.time ? -1 : 0});

		for(let i = 1; i < this.eventList.length; i++) {
			if(this.eventList[i].key == this.eventList[i-1].key && this.eventList[i].type == 'i') {
				this.eventList.splice(i-1, 1);
				i--;
			}
		}

		for(let i = 0; i < this.eventList.length; i++) {
			this.eventList[i].freq = 1;
			for(let j = 0; j < i; j++) {
				if(this.eventList[i].key == this.eventList[j].key) {
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
			time: this.addEventListTime
		});
		this.recalculateEventList();

		this.addEventListKey = '';
		this.addEventListTime = 0;
	}

	changeVideoConfig() {
		if(this.videoConfigBrightness < 0) this.videoConfigBrightness = 0;
		else if(this.videoConfigBrightness > 8) this.videoConfigBrightness = 8;

		if(this.videoConfigContrast < 0) this.videoConfigContrast = 0;
		else if(this.videoConfigContrast > 8) this.videoConfigContrast = 8;

		if(this.videoConfigGrayscale < 0) this.videoConfigGrayscale = 0;
		else if(this.videoConfigGrayscale > 1) this.videoConfigGrayscale = 1;

		if(this.videoConfigSepia < 0) this.videoConfigSepia = 0;
		else if(this.videoConfigSepia > 1) this.videoConfigSepia = 1;

		if(this.videoConfigHue < 0) this.videoConfigHue = 0;
		else if(this.videoConfigHue > 360) this.videoConfigHue = 360;

		if(this.videoConfigInvert < 0) this.videoConfigInvert = 0;
		else if(this.videoConfigInvert > 1) this.videoConfigInvert = 1;

		if(this.videoConfigSaturate < 0) this.videoConfigSaturate = 0;
		else if(this.videoConfigSaturate > 8) this.videoConfigSaturate = 8;

		this.videoFilter.filter = this.sanitizer.bypassSecurityTrustStyle(`brightness(${this.videoConfigBrightness}) contrast(${this.videoConfigContrast}) grayscale(${this.videoConfigGrayscale}) sepia(${this.videoConfigSepia}) hue-rotate(${this.videoConfigHue}deg) invert(${this.videoConfigInvert}) saturate(${this.videoConfigSaturate})`);

		this.videoFilter.transform = this.sanitizer.bypassSecurityTrustStyle(`scaleX(${this.videoConfigVertical ? -1 : 1}) scaleY(${this.videoConfigHorizontal ? -1 : 1})`);
	}

	resetVideoConfig() {
		this.videoConfigBrightness = 1;
		this.videoConfigContrast = 1;
		this.videoConfigGrayscale = 0;
		this.videoConfigSepia = 0;
		this.videoConfigHue = 0;
		this.videoConfigInvert = 0;
		this.videoConfigSaturate = 1;
		this.videoConfigVertical = false;
		this.videoConfigHorizontal = false;
		this.changeVideoConfig();
	}

	canLeave() {
		this.errorMessage = '';
		if(this.paused == false || this.time != 0) {
			this.errorMessage = 'Mérés folyamatban, nem lehet kilépni';
			return false;
		}
		else if(this.editing == true) {
			this.errorMessage = 'Mérési adatok szerkesztése folyamatban, nem lehet kilépni';
			return false;
		}
		return true;
	}

	isSaved() {
		this.errorMessage = '';
		if(this.saved == false) this.errorMessage = 'A mérési adatok nincsenek elmentve';
		return this.saved;
	}

	canClose() {
		return this.canLeave() && this.isSaved();
	}
}
