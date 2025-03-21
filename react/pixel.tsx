import { canUseDOM } from "vtex.render-runtime";
import { PixelMessage } from "./typings/events";

function getDetails(): Promise<{
  profile: { phone?: { value: string } };
  account: { accountName?: { value: string } };
}> {
  return new Promise((resolve) => {
    fetch('/api/sessions?items=*')
      .then((response) => response.json())
      .then((data) => {
        console.log('got user data:', JSON.stringify(data.namespaces.profile));
        resolve({
          profile: data.namespaces.profile,
          account: data.namespaces.account,
        });
      });
  });
}

function seeOrderForm() {
  console.log('calling');

  fetch('/api/checkout/pub/orderForm')
    .then((response) => response.json())
    .then(async (data) => {

      const { profile, account } = await getDetails();

      const phone = profile.phone?.value || data.clientProfileData.phone;

      fetch('/_v/abandoned-cart-notification', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cart_id: data.orderFormId,
          phone,
          account: account.accountName?.value,
          name: data.clientProfileData.firstName,
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
  seeOrderForm();
}

