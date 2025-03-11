const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3001;

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    const htmlPath = path.join(__dirname, 'test-page.html');
    fs.readFile(htmlPath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end(`Error loading the test page: ${err.message}`);
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    });
  } else {
    // For any other request, proxy to the Next.js dev server
    res.writeHead(302, { 'Location': `http://localhost:3000${req.url}` });
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`Tilopay test server running at http://localhost:${PORT}`);
  console.log('Make sure your Next.js dev server is running on port 3000');
  
  // Open the browser automatically
  const url = `http://localhost:${PORT}`;
  let command;
  
  switch (process.platform) {
    case 'darwin': // macOS
      command = `open "${url}"`;
      break;
    case 'win32': // Windows
      command = `start "${url}"`;
      break;
    default: // Linux and others
      command = `xdg-open "${url}"`;
      break;
  }
  
  exec(command, (err) => {
    if (err) {
      console.error(`Failed to open browser: ${err.message}`);
      console.log(`Please open ${url} manually in your browser`);
    }
  });
}); 