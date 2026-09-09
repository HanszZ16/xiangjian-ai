import { Route, Routes } from 'react-router'
import { Home } from './routes/Home'
import { Cast } from './routes/Cast'
import { Reading } from './routes/Reading'
import { Settings } from './routes/Settings'
import { About } from './routes/About'
import { Chrome } from './routes/Chrome'

export function App() {
  return (
    <Routes>
      <Route element={<Chrome />}>
        <Route index element={<Home />} />
        <Route path="cast/:moduleId" element={<Cast />} />
        <Route path="reading" element={<Reading />} />
        <Route path="settings" element={<Settings />} />
        <Route path="about" element={<About />} />
        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  )
}
