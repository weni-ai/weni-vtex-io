import { canUseDOM } from 'vtex.render-runtime'
import { PixelMessage } from './typings/events'

function handleEvents(_e: PixelMessage) {
  // App deprecated: routes removed to avoid conflicts with the replacement app.
}

if (canUseDOM) {
  window.addEventListener('message', handleEvents)
}
