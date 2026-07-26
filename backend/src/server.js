require('dotenv').config();
const app = require('./app');
const { runStartupBootstrap } = require('./startup/bootstrap');

const PORT = process.env.PORT || 4000;

// Bootstrap runs before the server starts accepting requests, so the admin
// account and starter content exist by the time anyone tries to log in -
// no manual seed step required on any deployment, ever.
runStartupBootstrap()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Trainee Tracker API running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Bootstrap failed:', err.message);
    console.error(err);
    process.exit(1);
  });
