import { canUseDOM } from 'vtex.render-runtime'

import {
  PixelMessage,
} from './typings/events'

export default function() {
  return null;
} // no-op for extension point

function getUser(): Promise<{phone: {value: string}}> {
  return new Promise((resolve) => {
    fetch('/api/sessions?items=*').then(response => response.json()).then(data => {
      resolve(data.namespaces.profile);
    })
  })
}

fetch('/api/checkout/pub/orderForm').then(response => response.json()).then(async data => {
  let phone = data.clientProfileData.phone;
  let user = null;

  if (!phone) {
    console.log('will try to get phone')
    user = await getUser();
    phone = user.phone.value;
  }

  console.log('phone', phone);
  console.log('user', user);
})



console.log('hello world!')


export function handleEvents(e: PixelMessage) {
  console.log('event', e.data.eventName);

  switch (e.data.eventName) {
    case 'vtex:addToCart': {
      console.log('novo pixel .tsx event', e.data);

      

      fetch('/_v/credentials')

      return
    }
  }
}

if (canUseDOM) {
  window.addEventListener('message', handleEvents)
}
