const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app} = require('./../server');
const {Todo} = require('./../models/todo');
const {User} = require('./../models/user');
const {todos, populateTodos, users, populateUsers} = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateTodos);

describe('POST /todos', () => {
  it('should create a new todo', (done) => {
    var text = "to do test";
    request(app)
      .post('/todos')
      .send({text})
      .expect(200)
      .expect((res) => {
        expect(res.body.text).toBe(text);
      })
      .end((err, res) => {
        if(err) {return done(err);}
        Todo.find({text}).then((todos) => {
          expect(todos.length).toBe(1);
          expect(todos[0].text).toBe(text);
          done();
        }).catch((err) => done(err));
      });
  });

  it('should not create a new todo with invalid text', (done) => {
    request(app)
      .post('/todos')
      .send({})
      .expect(400)
      .end((err, res) => {
        if(err) {return done(err);}
        Todo.find().then((todos) => {
          expect(todos.length).toBe(2);
          done();
        }).catch((err) => done(err));
      })
  });
});

describe('GET /todos', () => {
  it('should get all todos', (done) => {
    request(app)
      .get('/todos')
      .expect(200)
      .expect((res) => {
        expect(res.body.todos.length).toBe(2);
      })
      .end(done);
  });
});

describe('GET /todos/:id', () => {
  it('should return todo item provided a valid id is provided', (done) => {
    request(app)
      .get(`/todos/${todos[0]._id.toHexString()}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(todos[0].text);
      })
      .end(done);
  });

  it('should return a 404 when an valid but non-existing id is provided', (done) => {
    request(app)
      .get(`/todos/${(new ObjectID()).toHexString()}`)
      .expect(404)
      .end(done);
  });

  it('should return a 404 when an invalid id is provided', (done) => {
    request(app)
      .get(`/todos/123`)
      .expect(404)
      .end(done);
  });
});

describe('DELETE /todos/:id', () => {
  it('should delete a todo', (done) => {
    var hexID = todos[1]._id.toHexString();

    request(app)
      .delete(`/todos/${hexID}`)
      .expect(200)
      .expect((res) => {
          expect(res.body.todo._id).toBe(hexID)
      })
      .end((err, res) => {
        if(err){
          return done(err);
        }
        Todo.findById(hexID).then((todo) => {
          expect(todo).toBeFalsy();
          done();
        }).catch((e) => done(e));
      })
  });

  it('should return a 404 if todo is not found', (done) => {
    request(app)
      .delete(`/todos/${(new ObjectID()).toHexString()}`)
      .expect(404)
      .end(done);
  });

  it('should return a 404 if object ID is not valid', (done) => {
    request(app)
      .delete(`/todos/123abc`)
      .expect(404)
      .end(done);
  });
});

describe('PATCH /todo/:id', () => {
  it('should update the todo', (done) => {
    var hexID = todos[0]._id.toHexString();
    var updatedObjective = 'I have changed the objective';
    request(app)
      .patch(`/todos/${hexID}`)
      .send({text: updatedObjective, completed: true})
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(updatedObjective);
        expect(res.body.todo.completed).toBeTruthy();
        expect(typeof res.body.todo.completedAt).toBe('number');
      })
      .end(done);
  });
  it('should clear completedAt when todo is not completed', (done) => {
    var hexID = todos[1]._id.toHexString();
    var updatedObjective = 'I have changed the objective for the other one as well';
    request(app)
      .patch(`/todos/${hexID}`)
      .send({text: updatedObjective, completed: false})
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(updatedObjective);
        expect(res.body.todo.completed).toBeFalsy();
        expect(res.body.todo.completedAt).toBeFalsy();
      })
      .end(done);
  });
});

describe('GET /users/me', () => {
  it('should return user data for authenticated user', (done) => {
    request(app)
      .get('/users/me')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body._id).toBe(users[0]._id.toHexString());
        expect(res.body.name).toBe(users[0].name);
        expect(res.body.email).toBe(users[0].email);
      })
      .end(done);
  });
  it('should return 401 for un-authenticated user', (done) => {
    request(app)
      .get('/users/me')
      .expect(401)
      .expect((res) => {
        expect(res.body).toEqual({});
      })
      .end(done);
  });
});

describe('POST /users', () => {
  it('should create a user', (done) => {
    var name = 'dummy';
    var email = 'example@example.com';
    var password = 'examplepassword';

    request(app)
      .post('/users')
      .send({name, email, password})
      .expect(200)
      .expect((res) => {
        expect(res.headers['x-auth']).toBeTruthy();
        expect(res.body._id).toBeTruthy();
        expect(res.body.email).toBe(email);
      })
      .end((err) => {
        if(err) {
          return done(err);
        }
        User.findOne({email}).then((user) => {
          expect(user).toBeTruthy();
          expect(user.password).not.toBe(password);
          done();
        })
      });
  });
  it('should return a validation error for an invalid email', (done) => {
    var email = 'xyz.abc.com';  // invalid
    var name = 'starship';
    var password = 'password';

    request(app)
      .post('/users')
      .send({name, email, password})
      .expect(400)
      .end(done);
  });
  it('should return a validation error for an invalid password', (done) => {
    var email = 'xyz@abc.com';
    var name = 'starship';
    var password = '--';  //invalid

    request(app)
      .post('/users')
      .send({name, email, password})
      .expect(400)
      .end(done);
  });
  it('should not create a new user with an existing email', (done) => {
    var email = users[0].email; // existing from seed user
    var name = 'starship';
    var password = 'password';

    request(app)
      .post('/users')
      .send({name, email, password})
      .expect(400)
      .end(done);
  });
});
