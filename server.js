var bodyParser = require('body-parser');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var Datastore = require('nedb'),
  db = new Datastore({
    filename: 'data/posts.db',
    autoload: true
  });

app.set('view engine', 'jade');
app.use(express.static('public'));
app.use(bodyParser.json());
app.locals.pretty = true;

app.get('/', (req, res) =>
  res.render('index', {
    title: 'Prototype Progressive App'
  }));

app.get('/posts', (req, res) =>
  new Promise((resolve, reject) =>
    db.find({
      state: 'published'
    }, (error, docs) => {
      if (error) {
        reject(error)
      }
      resolve(docs)
    })).then(docs => res.json(docs)));

app.get('/drafts', (req, res) =>
  new Promise((resolve, reject) =>
    db.find({
      state: 'draft'
    }, (error, docs) => {
      if (error) {
        reject(error)
      }
      resolve(docs)
    })).then(docs => res.json(docs)));

app.put('/post', (req, res) => {
  console.log("writing post with body")
  console.log(req.body);

  return new Promise((resolve, reject) => {
    if (req.body._id) {
      console.log(`updating ${req.body._id}`)
      db.update({
        _id: req.body._id
      }, req.body, {}, (err, numReplaced) => {
        if (err) {
          reject(err);
        } else {
          resolve(req.body);
        }
      });
    } else {
      console.log("creating")
      db.insert(req.body, (err, numReplaced) => {
        if (err) {
          reject(err);
        } else {
          resolve(req.body);
        }
      });
    }
  }).then(() => {
    res.set('X-online', true)
    res.sendStatus(204)
  })
});

app.delete('/post/:id', (req, res) => {
  db.remove({
    '_id': req.params.id
  })
  res.sendStatus(204)
});

io.on('connection', socket => {
  console.log('a user connected');
  socket.on('test channel', msg => {
    console.log('message: ' + msg);
  });
});

server.listen(3000, () => {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
