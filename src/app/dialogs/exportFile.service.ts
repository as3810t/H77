import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

declare var window: any;

@Injectable()
export class ExportFileService {
	constructor(
		private translate: TranslateService
	) { }

	exportFile(fileName, type, data, keyboard, settings) {
		return new Promise((resolve, reject) => {
			var wb = window.XLSX.utils.book_new();

			wb.SheetNames.push(this.translate.instant('dialogs.result'));

			var result = {
				A1: { t: 's', v: this.translate.instant('dialogs.identifier') },
				A2: { t: 's', v: this.translate.instant('dialogs.identifier') }
			};

			result['!merges'] = [
				{ s: { c: 0, r: 0 }, e: { c: 0, r: 1 } }
			];
			for (var i = 0; i < keyboard.length; i++) {
				result[window.XLSX.utils.encode_col(1 + 0 * keyboard.length + i) + '1'] = { t: 's', v: this.translate.instant('dialogs.latency') };
				result[window.XLSX.utils.encode_col(1 + 1 * keyboard.length + i) + '1'] = { t: 's', v: this.translate.instant('dialogs.frequency') };
				result[window.XLSX.utils.encode_col(1 + 2 * keyboard.length + i) + '1'] = { t: 's', v: this.translate.instant('dialogs.time') };
				result[window.XLSX.utils.encode_col(1 + 3 * keyboard.length + i) + '1'] = { t: 's', v: this.translate.instant('dialogs.timepercentage') };

				result[window.XLSX.utils.encode_col(1 + 0 * keyboard.length + i) + '2'] = { t: 's', v: keyboard[i].name };
				result[window.XLSX.utils.encode_col(1 + 1 * keyboard.length + i) + '2'] = { t: 's', v: keyboard[i].name };
				result[window.XLSX.utils.encode_col(1 + 2 * keyboard.length + i) + '2'] = { t: 's', v: keyboard[i].name };
				result[window.XLSX.utils.encode_col(1 + 3 * keyboard.length + i) + '2'] = { t: 's', v: keyboard[i].name };
			}

			for (var i = 0; i < 4; i++) {
				result['!merges'].push({
					s: { c: 1 + i * keyboard.length, r: 0 },
					e: { c: 1 + (i + 1) * keyboard.length - 1, r: 0 }
				});
			}

			var idents = [];
			for (var i = 0; i < data.length; i++) {
				if (idents.indexOf(data[i].ident) == -1) idents.push(data[i].ident);
			}

			for (var k = 0; k < idents.length; k++) {
				var analysis = Object.create(keyboard);
				for (var i = 0; i < analysis.length; i++) {
					analysis[i].lat = '-';
					analysis[i].freq = 0;
					analysis[i].time = analysis[i].type == 'i' ? 0 : '-';
					analysis[i].timeperc = analysis[i].type == 'i' ? 0 : '-';
				}

				var lastTime = 0;
				for (var i = 0; i < data.length; i++) {
					for (var j = 0; j < analysis.length; j++) {
						if (analysis[j].key == data[i].key && data[i].ident == idents[k]) {
							analysis[j].freq++;
							if (analysis[j].lat == '-' && analysis[j].type == 'i') analysis[j].lat = lastTime;
							else if (analysis[j].lat == '-' && analysis[j].type == 'e') analysis[j].lat = data[i].time;
							if (analysis[j].type == 'i') {
								analysis[j].time += data[i].time - lastTime;
								lastTime = data[i].time;
							}
							break;
						}
					}
				}

				for (var i = 0; i < analysis.length; i++) {
					if (analysis[i].type == 'i') analysis[i].timeperc = analysis[i].time / settings.length;
				}

				result['A' + (k + 3)] = { t: 's', v: idents[k] };
				for (var i = 0; i < analysis.length; i++) {
					result[window.XLSX.utils.encode_col(1 + 0 * keyboard.length + i) + (k + 3)] = { t: analysis[i].lat == '-' ? 's' : 'n', v: analysis[i].lat, z: '0.000' };
					result[window.XLSX.utils.encode_col(1 + 1 * keyboard.length + i) + (k + 3)] = { t: 'n', v: analysis[i].freq, z: '0' };
					result[window.XLSX.utils.encode_col(1 + 2 * keyboard.length + i) + (k + 3)] = { t: analysis[i].time == '-' ? 's' : 'n', v: analysis[i].time, z: '0.000' };
					result[window.XLSX.utils.encode_col(1 + 3 * keyboard.length + i) + (k + 3)] = { t: analysis[i].timeperc == '-' ? 's' : 'n', v: analysis[i].timeperc, z: '0.000%' };
				}
			}

			result['!ref'] = 'A1:' + window.XLSX.utils.encode_col(1 + (analysis.length * 4) + 3) + (2 + idents.length);
			wb.Sheets[this.translate.instant('dialogs.result')] = result;

			if (type == 'csv') {
				var csv = window.XLSX.utils.sheet_to_csv(result);

				window.fs.writeFile(window.path.join(settings.folder, fileName) + '.' + type, csv, function(err) {
					if (err) reject(err);
					else resolve();
				});
			}
			else {
				wb.SheetNames.push(this.translate.instant('dialogs.eventList'));
				var eventList = {
					A1: { t: 's', v: '#' },
					B1: { t: 's', v: this.translate.instant('dialogs.key') },
					C1: { t: 's', v: this.translate.instant('dialogs.name') },
					D1: { t: 's', v: this.translate.instant('dialogs.type') },
					E1: { t: 's', v: this.translate.instant('dialogs.number') },
					F1: { t: 's', v: this.translate.instant('dialogs.timestamp') },
					G1: { t: 's', v: this.translate.instant('dialogs.identifier') },
					I1: { t: 's', v: this.translate.instant('dialogs.length') },
					J1: { t: 'n', v: settings.length }
				};

				for (var i = data.length - 1, j = 2; i >= 0; i-- , j++) {
					eventList['A' + j] = { t: 'n', v: i + 1, z: '0"."' };
					eventList['B' + j] = { t: 's', v: data[i].key };
					eventList['C' + j] = { t: 's', v: data[i].name };
					eventList['D' + j] = { t: 's', v: data[i].type };
					eventList['E' + j] = { t: 'n', v: data[i].freq };
					eventList['F' + j] = { t: 'n', v: data[i].time, z: '0.000' };
					eventList['G' + j] = { t: 's', v: data[i].ident };
				}

				eventList['!ref'] = 'A1:J' + (data.length + 1);
				wb.Sheets[this.translate.instant('dialogs.eventList')] = eventList;

				wb.SheetNames.push(this.translate.instant('dialogs.eventList'));
				var board = {
					A1: { t: 's', v: this.translate.instant('dialogs.key') },
					B1: { t: 's', v: this.translate.instant('dialogs.name') },
					C1: { t: 's', v: this.translate.instant('dialogs.type') }
				};

				for (var i = 0; i < keyboard.length; i++) {
					board['A' + (i + 2)] = { t: 's', v: keyboard[i].key };
					board['B' + (i + 2)] = { t: 's', v: keyboard[i].name };
					board['C' + (i + 2)] = { t: 's', v: keyboard[i].type };
				}

				board['!ref'] = 'A1:C' + (keyboard.length + 1);
				wb.Sheets[this.translate.instant('dialogs.events')] = board;

				window.XLSX.writeFileAsync(window.path.join(settings.folder, fileName) + '.' + type, wb, { bookType: type }, function(err) {
					if (err) reject(err);
					else resolve();
				});
			}
		});
	}

