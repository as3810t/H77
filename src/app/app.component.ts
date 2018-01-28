import { Component, ViewChild, ChangeDetectorRef, NgZone } from '@angular/core';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';

declare var window :any;

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
		private changeDetectorRef :ChangeDetectorRef,
		private ngzone :NgZone,
		private modalService :NgbModal
	) {
		const ipcRenderer = window.electron.ipcRenderer;

		ipcRenderer.on('createSettingsFile', () => {this.selectTab('tabSettings');});
		ipcRenderer.on('openSettingsFile', () => {this.selectTab('tabSettings');});
		ipcRenderer.on('saveSettingsFile', () => {this.selectTab('tabSettings');});
		ipcRenderer.on('saveAsSettingsFile', () => {this.selectTab('tabSettings');});

		ipcRenderer.on('createKeyboardFile', () => {this.selectTab('tabKeyboard');});
		ipcRenderer.on('openKeyboardFile', () => {this.selectTab('tabKeyboard');});
		ipcRenderer.on('saveKeyboardFile', () => {this.selectTab('tabKeyboard');});
		ipcRenderer.on('saveAsKeyboardFile', () => {this.selectTab('tabKeyboard');});

		ipcRenderer.on('saveAnalysis', () => {this.selectTab('tabAnalysis');});
		ipcRenderer.on('editAnalysis', () => {this.selectTab('tabAnalysis');});
		ipcRenderer.on('showKeyboardAnalysis', () => {this.selectTab('tabAnalysis');});
		ipcRenderer.on('showDataAnalysis', () => {this.selectTab('tabAnalysis');});
		ipcRenderer.on('configureVideo', () => {this.selectTab('tabAnalysis');});

		ipcRenderer.on('splitFile', () => {this.selectTab('tabAfterwork');});
		ipcRenderer.on('clipFile', () => {this.selectTab('tabAfterwork');});
		ipcRenderer.on('mergeFiles', () => {this.selectTab('tabAfterwork');});
		ipcRenderer.on('editFile', () => {this.selectTab('tabAfterwork');});

		ipcRenderer.on('about', () => {
			this.ngzone.run(() => {
				this.modalService.open(this.about);
			});
		});
	}

	ngOnInit() {
		window.onbeforeunload = (e) => {
			if(this.tabSettings.canClose() == false) {
				this.ngzone.run(() => {this.ngbTabset.select('tabSettings');});
				return  window.electron.remote.dialog.showMessageBox(window.electron.remote.getCurrentWindow(), {
					type: 'warning',
					buttons: ['Nem', 'Igen'],
					defaultId: 0,
					title: 'Biztosan kilép?',
					message: 'A beállítások oldalon elmentetlen változtatások vannak. Biztosan kilép?',
					cancelId: 0
				}) == 1 ? undefined : false;
			}
			else if(this.tabKeyboard.canClose() == false) {
				this.ngzone.run(() => {this.ngbTabset.select('tabKeyboard');});
				return  window.electron.remote.dialog.showMessageBox(window.electron.remote.getCurrentWindow(), {
					type: 'warning',
					buttons: ['Nem', 'Igen'],
					defaultId: 0,
					title: 'Biztosan kilép?',
					message: 'A billentyűk oldalon elmentetlen változtatások vannak. Biztosan kilép?',
					cancelId: 0
				}) == 1 ? undefined : false;
			}
			else if(this.tabAnalysis.canClose() == false) {
				this.ngzone.run(() => {this.ngbTabset.select('tabAnalysis');});
				return  window.electron.remote.dialog.showMessageBox(window.electron.remote.getCurrentWindow(), {
					type: 'warning',
					buttons: ['Nem', 'Igen'],
					defaultId: 0,
					title: 'Biztosan kilép?',
					message: 'Az elemzés oldalon elmentetlen változtatások vannak, vagy mérés van folyamatban. Biztosan kilép?',
					cancelId: 0
				}) == 1 ? undefined : false;
			}
			else if(this.tabAfterwork.canClose() == false) {
				this.ngzone.run(() => {this.ngbTabset.select('tabAfterwork');});
				return  window.electron.remote.dialog.showMessageBox(window.electron.remote.getCurrentWindow(), {
					type: 'warning',
					buttons: ['Nem', 'Igen'],
					defaultId: 0,
					title: 'Biztosan kilép?',
					message: 'Az utómunkálatok oldalon elmentetlen változtatások vannak. Biztosan kilép?',
					cancelId: 0
				}) == 1 ? undefined : false;
			}
			else {
				return undefined;
			}
		}
	}

	beforeChange(event) {
		if(this[event.activeId].canLeave() == false) event.preventDefault();
	}

	selectTab(tab) {
		if(tab == this.ngbTabset.activeId || this[this.ngbTabset.activeId].canLeave()) this.ngbTabset.select(tab);
		this.changeDetectorRef.detectChanges();
	}
}
