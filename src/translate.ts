const fs = require('fs');
const path = require('path');

import { TranslateLoader } from '@ngx-translate/core';
import { Observable } from 'rxjs';

declare var window: any;

function languageEquiv(lang) {
	if (lang.substring(0, 2) == 'en') return 'en';
	else if (lang.substring(0, 2) == 'de') return 'de';
	else if (lang.substring(0, 2) == 'es') return 'es';
	else if (lang.substring(0, 2) == 'fr') return 'fr';
	else if (lang.substring(0, 2) == 'it') return 'it';
	else if (lang.substring(0, 2) == 'pt') return 'pt';
	else if (lang.substring(0, 2) == 'zh') return 'zh';
	else return lang;
}

export class AngularTranslateLoader implements TranslateLoader {
	private folder;
	private ext;

	constructor(options) {
		this.folder = options.folder;
		this.ext = options.ext;
	}

	getTranslation(lang: string): Observable<any> {
		lang = languageEquiv(lang);
		let fileName = path.join(window.__dirname, this.folder, lang) + this.ext;
		return Observable.of(JSON.parse(window.fs.readFileSync(fileName)));
	}
}

export class ElectronTranslate {
	private dict: any;
	private defaultLang;
	private curLang;

	constructor(options: any) {
		this.dict = [];
		fs.readdirSync(path.join(__dirname, options.folder)).forEach((file) => {
			this.defaultLang = languageEquiv(options.defaultLang);
			this.curLang = this.defaultLang;

			const fileName = path.join(__dirname, options.folder, file);
			try {
				const curLang = JSON.parse(fs.readFileSync(fileName));
				const curLangCode = file.split('.')[0];
				const curLangName = curLang.lang;

				this.dict[curLangCode] = {
					code: curLangCode,
					name: curLangName,
					lang: curLang
				};
			}
			catch (e) {
				return;
			}
		});
	}

	use(lang) {
		lang = languageEquiv(lang);
		if (this.dict[lang] == undefined) throw 'Unsupported language';
		this.curLang = lang;
	}

	instant(key) {
		const keys = key.split('.');

		let value = this.getValue(this.curLang, keys);
		if (value) return value;

		value = this.getValue(this.defaultLang, keys);
		if (value) return value;

		return key;
	}

	getLanguages() {
		let langs = [];
		for (let lang in this.dict) {
			langs.push({
				name: this.dict[lang].name,
				code: this.dict[lang].code
			});
		}
		return langs;
	}

	getCurrentLanguage() {
		return this.curLang;
	}

	private getValue(lang, keys) {
		let value = this.dict[lang].lang;
		for (let key of keys) {
			if (value == undefined) return null;
			value = value[key];
		}
		if (typeof value != 'string') return null;
		return value;
	}
}
