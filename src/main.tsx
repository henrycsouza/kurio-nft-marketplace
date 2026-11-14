import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  QueryClientProvider,
} from '@tanstack/react-query'
import './index.css'
import './layout.css'
import { setBackendReady } from './lib/backend-ready'
import { RouterProvider } from '@tanstack/react-router'
import { queryClient } from './lib/query-client'

async function startMocks() {
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'false') {
    const { worker } = await import('./mocks/browser')

    await worker.start({
      onUnhandledRequest: 'bypass',
    })
  }

}

async function startApp() {
  // Paint the interface immediately; HTTP and sockets wait for their backend.
  setBackendReady(startMocks())
  const { router } = await import('./router')

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>,
  )
}

startApp().catch((error) => {
  console.error('Falha ao iniciar a aplicação:', error)

  document.getElementById('root')!.textContent =
    'Não foi possível iniciar a aplicação. Atualize a página.'
})
