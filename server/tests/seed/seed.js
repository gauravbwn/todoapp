const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');

const {Todo} = require('./../../models/todo');
const {User} = require('./../../models/user');

const userOneId = new ObjectID();
const userTwoId = new ObjectID();

const todos = [
  {
    _id: new ObjectID(),
    text: 'First task to do'
  },
  {
    _id: new ObjectID(),
    text: 'Second task to do',
    completed: true,
    completedAt: 333
  }
];

const users = [
  {
    _id: userOneId,
    name: 'gaurav',
    email: 'gaurav@gmail.com',
    password: 'password1',
    tokens: [
      {
        access: 'auth',
        token: jwt.sign({_id: userOneId, access: 'auth'}, 'abc123').toString()
      }
    ]
  },
  {
    _id: userTwoId,
    name: 'namita',
    email: 'namita@gmail.com',
    password: 'password2'
  }
];

const populateTodos = (done) => {
  Todo.remove({}).then(() => {
    return Todo.insertMany(todos);
  }).then(() => done());
};

const populateUsers = (done) => {
  User.remove({}).then(() => {
    var userOne = new User(users[0]).save();
    var userTwo = new User(users[1]).save();

    return Promise.all([userOne, userTwo]);
  }).then(() => done());
}

module.exports = {todos, populateTodos, users, populateUsers};
