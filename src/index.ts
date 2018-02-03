import { app, BrowserWindow, Menu, MenuItemConstructorOptions } from 'electron';
import { enableLiveReload } from 'electron-compile';

const isDevMode = process.execPath.match(/[\\/]electron/);

if (isDevMode) enableLiveReload();

let win: Electron.BrowserWindow | null = null;
let splash: Electron.BrowserWindow | null = null;

const menuTemplate: MenuItemConstructorOptions[] = [
	{
		label: 'Fájl',
		submenu: [
			{ label: 'Beállításfájl megnyitása', accelerator: 'CmdOrCtrl+O', click: () => { win.webContents.send('openSettingsFile') } },
			{ label: 'Billentyűfájl megnyitása', accelerator: 'CmdOrCtrl+I', click: () => { win.webContents.send('openKeyboardFile') } },
			{ type: 'separator' },
			{ label: 'Mérés mentése', accelerator: 'CmdOrCtrl+S', click: () => { win.webContents.send('saveAnalysis') } },
			{ type: 'separator' },
			{ label: 'Újraindítás', role: 'reload' },
			{ label: 'Kilépés', role: 'quit' }
		]
	},
	{
		label: 'Műveletek',
		submenu: [
			{ label: 'Új beállításfájl', click: () => { win.webContents.send('createSettingsFile') } },
			{ label: 'Beállításfájl megnyitása', accelerator: 'CmdOrCtrl+O', click: () => { win.webContents.send('openSettingsFile') } },
			{ type: 'separator' },
			{ label: 'Beállításfájl mentése', click: () => { win.webContents.send('saveSettingsFile') } },
			{ label: 'Beállításfájl mentése másként', click: () => { win.webContents.send('saveAsSettingsFile') } },
			{ type: 'separator' },
			{ label: 'Új billentyűfájl', click: () => { win.webContents.send('createKeyboardFile') } },
			{ label: 'Billentyűfájl megnyitása', accelerator: 'CmdOrCtrl+I', click: () => { win.webContents.send('openKeyboardFile') } },
			{ type: 'separator' },
			{ label: 'Billentyűfájl mentése', click: () => { win.webContents.send('saveKeyboardFile') } },
			{ label: 'Billentyűfájl mentése másként', click: () => { win.webContents.send('saveAsKeyboardFile') } },
			{ type: 'separator' },
			{ label: 'Mérés mentése', click: () => { win.webContents.send('saveAnalysis') }, accelerator: 'CmdOrCtrl+S' },
			{ label: 'Mérési adatok szerkesztése', click: () => { win.webContents.send('editAnalysis') } },
			{ type: 'separator' },
			{ label: 'Mérés darabolása', click: () => { win.webContents.send('splitFile') } },
			{ label: 'Mérésből kivágás', click: () => { win.webContents.send('clipFile') } },
			{ label: 'Mérési fájlok egyesítése', click: () => { win.webContents.send('mergeFiles') } },
			{ label: 'Mérési adatok szerkesztése', click: () => { win.webContents.send('editFile') } }
		]
	},
	{
		label: 'Elemzés',
		submenu: [
			{ label: 'Mérés mentése', click: () => { win.webContents.send('saveAnalysis') }, accelerator: 'CmdOrCtrl+S' },
			{ label: 'Mérési adatok szerkesztése', click: () => { win.webContents.send('editAnalysis') } },
			{ type: 'separator' },
			{ label: 'Események mutatása', type: 'checkbox', checked: true, click: () => { win.webContents.send('showKeyboardAnalysis') } },
			{ label: 'Mérési adatok oldalsávban mutatása', type: 'checkbox', checked: false, click: () => { win.webContents.send('showDataAnalysis') } },
			{ type: 'separator' },
			{ label: 'Videó konfigurálása', click: () => { win.webContents.send('configureVideo') } }
		]
	},
	{
		label: 'Egyéb',
		submenu: [
			{ label: 'Tálcára', role: 'minimize' },
			{ label: 'Teljes képernyő', role: 'togglefullscreen' },
			{ type: 'separator' },
			{ label: 'Nagyítás', role: 'zoomin', accelerator: 'CmdOrCtrl+Plus' },
			{ label: 'Kicsinyítés', role: 'zoomout', accelerator: 'CmdOrCtrl+-' },
			{ label: 'Nagyítás visszaállítása', role: 'resetzoom', accelerator: 'CmdOrCtrl+0' },
			{ type: 'separator' },
			{ label: 'Fejlesző mód', role: 'toggledevtools' },
			{ label: 'Erőltetett újraindítás', role: 'forcereload' },
			{ type: 'separator' },
			{ label: 'Névjegy', accelerator: 'CmdOrCtrl+H', click: () => { win.webContents.send('about') } }
		]
	}
];

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

	win.webContents.on('did-finish-load', () => {
		Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
	});

	win.once('ready-to-show', () => {
		win.show();
		splash.hide();
	});

	win.on('closed', () => {
		win = null;
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