	importSheetNames(fileName) {
		return new Promise((resolve, reject) => {
			try {
				var workbook = window.XLSX.readFile(fileName);
				resolve(workbook.SheetNames);
			}
			catch (e) {
				reject(e);
			}
		});
	}

	importFile(fileName, opt) {
		return new Promise((resolve, reject) => {
			try {
				var workbook = window.XLSX.readFile(fileName);
				var sheet = workbook.Sheets[opt.sheet];

				var data = [];

				for (var i = opt.row; sheet[opt.ID + i] != undefined && sheet[opt.ID + i].v != '' && sheet[opt.ID + i].v != undefined; i++) {
					data.unshift({
						key: sheet[opt.key + i].v,
						name: sheet[opt.name + i].v,
						type: sheet[opt.type + i].v,
						freq: sheet[opt.freq + i].v,
						time: sheet[opt.time + i].v,
						ident: sheet[opt.ident + i].v
					});
				}

				var length = sheet[opt.length].v;

				var keyboard = [];
				sheet = workbook.Sheets[opt.keyboard];

				for (var i = opt.keyboardRow; sheet[opt.keyboardKey + i] != undefined && sheet[opt.keyboardKey + i].v != '' && sheet[opt.keyboardKey + i].v != undefined; i++) {
					keyboard.push({
						key: sheet[opt.keyboardKey + i].v,
						name: sheet[opt.keyboardName + i].v,
						type: sheet[opt.keyboardType + i].v
					});
				}

				resolve({ data: data, length: length, keyboard: keyboard });
			}
			catch (e) {
				reject(e);
			}
		});
	}
}
