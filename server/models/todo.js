var mongoose = require('mongoose');

var Todo  = mongoose.model('Todo', {
  text: {type: String, required: true, trim: true, minlength: 1},
  completed: {type: Boolean, required: false, default: false},
  completedAt: {type: Number, required: false, default: null}
});

module.exports = {Todo};
