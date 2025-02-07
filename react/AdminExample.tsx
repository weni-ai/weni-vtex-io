import React from 'react'
import { useRuntime } from 'vtex.render-runtime'
import {
  ThemeProvider,
  experimental_I18nProvider as I18nProvider,
} from '@vtex/admin-ui'

window.addEventListener('message', (event: { data: { name: string, id: string, args: [RequestInfo, RequestInit] } }) => {
  if (event?.data?.name !== "VTEXFetch") {
    return;
  }

  const id = event.data.id;
  const args = event.data.args;
  
  function postMessage(message: object) {
    const iframe = document.querySelector('iframe');
    iframe?.contentWindow?.postMessage({
      name: 'VTEXFetch',
      id,
      ...message,
    }, '*');
  }

  fetch(...args)
    .then(response => response.text())
    .then(responseText => {
      let response: unknown;

      try {
        response = JSON.parse(responseText);
      } catch {
        response = { text: responseText };
      }

      postMessage({
        status: 'success',
        response,
      });
    }).catch(reason => postMessage({
      status: 'error',
      reason,
    }));
});

function AdminExample() {
  const {
    culture: { locale },
  } = useRuntime();

  const VTEXWebapp = new URL('https://appvtexio.stg.cloud.weni.ai');

  VTEXWebapp.searchParams.append('locale', locale);

  return (
    <I18nProvider locale={locale}>
      <ThemeProvider>
        <iframe src={VTEXWebapp.toString()} style={{ display: 'block', width: '100%', height: '100vh', }}></iframe>
      </ThemeProvider>
    </I18nProvider>
  )
}

export default AdminExample
