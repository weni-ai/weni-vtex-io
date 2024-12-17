import { canUseDOM } from 'vtex.render-runtime'

import {
  PixelMessage,
} from './typings/events'

export default function() {
  return null;
}

function getUser(): Promise<{phone: {value: string}}> {
  return new Promise((resolve) => {
    fetch('/api/sessions?items=*').then(response => response.json()).then(data => {
      resolve(data.namespaces.profile);
    })
  })
}

const timeToCallNextAbandonedCartUpdateInSeconds = 15 * 60; // 15 minutes
let seeOrderFormTimeout: number;

function seeOrderForm() {
  console.log('calling');
  clearTimeout(seeOrderFormTimeout);
  
  fetch('/api/checkout/pub/orderForm')
    .then(response => response.json())
    .then(async data => {
      seeOrderFormTimeout = setTimeout(seeOrderForm, timeToCallNextAbandonedCartUpdateInSeconds * 1E3);
      
      let phone = data.clientProfileData?.phone;
      let user = null;

      if (!phone) {
        user = await getUser();
        phone = user.phone?.value;
      }

      fetch('/_v/updateOrderFormForAbandonedCart', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderFormId: data.orderFormId,
          itemsLength: data.items.length,
          itemsStatus: data.items.length === 0 ? 'empty' : 'hasItems',
          phone,
        }),
      });
    })
}

seeOrderForm();

export function handleEvents(e: PixelMessage) {
  switch (e.data.eventName) {
    case 'vtex:addToCart': {
      seeOrderForm();
      return;
    }
  }
}

if (canUseDOM) {
  window.addEventListener('message', handleEvents)
}
