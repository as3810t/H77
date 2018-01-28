import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

const isDevMode = process.execPath.match(/[\\/]electron/);

if(!isDevMode) {
	enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule);
