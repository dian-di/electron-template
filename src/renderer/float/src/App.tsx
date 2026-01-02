import { useRef, useState } from 'react'
import './index.css'
import ipcRenderService from '@services/render'
import React from 'react'

function FloatBall(): React.JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false)
  const isDraggingRef = useRef(false)
  const initialMouseXRef = useRef(0)
  const initialMouseYRef = useRef(0)
  const mouseDownTimeRef = useRef(0)
  const windowInitialXRef = useRef(0)
  const windowInitialYRef = useRef(0)

  // 处理鼠标按下事件
  const handleMouseDown = (e: React.MouseEvent): void => {
    e.stopPropagation()
    if (isExpanded) return // 展开状态不允许拖动

    isDraggingRef.current = false
    initialMouseXRef.current = e.screenX
    initialMouseYRef.current = e.screenY
    mouseDownTimeRef.current = Date.now()

    // 获取窗口初始位置
    ipcRenderService.getPosition().then(([x, y]: [number, number]) => {
      windowInitialXRef.current = x
      windowInitialYRef.current = y

      const handleMouseMove = (moveEvent: MouseEvent): void => {
        const deltaX = moveEvent.screenX - initialMouseXRef.current
        const deltaY = moveEvent.screenY - initialMouseYRef.current

        // 判断是否达到拖动阈值
        if (!isDraggingRef.current && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
          isDraggingRef.current = true
        }

        if (isDraggingRef.current) {
          // 计算新位置
          const newX = windowInitialXRef.current + deltaX
          const newY = windowInitialYRef.current + deltaY

          // 发送新位置到主进程
          ipcRenderService.setPosition({ x: newX, y: newY })
        }
      }

      const handleMouseUp = (): void => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)

        // 如果不是拖拽且点击时间小于200ms，则触发展开/收起
        if (!isDraggingRef.current && Date.now() - mouseDownTimeRef.current < 200) {
          setIsExpanded(!isExpanded)
        }
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    })
  }

  const handleMouseEnter = (): void => {
    ipcRenderService.sendMouseEnter()
  }

  const handleMouseLeave = (): void => {
    ipcRenderService.sendMouseLeave()
  }

  const handleAction = (action: string): void => {
    switch (action) {
      case 'restore':
        ipcRenderService.restoreMain()
        break
      case 'dashboard':
        ipcRenderService.restoreMain({ route: 'INDEX' })
        break
      case 'settings':
        ipcRenderService.restoreMain({ route: 'SETTINGS' })
        break
    }
    setIsExpanded(false)
  }

  return (
    <div
      className={`mini-window ${isExpanded ? 'expanded' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role='presentation'
      aria-hidden='true'
      tabIndex={-1}
      style={{ outline: 'none' }}
    >
      {/* 折叠状态 */}
      <div className='mini-content'>
        <span className='mini-bg'>123</span>
      </div>

      {/* 展开状态 */}
      <div
        className='expanded-content'
        onMouseDown={(e) => e.stopPropagation()}
        role='presentation'
        aria-hidden='true'
      >
        <div className='actions'>
          <button
            type='button'
            className='action-item'
            onClick={() => handleAction('restore')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleAction('restore')
              }
            }}
          >
            <span className='icon'>⛶</span>
            <span>还原</span>
          </button>
          <button
            type='button'
            className='action-item'
            onClick={() => handleAction('settings')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleAction('settings')
              }
            }}
          >
            <span className='icon'>⚙</span>
            <span>设置</span>
          </button>
          <button
            type='button'
            className='action-item'
            onClick={() => handleAction('dashboard')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleAction('dashboard')
              }
            }}
          >
            <span className='icon'>⌂</span>
            <span>仪表盘</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default FloatBall
