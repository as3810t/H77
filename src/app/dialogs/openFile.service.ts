import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

declare var window: any;

@Injectable()
export class OpenFileService {
	constructor(
		private translate: TranslateService
	) { }

	openFile(filters, properties) {
		return new Promise((resolve, reject) => {
			window.electron.remote.dialog.showOpenDialog({
				title: properties[0] == 'openDirectory' ? this.translate.instant('dialogs.openFolder') : this.translate.instant('dialogs.openFile'),
				filters: filters,
				properties: properties
			}, function(fileNames) {
				if (fileNames === undefined) reject();
				else resolve(properties.indexOf('multiSelections') == -1 ? fileNames[0] : fileNames);
			});
		});
	}

	saveFile(filters) {
		return new Promise((resolve, reject) => {
			window.electron.remote.dialog.showSaveDialog({
				title: this.translate.instant('dialogs.saveFile'),
				filters: filters
			}, function(fileName) {
				if (fileName === undefined) reject();
				else resolve(fileName);
			});
		});
	}

	showDialog(options) {
		if (options.async == true) {
			return new Promise((resolve) => {
				window.electron.remote.dialog.showMessageBox(options, (response) => {
					resolve(response);
				});
			})
		}
		else {
			return window.electron.remote.dialog.showMessageBox(options);
		}
	}

	overrideDialog() {
		return this.showDialog({
			type: 'question',
			buttons: [this.translate.instant('dialogs.override.cancel'), this.translate.instant('dialogs.override.override')],
			defaultId: 0,
			title: this.translate.instant('dialogs.override.confirmation'),
			message: this.translate.instant('dialogs.override.confirmationBody'),
			cancelId: 0
		}) == 1;
	}
}
