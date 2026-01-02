import type { IpcEvents } from '../types/ipcEvents'

/**
 * IPC Render Service - IPC 渲染进程通信服务
 *
 * 负责处理所有渲染进程的 IPC 通信
 * 提供类型安全的方法来与主进程通信
 */
export class IpcRenderService {
  private ipcRenderer: typeof window.electron.ipcRenderer

  constructor() {
    if (!window.electron?.ipcRenderer) {
      throw new Error('IPC Renderer is not available. Make sure preload script is loaded.')
    }
    this.ipcRenderer = window.electron.ipcRenderer
  }

  showFloatBall(): void {
    this.ipcRenderer.send('app:window:show-float-ball')
  }

  hideFloatBall(): void {
    this.ipcRenderer.send('app:window:hide-float-ball')
  }

  /**
   * 获取窗口位置
   */
  getPosition(): Promise<[number, number]> {
    return this.ipcRenderer.invoke('app:window:get-position')
  }

  /**
   * 设置窗口位置
   */
  setPosition(args: IpcEvents['app:window:set-position']): void {
    this.ipcRenderer.send('app:window:set-position', args)
  }

  /**
   * 发送鼠标进入事件
   */
  sendMouseEnter(): void {
    this.ipcRenderer.send('app:window:mouse-enter')
  }

  /**
   * 发送鼠标离开事件
   */
  sendMouseLeave(): void {
    this.ipcRenderer.send('app:window:mouse-leave')
  }

  /**
   * 还原主窗口
   */
  restoreMain(options?: IpcEvents['app:window:restore-main']): void {
    this.ipcRenderer.send('app:window:restore-main', options)
  }

  /**
   * 发送路由跳转事件
   */
  sendRoute(args: IpcEvents['app:route']): void {
    this.ipcRenderer.send('app:route', args)
  }
}

// 导出单例实例
const ipcRenderService = new IpcRenderService()
export default ipcRenderService

