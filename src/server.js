import { createApp } from './app.js';
import { createDb } from './db.js';

const secret = process.env.JWT_SECRET;
if (!secret) { console.error('Set JWT_SECRET (see .env.example)'); process.exit(1); }
const app = createApp(createDb(process.env.DB_FILE || 'tracker.db'), secret);
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
