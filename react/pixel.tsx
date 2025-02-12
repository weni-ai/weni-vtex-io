import { canUseDOM } from "vtex.render-runtime";
import { PixelMessage } from "./typings/events";
import { CLIENT_PHONE } from "./env";

declare const __RUNTIME__: {
  culture: { locale: string };
  binding?: { id: string };
  account: string;
  workspace: string;
  production: boolean;
};

if (typeof __RUNTIME__ !== 'undefined') {
  console.log('Runtime:', __RUNTIME__);

  const runtime = __RUNTIME__;
  const timeToCallNextAbandonedCartUpdateInSeconds = 15 * 60; // 15 minutes
  let seeOrderFormTimeout: number;

  function getUser(): Promise<{ phone: { value: string } }> {
    return new Promise((resolve) => {
      fetch('/api/sessions?items=*')
        .then((response) => response.json())
        .then((data) => {
          resolve(data.namespaces.profile);
        });
    });
  }

  function seeOrderForm() {
    console.log('calling');
    clearTimeout(seeOrderFormTimeout);

    fetch('/api/checkout/pub/orderForm')
      .then((response) => response.json())
      .then(async (data) => {
        seeOrderFormTimeout = setTimeout(
          seeOrderForm,
          timeToCallNextAbandonedCartUpdateInSeconds * 1e3
        );

        let phone = CLIENT_PHONE;
        let user = null;

        if (!phone) {
          user = await getUser();
          phone = user.phone?.value;
        }

        fetch('/_v/updateOrderFormForAbandonedCart', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderFormId: data.orderFormId,
            itemsLength: data.items.length,
            itemsStatus: data.items.length === 0 ? 'empty' : 'hasItems',
            phone,
            binding: runtime.binding?.id, // Passando o binding
          }),
        });
      });
  }

  function handleEvents(e: PixelMessage) {
    switch (e.data.eventName) {
      case 'vtex:addToCart': {
        seeOrderForm();
        return;
      }
    }
  }

  if (canUseDOM) {
    window.addEventListener('message', handleEvents);
    seeOrderForm(); // Chama a lógica principal
  }
}
