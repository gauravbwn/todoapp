var express = require('express');
var bodyParser = require('body-parser');
var {ObjectID} = require('mongodb');

var {mongoose} = require('./db/mongoose');
var {Todo} = require('./models/Todo');
var {User} = require('./models/User');

var app = express();

app.use(bodyParser.json());

app.post('/todos', (req, res) => {
  var todo = new Todo({
    text: req.body.text
  });
  todo.save().then((doc) => {
    res.send(doc);
  }, (err) => {
    res.status(400).send(err);
  })
});

app.get('/todos', (req, res) => {
  Todo.find().then((todos) => {
    res.send({todos});
  }, (err) => {
    res.status(400).send(err);
  })
});

app.get('/todos/:id', (req, res) => {
  var id = req.params.id;
  if (!ObjectID.isValid(id)){
    return res.status(404).send('Invalid Object Id: ' + id);
  }
  Todo.findById(id).then((todo) => {
    if(!todo) {
      return res.status(404).send('No Todo item found matching the given object id:  ' + id);
    }
    res.send({todo});
  }).catch((err) => {
    res.status(400).send('Something is awery');
  });
});

app.listen(3001, () => {
  console.log('Started on port 3001');
});

module.exports = {app};
