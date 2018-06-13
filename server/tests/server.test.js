const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app} = require('./../server');
const {Todo} = require('./../models/todo');
const {User} = require('./../models/user');

const todos = [{_id: new ObjectID(), text: 'First task to do'},
               {_id: new ObjectID(), text: 'Second task to do'}];

beforeEach((done) => {
  Todo.remove({}).then(() => {
    return Todo.insertMany(todos);
  }).then(() => done());
});

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
      })
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
