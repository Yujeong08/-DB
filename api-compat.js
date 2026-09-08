(()=>{
  const previousFetch = window.fetch.bind(window);
  const isStockRequest = (url) => typeof url === 'string' && url.includes('script.google.com') && /[?&]action=stock(?:&|$)/.test(url);

  window.fetch = async function(input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    const response = await previousFetch(input, init);
    if (!isStockRequest(url)) return response;

    try {
      const data = await response.clone().json();
      if (Array.isArray(data) || (data && Array.isArray(data.items))) return response;
      if (data && typeof data === 'object' && !data.error) {
        const rows = Object.entries(data).map(([id, item]) => ({ id, ...(item || {}) }));
        return new Response(JSON.stringify(rows), {
          status: response.status,
          statusText: response.statusText,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store'
          }
        });
      }
    } catch (err) {
      console.warn('Stock API compatibility conversion failed:', err);
    }
    return response;
  };
})();
