import { Component, ViewChild, ChangeDetectorRef, NgZone } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';

declare var window: any;

@Component({
	moduleId: module.id,
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent {
	@ViewChild('tabSettings') tabSettings;
	@ViewChild('tabKeyboard') tabKeyboard;
	@ViewChild('tabAnalysis') tabAnalysis;
	@ViewChild('tabAfterwork') tabAfterwork;

	@ViewChild('tabSet') ngbTabset;
	@ViewChild('about') about;

	constructor(
		private changeDetectorRef: ChangeDetectorRef,
		private ngzone: NgZone,
		private modalService: NgbModal,
		private translate: TranslateService
	) {
		this.translate.setDefaultLang('en_US');
		const lang = window.navigator.language;
		const langSet = localStorage.getItem('lang');
		this.translate.use(langSet || lang || 'en_US');

		const ipcRenderer = window.electron.ipcRenderer;

		ipcRenderer.on('createSettingsFile', () => { this.selectTab('tabSettings'); });
		ipcRenderer.on('openSettingsFile', () => { this.selectTab('tabSettings'); });
		ipcRenderer.on('saveSettingsFile', () => { this.selectTab('tabSettings'); });
		ipcRenderer.on('saveAsSettingsFile', () => { this.selectTab('tabSettings'); });

		ipcRenderer.on('createKeyboardFile', () => { this.selectTab('tabKeyboard'); });
		ipcRenderer.on('openKeyboardFile', () => { this.selectTab('tabKeyboard'); });
		ipcRenderer.on('saveKeyboardFile', () => { this.selectTab('tabKeyboard'); });
		ipcRenderer.on('saveAsKeyboardFile', () => { this.selectTab('tabKeyboard'); });

		ipcRenderer.on('saveAnalysis', () => { this.selectTab('tabAnalysis'); });
		ipcRenderer.on('editAnalysis', () => { this.selectTab('tabAnalysis'); });
		ipcRenderer.on('showKeyboardAnalysis', () => { this.selectTab('tabAnalysis'); });
		ipcRenderer.on('showDataAnalysis', () => { this.selectTab('tabAnalysis'); });
		ipcRenderer.on('configureVideo', () => { this.selectTab('tabAnalysis'); });

		ipcRenderer.on('splitFile', () => { this.selectTab('tabAfterwork'); });
		ipcRenderer.on('clipFile', () => { this.selectTab('tabAfterwork'); });
		ipcRenderer.on('mergeFiles', () => { this.selectTab('tabAfterwork'); });
		ipcRenderer.on('editFile', () => { this.selectTab('tabAfterwork'); });

		ipcRenderer.on('about', () => {
			this.ngzone.run(() => {
				this.modalService.open(this.about);
			});
		});
	}

	ngOnInit() {
		window.onbeforeunload = () => {
			if (this.tabSettings.canClose() == false) {
				this.ngzone.run(() => { this.ngbTabset.select('tabSettings'); });
				return this.leaveConfirm(this.translate.instant('settings.leaveConfirm')) ? undefined : false;
			}
			else if (this.tabKeyboard.canClose() == false) {
				this.ngzone.run(() => { this.ngbTabset.select('tabKeyboard'); });
				return this.leaveConfirm(this.translate.instant('keyboard.leaveConfirm')) ? undefined : false;
			}
			else if (this.tabAnalysis.canClose() == false) {
				this.ngzone.run(() => { this.ngbTabset.select('tabAnalysis'); });
				return this.leaveConfirm(this.translate.instant('analysis.leaveConfirm')) ? undefined : false;
			}
			else if (this.tabAfterwork.canClose() == false) {
				this.ngzone.run(() => { this.ngbTabset.select('tabAfterwork'); });
				return this.leaveConfirm(this.translate.instant('afterworks.leaveConfirm')) ? undefined : false;
			}
			else {
				return undefined;
			}
		}
	}

	leaveConfirm(message) {
		return window.electron.remote.dialog.showMessageBox(window.electron.remote.getCurrentWindow(), {
			type: 'warning',
			buttons: [this.translate.instant('dialogs.leaveConfirm.no'), this.translate.instant('dialogs.leaveConfirm.yes')],
			defaultId: 0,
			title: this.translate.instant('dialogs.leaveConfirm.title'),
			message: message + ' ' + this.translate.instant('dialogs.leaveConfirm.wantToLeave'),
			cancelId: 0
		}) == 1;
	}

	beforeChange(event) {
		if (this[event.activeId].canLeave() == false) event.preventDefault();
	}

	selectTab(tab) {
		if (tab == this.ngbTabset.activeId || this[this.ngbTabset.activeId].canLeave()) this.ngbTabset.select(tab);
		this.changeDetectorRef.detectChanges();
	}
}
