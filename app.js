
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('🔌 Attempting to connect to MongoDB...');
})
.catch(err => {
  console.error('❌ Initial MongoDB connection error:', err);
});

// 👇 Event Listeners for Mongoose connection
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ Mongoose disconnected from DB');
});

app.use(express.json());

// 📘 Book Schema
const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  publishedYear: {
    type: Number,
    min: 1900,
    validate: {
      validator: function(value) {
        return value <= new Date().getFullYear();
      },
      message: props => `${props.value} exceeds the current year (${new Date().getFullYear()})`
    }
  },
  genres: { type: [String], default: [] },
  isAvailable: { type: Boolean, default: true }
});

// 🧠 Instance Method
bookSchema.methods.getBookInfo = function() {
  return `The book '${this.title}' is written by ${this.author}.`;
};

// 🔍 Static Method
bookSchema.statics.findByGenre = function(genre) {
  return this.find({ genres: genre });
};

// 🔄 Middleware
bookSchema.pre('save', function(next) {
  console.log(`Saving book: ${this.title}`);
  next();
});

bookSchema.post('save', function(doc) {
  console.log(`Saved book: ${doc.title}`);
});

const Book = mongoose.model('Book', bookSchema);

// ✨ Routes
app.post('/books', async (req, res) => {
  try {
    const book = new Book(req.body);
    const savedBook = await book.save();
    res.status(201).json(savedBook);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/books', async (_, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/books/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: "Book not found." });
    }
    res.json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/books/:id', async (req, res) => {
  try {
    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedBook) {
      return res.status(404).json({ message: "Book not found." });
    }
    res.json(updatedBook);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/books/:id', async (req, res) => {
  try {
    const deletedBook = await Book.findByIdAndDelete(req.params.id);
    if (!deletedBook) {
      return res.status(404).json({ message: "Book not found." });
    }
    res.json({ message: `Book '${deletedBook.title}' deleted successfully.` });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/books/genre/:genre', async (req, res) => {
  try {
    const books = await Book.findByGenre(req.params.genre);
    res.json(books);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
