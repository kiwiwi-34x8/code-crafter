// --- 1. Import all our tools ---
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session'); // <-- NEW: For login sessions

const app = express();
const port = 3001; 

// --- 2. Connect to our MongoDB Database ---
const dbURI = "mongodb+srv://codequest_admin:Codequest123@cluster0.ufqptbs.mongodb.net/codequest_db?appName=Cluster0";
// ▲▲▲ REMEMBER to put your real password here ▲▲▲

mongoose.connect(dbURI)
  .then(() => console.log('Successfully connected to MongoDB!'))
  .catch((err) => console.log('MongoDB connection error:', err));

// --- 3. Define the "User" Schema ---
// --- 3. Define the "User" Schema ---
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true }, 
  password: { type: String, required: true },
  avatarUrl: { type: String, default: '/images/avatar.png' },
  level: { type: Number, default: 1 }, // <-- ADD THIS LINE
  xp: { type: Number, default: 0 }     // <-- ADD THIS LINE
});

const User = mongoose.model('User', userSchema);

// --- 4. Set up Middleware ---
// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Let server read form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- NEW: Configure Login Session ---
app.use(session({
  secret: 'a-very-secret-key-you-should-change', // Change this to a random string
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false, // Set to true if you are using HTTPS
    maxAge: 1000 * 60 * 60 // Cookie (session) will expire in 1 hour
  } 
}));

// --- 5. Create the "/signup" Route (You already did this!) ---
app.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email: email });

    if (existingUser) {
      console.log('User already exists');
      return res.redirect('/signup.html');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username: username,
      email: email,
      password: hashedPassword 
    });

    await newUser.save();
    console.log('New user created:', newUser);
    res.redirect('/login.html');

  } catch (error) {
    console.log('Error during signup:', error);
    res.redirect('/signup.html'); 
  }
});

// --- 6. NEW: Create the "/login" Route ---
app.post('/login', async (req, res) => {
  try {
    // Get the email and password from the form
    const { email, password } = req.body;

    // Find the user in the database
    const user = await User.findOne({ email: email });

    if (!user) {
      // User not found
      console.log('Login failed: User not found.');
      return res.redirect('/login.html');
    }

    // User was found, now check the password
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (isPasswordMatch) {
      // Password is correct!
      console.log('Login successful:', user.email);

      // Create the session to "log them in"
      req.session.user = {
  id: user._id,
  email: user.email,
  username: user.username,
  avatarUrl: user.avatarUrl // <-- ADD THIS LINE
};
      
      // Send them to the dashboard
      res.redirect('/dashboard.html');

    } else {
      // Password was wrong
      console.log('Login failed: Incorrect password.');
      res.redirect('/login.html');
    }

  } catch (error) {
    console.log('Error during login:', error);
    res.redirect('/login.html');
  }
});

// --- 7. NEW: Create a Protected Dashboard Page ---
// We need a rule to protect this page
const isAuth = (req, res, next) => {
  if (req.session.user) {
    // User is logged in, let them proceed
    next();
  } else {
    // User is not logged in, send them to login page
    res.redirect('/login.html');
  }
};

app.get('/dashboard.html', isAuth, (req, res) => {
  // The 'isAuth' middleware ran first. If we get here, the user is logged in.
  // We send them the 'dashboard.html' file.
  // We use path.join to get the correct file path.
  res.sendFile(path.join(__dirname, 'public/dashboard.html'));
});
// --- API Endpoint to get current user data ---
app.get('/api/user', isAuth, async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  
  try {
    // Find the user in the database to get the freshest data
    const user = await User.findById(req.session.user.id).select('-password'); // .select('-password') stops the password hash from being sent
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Send the full user object, including level and xp
    res.json(user);

  } catch (error) {
    console.error('Error fetching user for API:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- NEW: API Route to update user's avatar ---
app.post('/api/user/avatar', isAuth, async (req, res) => {
  try {
    const { newAvatarUrl } = req.body; // Get the new URL from the request
    const userId = req.session.user.id;   // Get the user's ID from their session

    // Find the user in the database and update their avatarUrl
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatarUrl: newAvatarUrl },
      { new: true } // This option returns the updated user
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // IMPORTANT: Also update the avatar in the session
    req.session.user.avatarUrl = updatedUser.avatarUrl;

    // Send a success response
    res.json({ 
      message: 'Avatar updated successfully', 
      avatarUrl: updatedUser.avatarUrl 
    });

  } catch (error) {
    console.error('Error updating avatar:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- NEW: API Route to update username ---
app.post('/api/user/update-username', isAuth, async (req, res) => {
  try {
    const { newUsername } = req.body;
    const userId = req.session.user.id;

    if (!newUsername || newUsername.trim() === "") {
      return res.status(400).json({ message: 'Username cannot be empty' });
    }

    // Update the username in the database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username: newUsername },
      { new: true } // This returns the updated document
    );

    // IMPORTANT: Update the username in the session as well
    req.session.user.username = updatedUser.username;

    res.json({ 
      message: 'Username updated successfully', 
      username: updatedUser.username 
    });

  } catch (error) {
    console.error('Error updating username:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- NEW: API Route to add XP and handle Level ups ---
app.post('/api/user/add-xp', isAuth, async (req, res) => {
  try {
    const { xpToAdd } = req.body;
    const userId = req.session.user.id;

    if (!xpToAdd || isNaN(xpToAdd) || xpToAdd <= 0) {
      return res.status(400).json({ message: 'Invalid XP amount' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Add XP
    user.xp += Number(xpToAdd);

    // Check for level up (e.g. 1000 XP per level, Level 1 -> 1000 to reach Level 2)
    let leveledUp = false;
    let xpNeeded = user.level * 1000;
    while (user.xp >= xpNeeded) {
      user.level += 1;
      user.xp -= xpNeeded; // Optional: Keep leftover xp
      xpNeeded = user.level * 1000;
      leveledUp = true;
    }

    await user.save();

    // Session isn't saving xp/level originally, but let's sync db fields manually
    // req.session defaults to user info minus xp, but it's safe to update if needed.
    // Dashboard polls /api/user which hits User.findById so it will get fresh data!

    res.json({
      message: leveledUp ? 'Level Up!' : 'XP added successfully',
      xp: user.xp,
      level: user.level,
      leveledUp: leveledUp
    });

  } catch (error) {
    console.error('Error adding XP:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- NEW: Create a "/logout" Route ---
app.post('/logout', (req, res) => {
  // express-session gives us this destroy() function
  req.session.destroy((err) => {
    if (err) {
      // Handle the error
      console.log('Error destroying session:', err);
      return res.status(500).json({ message: 'Could not log out' });
    }
    
    // Clear the session cookie from the browser
    res.clearCookie('connect.sid'); // The default session cookie name
    
    // Send a success message
    res.status(200).json({ message: 'Logout successful' });
  });
});

// --- 8. Start the Server ---
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});