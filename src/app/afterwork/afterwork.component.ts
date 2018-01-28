import { Component, Input, Output, ViewChild, EventEmitter, ChangeDetectorRef } from '@angular/core';

declare var window :any;

@Component({
	moduleId: module.id,
	selector: 'app-afterwork',
	templateUrl: './afterwork.component.html',
	styleUrls: ['./afterwork.component.css']
})
export class AfterworkComponent {
	@Input() settings;

	@ViewChild('split') split;
	@ViewChild('clip') clip;
	@ViewChild('merge') merge;
	@ViewChild('edit') edit;

	@ViewChild('tabSet') ngbAccordion;

	errorMessage = '';

	constructor(
		private changeDetectorRef :ChangeDetectorRef
	) {
		const ipcRenderer = window.electron.ipcRenderer;

		ipcRenderer.on('splitFile', () => {this.selectTab('split');});
		ipcRenderer.on('clipFile', () => {this.selectTab('clip');});
		ipcRenderer.on('mergeFiles', () => {this.selectTab('merge');});
		ipcRenderer.on('editFile', () => {this.selectTab('edit');});
	}

	ngOnInit() {

	}

	isModified() {
		if((this.split == undefined || this.split.canLeave()) && (this.clip == undefined || this.clip.canLeave()) && (this.merge == undefined || this.merge.canLeave()) && (this.edit == undefined || this.edit.canLeave())) return false;
		else return true;
	}

	canChange(event) {
		this.errorMessage = '';
		if(this.isModified()) {
			event.preventDefault();
		}
	}

	selectTab(tab) {
		this.errorMessage = '';
		if(tab == this.ngbAccordion.activeIds[0]) {}
		else if(this.ngbAccordion.activeIds.length == 0 || this[this.ngbAccordion.activeIds[0]].canLeave()) this.ngbAccordion.toggle(tab);
		this.changeDetectorRef.detectChanges();
	}

	canLeave() {
		this.errorMessage = '';
		if(this.isModified()) {
			//this.errorMessage = 'Szerkesztés folyamatban, nem lehet kilépni mentés vagy elvetés előtt';
			return false;
		}
		return true;
	}

	canClose() {
		return this.canLeave();
	}
}
