function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err.message, err.code || '');
  
  // Prisma unique constraint error
  if (err.code === 'P2002') {
    return res.status(400).json({ error: 'This report already exists for today. You can only submit one report per day.' });
  }
  
  // Other Prisma errors
  if (err.code?.startsWith('P')) {
    return res.status(400).json({ error: `Database error: ${err.message}` });
  }

  const status = err.statusCode || 500;
  const message = err.expose ? err.message : (process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message);

  res.status(status).json({ error: message });
}

module.exports = errorHandler;
