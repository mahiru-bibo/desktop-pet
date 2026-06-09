"use strict";
// System tray icon and context menu
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTray = createTray;
const electron_1 = require("electron");
const chatWindow_1 = require("./windows/chatWindow");
let tray = null;
function createTray(petWindow, chatWindow) {
    // Create a simple 16x16 tray icon programmatically (green pixel character face)
    const icon = electron_1.nativeImage.createFromDataURL('data:image/png;base64,' +
        'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAMlJREFUWEftlrENwjAURc8fBaJg' +
        'BEZgBEZgBEZgBDo6OkZgBEZgBDpgBDpgBDpgBBo6CiQUJThxbMfYTqzo/9LX9/3vZyuABw4c4B+AjlLOAN4AvgB8Adq2XcUY' +
        'nwFsAJwBqGl6CwFSSlsAD0rpCcDGGFe7BQBQCoAFABtj3NVaF0rpI4AXANZaF2YIMQDaOl8AbgBQSmFKKTjnWgAKIYSU0kop' +
        'x5xzE93BdV0PDAaDJIAQYg5gDmARQhgjIAeQYzO/w/3fe/+ZfW8/gG8EAPh3HgD6KxiFAAAAAElFTkSuQmCC');
    tray = new electron_1.Tray(icon.resize({ width: 16, height: 16 }));
    tray.setToolTip('Desktop Pet 🎀');
    const contextMenu = electron_1.Menu.buildFromTemplate([
        {
            label: '显示/隐藏宠物',
            click: () => {
                if (petWindow.isVisible()) {
                    petWindow.hide();
                }
                else {
                    petWindow.show();
                }
            },
        },
        {
            label: '打开聊天',
            click: () => {
                const cw = (0, chatWindow_1.getChatWindow)() || chatWindow;
                cw.show();
                cw.focus();
            },
        },
        { type: 'separator' },
        {
            label: '退出',
            click: () => {
                // Actually quit
                const { app } = require('electron');
                app.exit(0);
            },
        },
    ]);
    tray.setContextMenu(contextMenu);
    // Double-click tray icon to show pet
    tray.on('double-click', () => {
        petWindow.show();
        petWindow.focus();
    });
    return tray;
}
//# sourceMappingURL=tray.js.map