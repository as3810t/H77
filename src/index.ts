import { app, dialog, BrowserWindow, Menu, MenuItemConstructorOptions } from 'electron';
import { enableLiveReload } from 'electron-compile';
import { ElectronTranslate } from './translate';

const isDevMode = process.execPath.match(/[\\/]electron/);

if (isDevMode) enableLiveReload();

const handleSquirrelEvent = () => {
	if (process.argv.length === 1) {
		return false;
	}

	const ChildProcess = require('child_process');
	const path = require('path');

	const appFolder = path.resolve(process.execPath, '..');
	const rootAtomFolder = path.resolve(appFolder, '..');
	const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
	const exeName = path.basename(process.execPath);

	const spawn = function(command, args) {
		let spawnedProcess, error;

		try {
			spawnedProcess = ChildProcess.spawn(command, args, { detached: true });
		} catch (error) { }

		return spawnedProcess;
	};

	const spawnUpdate = function(args) {
		return spawn(updateDotExe, args);
	};

	const squirrelEvent = process.argv[1];
	switch (squirrelEvent) {
		case '--squirrel-install':
		case '--squirrel-updated':
			// Optionally do things such as:
			// - Add your .exe to the PATH
			// - Write to the registry for things like file associations and
			//   explorer context menus

			// Install desktop and start menu shortcuts
			spawnUpdate(['--createShortcut', exeName]);

			setTimeout(app.quit, 1000);
			return true;

		case '--squirrel-uninstall':
			// Undo anything you did in the --squirrel-install and
			// --squirrel-updated handlers

			// Remove desktop and start menu shortcuts
			spawnUpdate(['--removeShortcut', exeName]);

			setTimeout(app.quit, 1000);
			return true;

		case '--squirrel-obsolete':
			// This is called on the outgoing version of your app before
			// we update to the new version - it's the opposite of
			// --squirrel-updated

			app.quit();
			return true;
	}

	return false;
};

if (handleSquirrelEvent()) {
	app.quit();
}

let win: Electron.BrowserWindow | null = null;
let splash: Electron.BrowserWindow | null = null;

const translate = new ElectronTranslate({
	folder: './assets/lang',
	defaultLang: 'en'
});

const changeLanguage = async (lang) => {
	await win.webContents.executeJavaScript(`localStorage.setItem("lang", '${lang}')`);
	translate.use(lang);
	dialog.showMessageBox({
		type: 'info',
		buttons: [translate.instant('menu.language.OK')],
		title: translate.instant('menu.language.changeTitle'),
		message: 'The language settings have been changed! H77+ will reload for changes to take efect.\n\n' + translate.instant('menu.language.changed')
	});
	win.reload();
};

