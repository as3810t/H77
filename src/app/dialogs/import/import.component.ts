import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';

declare var window: any;

@Component({
	moduleId: module.id,
	templateUrl: './import.component.html',
	styleUrls: ['./import.component.css']
})
export class ImportComponent {
	Arr = Array;

	openFileNames: any = [];
	openSheets: any = [];
	openSheet: any = [];
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

	constructor(
		public activeModal: NgbActiveModal,
		private translate: TranslateService
	) { }

	importDialog(sheetNames, openFileNames) {
		this.openFileNames = openFileNames;
		this.openSheets = sheetNames;
		this.openSheet = [];
		for (let i = 0; i < sheetNames.length; i++) {
			this.openSheet[i] = sheetNames[i].indexOf(this.translate.instant('dialogs.eventList')) == -1 ? sheetNames[i][0] : this.translate.instant('dialogs.eventList');
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
		this.openKeyboard = sheetNames[0].indexOf(this.translate.instant('dialogs.events')) == -1 ? sheetNames[0][0] : this.translate.instant('dialogs.events');
		this.openKeyboardRow = 2;
		this.openKeyboardKey = 'A';
		this.openKeyboardName = 'B';
		this.openKeyboardType = 'C';
	}

	complete() {
		this.activeModal.close({
			sheets: this.openSheet,
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
		});
	}
}
