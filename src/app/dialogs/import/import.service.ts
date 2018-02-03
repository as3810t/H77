import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { OpenFileService } from './../openFile.service';
import { ExportFileService } from './../exportFile.service';

import { ImportComponent } from './import.component';

declare var window: any;

@Injectable()
export class ImportService {
	constructor(
		private openFileService: OpenFileService,
		private exportFileService: ExportFileService,
		private modalService: NgbModal,
		private translate: TranslateService
	) { }

	importDialog(multiFile?) {
		let fileNames, openFileNames;
		return this.openFileService.openFile([
			{ name: this.translate.instant('dialogs.import.measurementFiles'), extensions: ['xlsx', 'ods'] },
			{ name: this.translate.instant('dialogs.import.allFiles'), extensions: ['*'] }
		], multiFile ? ['openFile', 'multiSelections'] : ['openFile']).then((names: any) => {
			fileNames = multiFile ? names : [names];
			openFileNames = fileNames.map((e) => { return window.path.parse(e).name });

			let sheetNamesPromises = [];
			for (let i = 0; i < fileNames.length; i++) {
				sheetNamesPromises.push(this.exportFileService.importSheetNames(fileNames[i]));
			}

			return Promise.all(sheetNamesPromises);
		}).then((sheetNames: any) => {
			const modal = this.modalService.open(ImportComponent);
			modal.componentInstance.importDialog(sheetNames, openFileNames);

			return modal.result.then((config) => {
				let importFilePromises = [];
				for (let i = 0; i < config.sheets.length; i++) {
					importFilePromises.push(this.exportFileService.importFile(fileNames[i], {
						sheet: config.sheets[i],
						...config
					}));
				}

				return Promise.all(importFilePromises);
			}).catch(() => {
				throw undefined;
			});
		}).then((datas: any) => {
			let measurementLength = datas.length > 0 ? datas[0].length : 0;
			for (let i = 1; i < datas.length; i++) {
				if (measurementLength != datas[i].length) {
					throw this.translate.instant('dialogs.import.lengthsDoNotMatch');
				}

				for (let i = 0; i < datas.length; i++) {
					for (let j = 0; j < i; j++) {
						let haystack = datas[j].keyboard.map((e) => { return e.key + '|' + e.name + '|' + e.type });
						for (let k = 0; k < datas[i].keyboard.length; k++) {
							let needle = datas[i].keyboard[k].key + '|' + datas[i].keyboard[k].name + '|' + datas[i].keyboard[k].type;
							if (haystack.indexOf(needle) == -1) {
								throw this.translate.instant('dialogs.import.keysDoNotMatch');
							}
						}
					}
				}
			}

			return {
				measurementLength: measurementLength,
				keyboard: datas[0].keyboard,
				data: datas.map((e) => { return e.data }),
				files: fileNames
			};
		});
	}
}
