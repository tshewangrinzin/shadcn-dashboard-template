// React Imports
import { StrictMode } from 'react'

// Router Imports
import { BrowserRouter } from 'react-router-dom'

// React Imports
import { createRoot } from 'react-dom/client'

// Third-party Imports
import { NuqsAdapter } from 'nuqs/adapters/react'

// Font Imports
import '@fontsource-variable/geist'

import '@fontsource-variable/geist-mono'

// Style Imports
import './styles/globals.css'

// Component Imports
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <NuqsAdapter>
        <App />
      </NuqsAdapter>
    </BrowserRouter>
  </StrictMode>
)