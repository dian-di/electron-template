import { ipcMain, IpcMainEvent } from 'electron'
import type { IpcEvents } from '../types/ipcEvents'
import { windowManager } from '../main/windowManager'

export class IpcMainService {
  registerEvents(): void {
    ipcMain.handle('app:window:get-position', () => {
      return this.handleGetPosition()
    })

    // 使用 on 的事件（单向通信）
    const handlers: {
      [K in keyof IpcEvents]?: (event: IpcMainEvent, args: IpcEvents[K]) => void;
    } = {
      'ping': this.handlePing.bind(this),
      'open-popup': this.handleOpenPopup.bind(this),
      'app:window:mouse-enter': this.handleMouseEnter.bind(this),
      'app:window:mouse-leave': this.handleMouseLeave.bind(this),
      'app:window:set-position': this.handleSetPosition.bind(this),
      'app:window:restore-main': this.handleRestoreMain.bind(this),
      'app:route': this.handleRoute.bind(this),
    }

    Object.entries(handlers).forEach(([channel, handler]) => {
      if (handler) {
        ipcMain.on(channel, handler as any)
      }
    })
  }

  private handlePing(): void {
    console.log('pong')
  }

  private handleOpenPopup(): void {
    console.log('Opening popup')
    windowManager.createOrGetWindow('popup')
  }

  private handleMouseEnter(): void {
    const floatBallWindow = windowManager.getWindow('floatBall')
    if (floatBallWindow) {
      floatBallWindow.setIgnoreMouseEvents(false, { forward: true })
    }
  }

  private handleMouseLeave(): void {
    const floatBallWindow = windowManager.getWindow('floatBall')
    if (floatBallWindow) {
      floatBallWindow.setIgnoreMouseEvents(true, { forward: true })
    }
  }

  private handleGetPosition(): [number, number] {
    const floatBallWindow = windowManager.getWindow('floatBall')
    if (floatBallWindow) {
      const [x, y] = floatBallWindow.getPosition()
      // console.log('app:window:get-position', x, y)
      return [x, y]
    }
    return [0, 0]
  }

  /**
   * 处理设置窗口位置事件
   */
  private handleSetPosition(_: IpcMainEvent, args: IpcEvents['app:window:set-position']): void {
    const floatBallWindow = windowManager.getWindow('floatBall')
    if (floatBallWindow) {
      floatBallWindow.setPosition(Math.round(args.x), Math.round(args.y))
    }
  }

  /**
   * 处理还原主窗口事件
   */
  private handleRestoreMain(_: IpcMainEvent, options?: { route?: string }): void {
    let mainWindow = windowManager.getWindow('main')

    // 如果窗口不存在，创建新窗口
    if (!mainWindow) {
      mainWindow = windowManager.createOrGetWindow('main')
    }

    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore()
      }
      mainWindow.show()
      mainWindow.focus()

      // 如果指定了路由，发送路由跳转消息
      if (options?.route) {
        mainWindow.webContents.send('app:route', options.route)
      }
    }
  }

  /**
   * 处理路由跳转事件
   */
  private handleRoute(_: IpcMainEvent, args: IpcEvents['app:route']): void {
    const mainWindow = windowManager.getWindow('main')
    if (mainWindow) {
      mainWindow.webContents.send('app:route', args.route)
    }
  }
}

