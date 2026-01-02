# Electron 窗口单例模式 - 业界最佳实践

## 概述

在 Electron 应用中，需要在多个文件中共享窗口实例是一个常见需求。本文档总结了业界常见的实现方式及其优缺点。

## 实现方式对比

### 方式1: 模块级变量 + 工厂函数 ⭐⭐⭐

**当前项目使用的方式**

```typescript
// main/index.ts
let mainWindow: BrowserWindow | null = null

export function createMainWindow(): BrowserWindow {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return mainWindow
  }
  mainWindow = new BrowserWindow({ /* ... */ })
  return mainWindow
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}
```

**优点：**
- ✅ 简单直接，代码量少
- ✅ 易于理解
- ✅ 适合小型项目

**缺点：**
- ❌ 窗口逻辑分散
- ❌ 难以扩展多窗口类型
- ❌ 难以测试

**适用场景：** 小型项目，窗口数量少（1-2个）

---

### 方式2: Window Manager 服务类 ⭐⭐⭐⭐⭐

**业界推荐方式（VS Code, Slack, Discord 等）**

```typescript
// windowManager.ts
class WindowManager {
  private windows: Map<string, BrowserWindow> = new Map()

  createOrGetWindow(name: string, config: WindowConfig): BrowserWindow {
    const existing = this.windows.get(name)
    if (existing && !existing.isDestroyed()) {
      return existing
    }
    const window = new BrowserWindow(config.options)
    this.windows.set(name, window)
    return window
  }

  getWindow(name: string): BrowserWindow | null {
    const window = this.windows.get(name)
    return window && !window.isDestroyed() ? window : null
  }
}

export const windowManager = new WindowManager()
```

**优点：**
- ✅ 职责清晰，窗口管理逻辑集中
- ✅ 易于扩展，支持多窗口类型
- ✅ 易于测试，可以 mock 整个 WindowManager
- ✅ 类型安全，TypeScript 支持良好
- ✅ 支持批量操作（关闭所有窗口等）

**缺点：**
- ❌ 代码量稍多
- ❌ 需要一定的架构设计

**适用场景：** 中大型项目，多窗口应用

**实际案例：**
- **VS Code**: 使用 `WindowManager` 类管理所有编辑器窗口
- **Slack**: 使用 `WindowService` 管理主窗口和设置窗口
- **Discord**: 使用 `WindowRegistry` 管理多个窗口实例

---

### 方式3: 命名空间模式 ⭐⭐⭐

```typescript
namespace WindowRegistry {
  const windows: Map<string, BrowserWindow> = new Map()

  export function createMainWindow(): BrowserWindow {
    const existing = windows.get('main')
    if (existing) return existing
    const window = new BrowserWindow({ /* ... */ })
    windows.set('main', window)
    return window
  }
}
```

**优点：**
- ✅ 命名空间隔离，避免全局污染
- ✅ 适合需要类型安全的场景

**缺点：**
- ❌ 扩展性一般
- ❌ 命名空间在 ES6 模块中支持有限

**适用场景：** 需要命名空间隔离的场景

---

### 方式4: 类单例模式 ⭐⭐⭐⭐

```typescript
class WindowService {
  private static instance: WindowService
  private windows: Map<string, BrowserWindow> = new Map()

  private constructor() {}

  static getInstance(): WindowService {
    if (!WindowService.instance) {
      WindowService.instance = new WindowService()
    }
    return WindowService.instance
  }
}
```

**优点：**
- ✅ 严格的单例模式
- ✅ 私有构造函数防止外部实例化

**缺点：**
- ❌ 代码复杂度较高
- ❌ 在 Node.js 模块系统中，模块本身就是单例

**适用场景：** 需要严格单例控制的场景

---

## 业界最佳实践推荐

### 🏆 推荐：Window Manager 服务类

**理由：**
1. **可扩展性**：易于添加新窗口类型
2. **可维护性**：窗口管理逻辑集中
3. **可测试性**：可以轻松 mock 和测试
4. **类型安全**：TypeScript 支持良好
5. **实际应用**：被 VS Code、Slack、Discord 等大型应用采用

### 实现示例

已创建 `src/main/windowManager.ts`，包含：
- `WindowManager` 类：核心窗口管理逻辑
- `windowManager` 单例实例：全局窗口管理器
- 便捷方法：`createMainWindow()`, `getMainWindow()` 等

### 使用方式

```typescript
// 方式1: 使用便捷方法（向后兼容）
import { createMainWindow, getMainWindow } from './main/windowManager'
const mainWindow = createMainWindow()

// 方式2: 直接使用 WindowManager（推荐）
import { windowManager } from './main/windowManager'
const mainWindow = windowManager.createOrGetWindow('main')
const floatBall = windowManager.createOrGetWindow('floatBall')
```

---

## 迁移建议

### 从方式1迁移到方式2

1. **保留现有 API**：保持 `createMainWindow()` 等函数，内部调用 `windowManager`
2. **逐步迁移**：新窗口使用 `windowManager`，旧代码保持不变
3. **统一管理**：最终将所有窗口创建逻辑迁移到 `WindowManager`

### 迁移步骤

```typescript
// 步骤1: 创建 windowManager.ts（已完成）

// 步骤2: 在 main/index.ts 中使用 windowManager
import { windowManager } from './windowManager'

// 步骤3: 保持向后兼容
export function createMainWindow() {
  return windowManager.createOrGetWindow('main')
}

// 步骤4: 逐步迁移其他文件
// 在 services/main.ts 中
import { windowManager } from '../main/windowManager'
const mainWindow = windowManager.getWindow('main')
```

---

## 总结

| 方式 | 复杂度 | 可扩展性 | 可维护性 | 推荐度 |
|------|--------|----------|----------|--------|
| 模块变量 + 工厂函数 | ⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| Window Manager 服务类 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 命名空间模式 | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| 类单例模式 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

**建议：**
- 小型项目（1-2个窗口）：使用方式1
- 中大型项目（3+个窗口）：使用方式2（Window Manager）
- 需要严格单例控制：使用方式4

---

## 参考资料

- [Electron 官方文档 - 窗口管理](https://www.electronjs.org/docs/latest/api/browser-window)
- [VS Code 源码 - Window Manager](https://github.com/microsoft/vscode)
- [设计模式 - 单例模式](https://refactoring.guru/design-patterns/singleton)

