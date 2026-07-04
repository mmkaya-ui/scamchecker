async function test() {
  const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
  try {
    const res = await fetch('https://search.yahoo.com/search?p=IPTV', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    const html = await res.text();
    // Match href inside div class="compTitle"
    const regex = /class="compTitle[^>]*>.*?href="(https:\/\/[^"]+)"/g;
    let match;
    let urls = [];
    while ((match = regex.exec(html)) !== null && urls.length < 5) {
      urls.push(match[1]);
    }
    console.log('Yahoo URLs:', urls);
  } catch(e) {
    console.error(e);
  }
}
test();
