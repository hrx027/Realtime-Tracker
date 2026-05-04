require('dotenv').config();
const express = require('express');
const app = express();
app.set('trust proxy', 1);
const path = require("path");
const http = require('http');
const socketio = require('socket.io');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const server = http.createServer(app);
const io = socketio(server);

// Session configuration (7 days)
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: true, // Changed to true for testing
    cookie: { 
        maxAge: 7 * 24 * 60 * 60 * 1000,
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: (process.env.GOOGLE_CLIENT_ID || "").trim(),
    clientSecret: (process.env.GOOGLE_CLIENT_SECRET || "").trim(),
    callbackURL: (process.env.CALLBACK_URL || "/auth/google/callback").trim()
}, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Auth routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => res.redirect('/')
);

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('/login');
    });
});

// Middleware to check authentication
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
}

app.get('/', isAuthenticated, (req, res) => {
    res.render("index", { user: req.user });
});

const userLocations = {}; // Store latest locations in memory

io.on('connection', function (socket) {
    // Send existing users to the new user immediately
    socket.emit("all-users", userLocations);

    socket.on("send-location", function (data) {
        // Store/Update this user's location
        userLocations[socket.id] = { id: socket.id, ...data };
        // Broadcast to everyone else
        io.emit("receive-location", { id: socket.id, ...data });
    });

    socket.on("disconnect", function () {
        delete userLocations[socket.id];
        io.emit("user-disconnected", socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});