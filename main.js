'use strict';

// const {BrowserWindow, Tray} = require('electron');
// const appIcon = new Tray('/Users/somebody/images/icon.png');
// let win = new BrowserWindow({icon: __dirname + '/images/notelg2.png'});
// const {app, globalShortcut} = require('electron')
const electron = require('electron');
const app = electron.app;
const globalShortcut = electron.globalShortcut;
const electronLocalshortcut = require('electron-localshortcut');
const path = require('path');
const url = require('url');
// const {dialog} = require('electron').remote;
const BW = electron.BrowserWindow;

// require('electron-reload')(__dirname);
const {dialog} = require('electron');

let mainWindow;
app.on('ready', function(){
	mainWindow = new BW({height: 600,width: 950,backgroundColor: "#f0f0f0", icon: __dirname + '/images/notelg2.png'});
	// mainWindow = new BW({height: 560,width: 580,backgroundColor: "#f0f0f0"});
	// mainWindow.loadURL('https://github.com');
	mainWindow.loadURL(url.format({
		pathname: path.join(__dirname, 'index.html'),
		protocol: 'file',
		slashes: true
	}));


    /*****KEYBOARD SHORTCUTS*****/
    // PLAY / PAUSE
	electronLocalshortcut.register('Space', function () {
        mainWindow.webContents.send('global-shortcut', 0);
    });

    // NEXT
    electronLocalshortcut.register('N', function () {
        mainWindow.webContents.send('global-shortcut', 1);
    });

    // PREVIOUS
    electronLocalshortcut.register('P', function () {
        mainWindow.webContents.send('global-shortcut', 2);
    });

    // SHORT SKIP NEXT BACK
    electronLocalshortcut.register('Shift+Right', function () {
        mainWindow.webContents.send('global-shortcut', 3);
    });
    electronLocalshortcut.register('Shift+Left', function () {
        mainWindow.webContents.send('global-shortcut', 4);
    });

    // LONG SKIP NEXT BACK
    electronLocalshortcut.register('Ctrl+Right', function () {
        mainWindow.webContents.send('global-shortcut', 5);
    });
    electronLocalshortcut.register('Ctrl+Left', function () {
        mainWindow.webContents.send('global-shortcut', 6);
    });

    // REPEAT
    electronLocalshortcut.register('R', function () {
        mainWindow.webContents.send('global-shortcut', 7);
    });

    // SHUFFLE
    electronLocalshortcut.register('S', function () {
        mainWindow.webContents.send('global-shortcut', 8);
    });

    // OPEN FOLDERS
    electronLocalshortcut.register('Ctrl+O', function () {
        mainWindow.webContents.send('global-shortcut', 9);
    });

    // VOLUME UP / DOWN / MUTE
    electronLocalshortcut.register('Ctrl+Down', function () {
        mainWindow.webContents.send('global-shortcut', 10);
    });
    electronLocalshortcut.register('Ctrl+Up', function () {
        mainWindow.webContents.send('global-shortcut', 11);
    });
    electronLocalshortcut.register('Ctrl+M', function () {
        mainWindow.webContents.send('global-shortcut', 12);
    });


    // TOGGLE LYRICS / TABS
    electronLocalshortcut.register('Ctrl+Shift+L', function () {
        mainWindow.webContents.send('global-shortcut', 13);
    });
    electronLocalshortcut.register('Ctrl+Shift+T', function () {
        mainWindow.webContents.send('global-shortcut', 14);
    });
});