import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { MotionConfig } from 'motion/react'
import './styles/theme.css'
import './divination/modules'
import { App } from './App'
import { loadPrefs } from './llm/credentials'

document.documentElement.dataset.mode = loadPrefs().paper ? 'paper' : 'ink'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* 动画是 JS 驱的，theme.css 里那条 prefers-reduced-motion 管不到它。
        reducedMotion="user" 让跟随系统设置的人直接看到内容，不必等墨迹晕开。 */}
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MotionConfig>
  </StrictMode>,
)
