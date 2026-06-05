const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const users = [];

function findUserByEmail(email) {
  return users.find((user) => user.email === email.toLowerCase());
}

function renderPage(res, view, options = {}) {
  res.render(view, options);
}

function parseMessages(req) {
  return {
    success: req.query.success || '',
    error: req.query.error || ''
  };
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  const { success, error } = parseMessages(req);
  const email = req.query.email || '';
  renderPage(res, 'index', { title: 'Home', email, success, error });
});

app.get('/login', (req, res) => {
  const { success, error } = parseMessages(req);
  renderPage(res, 'login', { title: 'Login', success, error });
});

app.get('/register', (req, res) => {
  const { success, error } = parseMessages(req);
  renderPage(res, 'register', { title: 'Register', success, error });
});

app.post('/register', (req, res) => {
  const email = req.body.email && req.body.email.trim();
  const password = req.body.password && req.body.password.trim();

  if (!email || !password) {
    return res.redirect('/register?error=Please provide both email and password');
  }

  if (findUserByEmail(email)) {
    return res.redirect('/register?error=This email is already registered');
  }

  users.push({ email: email.toLowerCase(), password });
  res.redirect('/login?success=Registration successful. Please login.');
});

app.post('/login', (req, res) => {
  const email = req.body.email && req.body.email.trim();
  const password = req.body.password && req.body.password.trim();

  if (!email || !password) {
    return res.redirect('/login?error=Please provide both email and password');
  }

  const user = findUserByEmail(email);
  if (!user || user.password !== password) {
    return res.redirect('/login?error=Invalid email or password');
  }

  res.redirect(`/?email=${encodeURIComponent(user.email)}&success=Login successful.`);
});

app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
