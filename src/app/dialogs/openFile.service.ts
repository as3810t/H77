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
				title: this.translate.instant('dialogs.openFile'),
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
			return new Promise((resolve, reject) => {
				window.electron.remote.dialog.showMessageBox(options, (response) => {
					resolve(response);
				})
			})
		}
		else {
			return window.electron.remote.dialog.showMessageBox(options);
		}
	}
}
