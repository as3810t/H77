import { Injectable } from '@angular/core';

declare var window :any;

@Injectable()
export class OpenFileService {
	openFile(filters, properties) {
		return new Promise(function(resolve, reject) {
			window.electron.remote.dialog.showOpenDialog({
				title: 'Fájl megnyitása',
				filters: filters,
				properties: properties
			}, function(fileNames) {
				if(fileNames === undefined) reject();
				else resolve(properties.indexOf('multiSelections') == -1 ? fileNames[0] : fileNames);
			});
		});
	}

	saveFile(filters) {
		return new Promise(function(resolve, reject) {
			window.electron.remote.dialog.showSaveDialog({
				title: 'Fájl mentése',
				filters: filters
			}, function(fileName) {
				if(fileName === undefined) reject();
				else resolve(fileName);
			});
		});
	}

	showDialog(options) {
		if(options.async == true) {
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