const menuTemplate: () => MenuItemConstructorOptions[] = () => {
	let template: MenuItemConstructorOptions[] = [
		{
			label: translate.instant('menu.file.title'),
			submenu: [
				{ label: translate.instant('menu.file.openSettings'), accelerator: 'CmdOrCtrl+O', click: () => { win.webContents.send('openSettingsFile') } },
				{ label: translate.instant('menu.file.openKeys'), accelerator: 'CmdOrCtrl+I', click: () => { win.webContents.send('openKeyboardFile') } },
				{ type: 'separator' },
				{ label: translate.instant('menu.file.saveMeasurement'), accelerator: 'CmdOrCtrl+S', click: () => { win.webContents.send('saveAnalysis') } },
				{ type: 'separator' },
				{ label: translate.instant('menu.file.restart'), role: 'reload' },
				{ label: translate.instant('menu.file.exit'), role: 'quit' }
			]
		},
		{
			label: translate.instant('menu.actions.title'),
			submenu: [
				{ label: translate.instant('menu.actions.newSettings'), click: () => { win.webContents.send('createSettingsFile') } },
				{ label: translate.instant('menu.actions.openSettings'), accelerator: 'CmdOrCtrl+O', click: () => { win.webContents.send('openSettingsFile') } },
				{ type: 'separator' },
				{ label: translate.instant('menu.actions.saveSettings'), click: () => { win.webContents.send('saveSettingsFile') } },
				{ label: translate.instant('menu.actions.saveAsSettings'), click: () => { win.webContents.send('saveAsSettingsFile') } },
				{ type: 'separator' },
				{ label: translate.instant('menu.actions.newKeys'), click: () => { win.webContents.send('createKeyboardFile') } },
				{ label: translate.instant('menu.actions.openKeys'), accelerator: 'CmdOrCtrl+I', click: () => { win.webContents.send('openKeyboardFile') } },
				{ type: 'separator' },
				{ label: translate.instant('menu.actions.saveKeys'), click: () => { win.webContents.send('saveKeyboardFile') } },
				{ label: translate.instant('menu.actions.saveAsKeys'), click: () => { win.webContents.send('saveAsKeyboardFile') } },
				{ type: 'separator' },
				{ label: translate.instant('menu.actions.saveMeasurement'), click: () => { win.webContents.send('saveAnalysis') }, accelerator: 'CmdOrCtrl+S' },
				{ label: translate.instant('menu.actions.editMeasurement'), click: () => { win.webContents.send('editAnalysis') } },
				{ type: 'separator' },
				{ label: translate.instant('menu.actions.splitFile'), click: () => { win.webContents.send('splitFile') } },
				{ label: translate.instant('menu.actions.clipFile'), click: () => { win.webContents.send('clipFile') } },
				{ label: translate.instant('menu.actions.mergeFiles'), click: () => { win.webContents.send('mergeFiles') } },
				{ label: translate.instant('menu.actions.editFile'), click: () => { win.webContents.send('editFile') } }
			]
		},
		{
			label: translate.instant('menu.analysis.title'),
			submenu: [
				{ label: translate.instant('menu.analysis.saveMeasurement'), click: () => { win.webContents.send('saveAnalysis') }, accelerator: 'CmdOrCtrl+S' },
				{ label: translate.instant('menu.analysis.editMeasurement'), click: () => { win.webContents.send('editAnalysis') } },
				{ type: 'separator' },
				{ label: translate.instant('menu.analysis.showOccurences'), type: 'checkbox', checked: true, click: () => { win.webContents.send('showKeyboardAnalysis') } },
				{ label: translate.instant('menu.analysis.showOccurencesInSidebar'), type: 'checkbox', checked: false, click: () => { win.webContents.send('showDataAnalysis') } },
				{ type: 'separator' },
				{ label: translate.instant('menu.analysis.videoSettings'), click: () => { win.webContents.send('configureVideo') } }
			]
		},
		{
			label: translate.instant('menu.other.title'),
			submenu: [
				{ label: translate.instant('menu.other.minimize'), role: 'minimize' },
				{ label: translate.instant('menu.other.fullScreen'), role: 'togglefullscreen' },
				{ type: 'separator' },
				{ label: translate.instant('menu.other.zoomIn'), role: 'zoomin', accelerator: 'CmdOrCtrl+Plus' },
				{ label: translate.instant('menu.other.zoomOut'), role: 'zoomout', accelerator: 'CmdOrCtrl+-' },
				{ label: translate.instant('menu.other.zoomReset'), role: 'resetzoom', accelerator: 'CmdOrCtrl+0' },
				{ type: 'separator' },
				{ label: translate.instant('menu.other.developerMode'), role: 'toggledevtools' },
				{ label: translate.instant('menu.other.forceReload'), role: 'forcereload' },
				{ type: 'separator' },
				{ label: translate.instant('menu.other.about'), accelerator: 'CmdOrCtrl+H', click: () => { win.webContents.send('about') } }
			]
		}
	];

	let languages = translate.getLanguages();
	languages.sort((a, b) => { return a.name < b.name ? -1 : 1; });
	let langMenu = [];
	for (let lang of languages) {
		langMenu.push({
			label: lang.name,
			type: 'radio',
			checked: lang.code == translate.getCurrentLanguage(),
			click: () => { changeLanguage(lang.code); }
		});
	}

	template.push({
		label: 'Language',
		submenu: langMenu
	});

	return template;
}

const createWindow = async () => {
	win = new BrowserWindow({
		width: 900,
		height: 600,
		show: false,
		icon: `${__dirname}/assets/favicon.ico`,
		webPreferences: {
			webSecurity: false
		}
	});

	splash = new BrowserWindow({
		width: 400,
		height: 400,
		frame: false,
		backgroundColor: '#ffffff',
		icon: `${__dirname}/assets/favicon.ico`
	});

	splash.loadURL(`file://${__dirname}/assets/splash/splash.html`);

	win.loadURL(`file://${__dirname}/index.html`);

	if (isDevMode) {
		win.webContents.openDevTools();
	}

	win.webContents.on('did-finish-load', async () => {
		const lang = await win.webContents.executeJavaScript('localStorage.getItem("lang")') || 'en';
		translate.use(lang);

		Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate()));
	});

	win.once('ready-to-show', () => {
		win.show();
		splash.hide();
	});

	win.on('closed', () => {
		app.quit();
	});
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	if (win === null) {
		createWindow();
	}
});
