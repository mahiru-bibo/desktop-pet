"use strict";
// System tray icon and context menu
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTray = createTray;
exports.refreshTrayMenu = refreshTrayMenu;
exports.setObserverEnabled = setObserverEnabled;
const electron_1 = require("electron");
let tray = null;
let _observerEnabled = false;
let _onToggleObserver = null;
// Base64 tray icon
const TRAY_ICON_B64 = 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAMlJREFUWEftlrENwjAURc8fBaJg' +
    'BEZgBEZgBEZgBDo6OkZgBEZgBDpgBDpgBDpgBBo6CiQUJThxbMfYTqzo/9LX9/3vZyuABw4c4B+AjlLOAN4AvgB8Adq2XcUY' +
    'nwFsAJwBqGl6CwFSSlsAD0rpCcDGGFe7BQBQCoAFABtj3NVaF0rpI4AXANZaF2YIMQDaOl8AbgBQSmFKKTjnWgAKIYSU0kop' +
    'x5xzE93BdV0PDAaDJIAQYg5gDmARQhgjIAeQYzO/w/3fe/+ZfW8/gG8EAPh3HgD6KxiFAAAAAElFTkSuQmCC';
function buildMenu(petWindow, chatWindow) {
    return electron_1.Menu.buildFromTemplate([
        {
            label: '显示/隐藏宠物',
            click: () => {
                if (petWindow.isVisible())
                    petWindow.hide();
                else
                    petWindow.show();
            },
        },
        {
            label: '打开聊天',
            click: () => {
                petWindow.webContents.send('pet:toggle-chat-from-tray');
            },
        },
        { type: 'separator' },
        {
            label: '观察屏幕',
            type: 'checkbox',
            checked: _observerEnabled,
            click: (menuItem) => {
                if (_onToggleObserver) {
                    const enabled = _onToggleObserver();
                    _observerEnabled = enabled;
                    menuItem.checked = enabled;
                }
            },
        },
        { type: 'separator' },
        {
            label: '退出',
            click: () => { require('electron').app.exit(0); },
        },
    ]);
}
function createTray(petWindow, chatWindow, onToggleObserver) {
    if (onToggleObserver)
        _onToggleObserver = onToggleObserver;
    const icon = electron_1.nativeImage.createFromDataURL(`data:image/png;base64,${TRAY_ICON_B64}`);
    tray = new electron_1.Tray(icon.resize({ width: 16, height: 16 }));
    tray.setToolTip('Desktop Pet 🎀');
    const menu = buildMenu(petWindow, chatWindow);
    tray.setContextMenu(menu);
    tray.on('double-click', () => {
        petWindow.show();
        petWindow.focus();
    });
    return tray;
}
function refreshTrayMenu(petWindow, chatWindow) {
    if (tray) {
        tray.setContextMenu(buildMenu(petWindow, chatWindow));
    }
}
function setObserverEnabled(enabled) {
    _observerEnabled = enabled;
}
//# sourceMappingURL=tray.js.map