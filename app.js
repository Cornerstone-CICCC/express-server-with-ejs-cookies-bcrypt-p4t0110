const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');

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

app.use(cookieSession({
  name: 'session',
  keys: [process.env.SESSION_SECRET || 'dev_secret_key'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.get('/', (req, res) => {
  const { success, error } = parseMessages(req);
  const email = req.session && req.session.email ? req.session.email : (req.query.email || '');
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

app.post('/register', async (req, res) => {
  const email = req.body.email && req.body.email.trim();
  const password = req.body.password && req.body.password.trim();

  if (!email || !password) {
    return res.redirect('/register?error=Please provide both email and password');
  }

  if (findUserByEmail(email)) {
    return res.redirect('/register?error=This email is already registered');
  }

  try {
    const saltRounds = 10;
    const hashed = await bcrypt.hash(password, saltRounds);
    users.push({ email: email.toLowerCase(), password: hashed });
    res.redirect('/login?success=Registration successful. Please login.');
  } catch (err) {
    console.error('Error hashing password', err);
    res.redirect('/register?error=Server error. Please try again.');
  }
});

app.post('/login', async (req, res) => {
  const email = req.body.email && req.body.email.trim();
  const password = req.body.password && req.body.password.trim();

  if (!email || !password) {
    return res.redirect('/login?error=Please provide both email and password');
  }

  const user = findUserByEmail(email);
  if (!user) {
    return res.redirect('/login?error=Invalid email or password');
  }

  try {
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.redirect('/login?error=Invalid email or password');
    }

    req.session.email = user.email;
    res.redirect('/?success=Login successful.');
  } catch (err) {
    console.error('Error comparing password', err);
    res.redirect('/login?error=Server error. Please try again.');
  }
});

app.get('/logout', (req, res) => {
  req.session = null;
  res.redirect('/?success=Logged out.');
});

app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
