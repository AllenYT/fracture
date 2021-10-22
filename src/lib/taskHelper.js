// task-helper.js
let taskPool = [] // 请求池
let numRequest = 0 // 正在执行数量
let maxRequest = 30 // 可配置
let taskTimer // 轮训的定时器
let cachedTask = {} // 存放的任务数据

// 预加载池的添加
export function addTaskIntoPool(task) {
  return new Promise((resolve, reject) => {
    const cache = cachedTask[task.key]
    const subscribe = (executeRes) => {
      if (executeRes.success) {
        resolve(executeRes.res)
      } else {
        reject(executeRes.err)
      }
    }
    const priority = task.priority || task.priority === 0 || 999
    if (cache) {
      cache.priority = priority
      const callbacks = cache.callbacks || []
      callbacks.push(subscribe)
    } else {
      task.callbacks = [subscribe]
      cachedTask[task.key] = task
      taskPool.push(task)
    }
  })
}
// 执行下载
export function executeTask() {
  if (taskPool.length > 0) {
    sortTaskPool()
    const executeRequest = maxRequest - numRequest
    if (executeRequest > 0) {
      for (let i = 0; i < executeRequest; i++) {
        const task = taskPool.shift()
        if (!task) {
          return
        }
        numRequest++
        task.execute().then(
          (res) => {
            numRequest--
            task.callbacks &&
              task.callbacks.map((callback) => {
                callback({ success: true, res })
              })
            executeTask()
          },
          (err) => {
            numRequest--
            task.callbacks &&
              task.callbacks.map((callback) => {
                callback({ success: false, err })
              })
            delete cachedTask[task.key]
            executeTask()
          }
        )
      }
    }
  } else {
    startTaskTimer()
  }
}
// 轮训检查请求池中是否有请求需要执行
function startTaskTimer() {
  taskTimer = setInterval(() => {
    if (taskPool.length > 0) {
      stopTaskTimer()
      executeTask()
    }
  }, 500)
}
// 停止轮训
function stopTaskTimer() {
  clearInterval(taskTimer)
  taskTimer = null
}

function sortTaskPool() {
  taskPool.sort(sortTaskByPriority)
}

function sortTaskByPriority(x, y) {
  // big to small
  if (x.priority > y.priority) {
    return -1
  } else if (x.priority < y.priority) {
    return 1
  } else {
    return 0
  }
}
