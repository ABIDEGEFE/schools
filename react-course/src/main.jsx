import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Todo  from './components/Todo.jsx'
import App from './App.jsx'
import Title from './components/TodoTitle.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Title />
    <Todo />
    <Todo />
    <Todo />
    
  </StrictMode>,

)
