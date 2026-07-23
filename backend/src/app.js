const path = require('path');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const selfReportRoutes = require('./routes/self-report.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const skillAreasRoutes = require('./routes/skillAreas.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// CORS only matters when the frontend is served from a different origin
// (e.g. running `vite dev` locally against this API). In the deployed
// single-service setup, frontend and API share an origin so this is a no-op.
app.use(cors({ origin: process.env.FRONTEND_URL || true, credentials: true }));
app.use(express.json());

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/self-report', selfReportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/skill-areas', skillAreasRoutes);
app.use('/api/analytics', analyticsRoutes);

// Any /api/* request that fell through the routers above is a genuine 404.
app.use('/api', (req, res) => res.status(404).json({ error: 'Route not found' }));

// Serve the built React app (frontend/dist) and hand every non-API GET route
// to index.html so client-side routing (react-router) works on refresh/deep links.
const frontendDistPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendDistPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

app.use(errorHandler);

module.exports = app;
