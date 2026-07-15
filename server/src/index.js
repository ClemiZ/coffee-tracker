require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/coffees',     require('./routes/coffees'));
app.use('/api/goals',       require('./routes/goals'));
app.use('/api/achievements',require('./routes/achievements'));
app.use('/api/badges',      require('./routes/badges'));
app.use('/api/streaks',     require('./routes/streaks'));
app.use('/api/challenges',  require('./routes/challenges'));
app.use('/api/rankings',    require('./routes/rankings'));
app.use('/api/compare',     require('./routes/compare'));
app.use('/api/casualties',  require('./routes/casualties'));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Coffee Tracker API running on :${PORT}`));
