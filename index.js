const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Function to load all routes from the 'routes' directory
function loadRoutes() {
  const routesPath = path.join(__dirname, 'routes');
  fs.readdir(routesPath, (err, files) => {
    if (err) {
      return console.error('Could not list the directory.', err);
    }
    files.forEach(file => {
      if (file.endsWith('.js')) {
        const route = require(path.join(routesPath, file));
        console.log(`Loading route: ${route.endpoint}`);
        app.use(route.endpoint, route.router);
      }
    });
  });
}

// Middleware to log each incoming request
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Route to dynamically create new API endpoints
app.post('/create-api', (req, res) => {
  const { method, endpoint, response } = req.body;

  if (!method || !endpoint || !response) {
    return res.status(400).send('Missing required fields: method, endpoint, response');
  }

  const routeFileName = endpoint.replace(/\//g, '_') + '.js';
  const routeFilePath = path.join(__dirname, 'routes', routeFileName);
  const routeContent = `
const express = require('express');
const router = express.Router();

router.${method.toLowerCase()}('${endpoint}', (req, res) => {
  res.json(${JSON.stringify(response)});
});

module.exports = {
  endpoint: '${endpoint}',
  router
};
`;

  fs.writeFile(routeFilePath, routeContent, (err) => {
    if (err) {
      return res.status(500).send('Error creating route file');
    }

    const route = require(routeFilePath);
    app.use(route.endpoint, route.router);
    console.log(`Created and loaded new route: [${method.toUpperCase()}] ${endpoint}`);

    res.send(`API created: [${method.toUpperCase()}] ${endpoint}`);
  });
});

// Route to list all dynamically created APIs and their paths
app.get('/list-apis', (req, res) => {
  const routesPath = path.join(__dirname, 'routes');
  fs.readdir(routesPath, (err, files) => {
    if (err) {
      return res.status(500).send('Error listing APIs');
    }
    const apis = files
      .filter(file => file.endsWith('.js'))
      .map(file => {
        const route = require(path.join(routesPath, file));
        const fullUrl = req.protocol + '://' + req.get('host') + route.endpoint;
        const method = route.router.stack[0] ? route.router.stack[0].method.toUpperCase() : 'UNKNOWN';
        return { method, fullUrl };
      });
    res.json(apis);
  });
});

// Sample route to check if server is running
app.get('/', (req, res) => {
  res.send('first commit is running');
});

// Load dynamic routes on startup
loadRoutes();

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
