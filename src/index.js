const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  if (!username) {
    return response
      .status(400)
      .json({ error: 'Username cannot be empty!' });
  }

  const user = users.find(u => u.username === username.trim());

  if (!user) {
    return response
      .status(400)
      .json({ error: 'User not found!' });
  }

  request.user = user;

  return next();
}

function checkExistsTodo(request, response, next) {
  const { user } = request;
  const { id } = request.params;

  const todo = user.todos.find(t => t.id === id);

  if (!todo) {
    return response
      .status(404)
      .json({ error: 'Todo not found!' });
  }
  request.todo = todo;

  return next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  if (!username) {
    return response
      .status(400)
      .json({ error: 'Username cannot be empty!' });
  }

  const userAlreadyExists = users
    .some(u => u.username.trim() === username.trim());

  if (userAlreadyExists) {
    return response
      .status(400)
      .json({ error: 'User already exists!' });
  }

  const user = {
    id: uuidv4(),
    name: name.trim(),
    username: username.trim(),
    todos: []
  };

  users.push(user);

  return response.status(201).json(user);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const todo = {
    id: uuidv4(),
    title: title.trim(),
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  };

  user.todos.push(todo);

  return response.status(201).json(todo);
});

app.put('/todos/:id', checksExistsUserAccount, checkExistsTodo, (request, response) => {
  const { title, deadline } = request.body;
  const { todo } = request;

  todo.title = title;
  todo.deadline = new Date(deadline);

  return response.json(todo);
});

app.patch('/todos/:id/done', checksExistsUserAccount, checkExistsTodo, (request, response) => {
  const { todo } = request;

  todo.done = true;

  return response.json(todo);
});

app.delete('/todos/:id', checksExistsUserAccount, checkExistsTodo, (request, response) => {
  const { user } = request;
  const { todo } = request;

  user.todos.splice(user.todos.indexOf(todo), 1);

  return response.status(204).send();
});

module.exports = app;