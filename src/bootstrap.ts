import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

declare var window: any;

const isDevMode = window.execPath.match(/[\\/]electron/);

if (!isDevMode) {
	enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule);
