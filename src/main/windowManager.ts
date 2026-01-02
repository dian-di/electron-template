/**
 * Window Manager - 窗口管理服务类
 *
 * 业界最佳实践：使用服务类管理所有窗口实例
 * 参考：VS Code, Slack, Discord 等 Electron 应用
 */

import { BrowserWindow, BrowserWindowConstructorOptions, screen, shell } from 'electron'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

export type WindowType = 'main' | 'floatBall' | 'popup'

interface WindowConfig {
  type: WindowType
  options: BrowserWindowConstructorOptions
  url?: string
  file?: string
  hash?: string
}

class WindowManager {
  private windows: Map<WindowType, BrowserWindow> = new Map()

  /**
   * 创建或获取窗口（单例模式）
   * 如果窗口已存在且未销毁，返回现有实例；否则创建新窗口
   */
  createOrGetWindow(type: WindowType): BrowserWindow | null {
    // 检查现有窗口
    const existing = this.windows.get(type)
    if (existing && !existing.isDestroyed()) {
      return existing
    }

    // 根据类型创建窗口
    const config = this.getWindowConfig(type)
    if (!config) {
      console.error(`Unknown window type: ${type}`)
      return null
    }

    const window = new BrowserWindow(config.options)

    // 设置窗口特定的事件处理
    this.setupWindowEvents(window, type)

    // 加载内容
    if (is.dev) {
      window.loadURL(config.url ?? '')
    } else if (config.file) {
      if (config.hash) {
        window.loadFile(config.file, { hash: config.hash })
      } else {
        window.loadFile(config.file)
      }
    }

    // 监听关闭事件，清理引用
    window.on('closed', () => {
      this.windows.delete(type)
    })

    // 存储窗口引用
    this.windows.set(type, window)
    return window
  }

  /**
   * 获取窗口实例（不创建）
   */
  getWindow(type: WindowType): BrowserWindow | null {
    const window = this.windows.get(type)
    return window && !window.isDestroyed() ? window : null
  }

  /**
   * 关闭指定窗口
   */
  closeWindow(type: WindowType): void {
    const window = this.windows.get(type)
    if (window && !window.isDestroyed()) {
      window.close()
      this.windows.delete(type)
    }
  }

  /**
   * 关闭所有窗口
   */
  closeAllWindows(): void {
    this.windows.forEach((window) => {
      if (!window.isDestroyed()) {
        window.close()
      }
    })
    this.windows.clear()
  }

  /**
   * 获取所有窗口
   */
  getAllWindows(): BrowserWindow[] {
    return Array.from(this.windows.values()).filter(
      window => !window.isDestroyed()
    )
  }

  /**
   * 设置窗口事件处理
   */
  private setupWindowEvents(window: BrowserWindow, type: WindowType): void {
    // 主窗口特定事件
    if (type === 'main') {
      // ready-to-show 事件
      window.on('ready-to-show', () => {
        window.show()
      })

      // 设置外部链接处理
      window.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
      })
    }

    // 弹窗窗口特定事件
    if (type === 'popup') {
      window.on('ready-to-show', () => {
        window.show()
      })
    }

    // 浮动球窗口特定事件
    if (type === 'floatBall') {
      // 设置窗口可拖拽
      window.setIgnoreMouseEvents(true, { forward: true })
    }
  }

  /**
   * 获取窗口配置
   */
  private getWindowConfig(type: WindowType): WindowConfig | null {
    switch (type) {
      case 'main':
        return {
          type: 'main',
          options: {
            width: 900,
            height: 670,
            show: false,
            autoHideMenuBar: true,
            ...(process.platform === 'linux' ? { icon } : {}),
            webPreferences: {
              preload: join(__dirname, '../preload/index.js'),
              sandbox: false,
            },
          },
          url: is.dev && process.env.ELECTRON_RENDERER_URL
            ? `${process.env.ELECTRON_RENDERER_URL}/index.html`
            : undefined,
          file: !is.dev || !process.env.ELECTRON_RENDERER_URL
            ? join(__dirname, '../renderer/index.html')
            : undefined,
        }

      case 'floatBall': {
        const primaryDisplay = screen.getPrimaryDisplay()
        const { width, height } = primaryDisplay.workAreaSize
        return {
          type: 'floatBall',
          options: {
            width: 190,
            height: 170,
            frame: false,
            show: true,
            skipTaskbar: true,
            transparent: true,
            resizable: false,
            alwaysOnTop: true,
            x: width - 220,
            y: height - 180,
            webPreferences: {
              preload: join(__dirname, '../preload/index.js'),
              nodeIntegration: true,
              contextIsolation: true,
            },
          },
          url: is.dev && process.env.ELECTRON_RENDERER_URL
            ? `${process.env.ELECTRON_RENDERER_URL}/float.html`
            : undefined,
          file: !is.dev || !process.env.ELECTRON_RENDERER_URL
            ? join(__dirname, '../renderer/float.html')
            : undefined,
        }
      }

      case 'popup':
        return {
          type: 'popup',
          options: {
            width: 600,
            height: 400,
            show: false,
            autoHideMenuBar: true,
            ...(process.platform === 'linux' ? { icon } : {}),
            webPreferences: {
              preload: join(__dirname, '../preload/index.js'),
              sandbox: false,
            },
          },
          url: is.dev && process.env.ELECTRON_RENDERER_URL
            ? `${process.env.ELECTRON_RENDERER_URL}/float.html#popup`
            : undefined,
          file: !is.dev || !process.env.ELECTRON_RENDERER_URL
            ? join(__dirname, '../renderer/float.html')
            : undefined,
          hash: 'popup',
        }

      default:
        return null
    }
  }
}

// 导出单例实例（业界标准做法）
export const windowManager = new WindowManager()

// 便捷方法（可选，为了向后兼容）
export function createMainWindow(): BrowserWindow {
  const window = windowManager.createOrGetWindow('main')
  if (!window) {
    throw new Error('Failed to create main window')
  }
  return window
}

export function getMainWindow(): BrowserWindow | null {
  return windowManager.getWindow('main')
}

export function createFloatBallWindow(): BrowserWindow | null {
  return windowManager.createOrGetWindow('floatBall')
}

export function getFloatBallWindow(): BrowserWindow | null {
  return windowManager.getWindow('floatBall')
}

export function createPopupWindow(): BrowserWindow | null {
  return windowManager.createOrGetWindow('popup')
}

export function getPopupWindow(): BrowserWindow | null {
  return windowManager.getWindow('popup')
}

