# PR Media LLC & Tapoos Node Course App

Professional pure Node.js version of the course portal.

## Features

- No Express or external runtime dependencies
- Password login with HTTP-only session cookie
- File-backed JSON database
- Protected course page and private course JavaScript
- Two courses:
  - Affiliate Marketing Mastery Course
  - Facebook Content Monetization Course
- Student progress API
- Admin settings API
- Certificate generation route
- Downloadable CSV worksheets
- Public legal/contact pages

## Local Setup

Copy the env template if needed:

```bash
cp .env.example .env
```

Start the server:

```bash
npm start
```

Open:

```text
http://localhost:3000
```

Default password:

```text
Coconina@Bakri
```

## Environment Variables

```env
PORT=3000
NODE_ENV=production
COURSE_PASSWORD=replace-with-secure-password
SESSION_SECRET=replace-with-long-random-secret
DB_FILE=./data/app.db.json
CONTACT_PHONE=+44 7883185894
CONTACT_EMAIL_PRIMARY=haris@tapoos.dev
CONTACT_EMAIL_SECONDARY=haris@prmedia.io
```

Do not commit `.env`. Use `.env.example` for deployment reference.

## Database

The database file is:

```text
data/app.db.json
```

It stores:

- sessions
- student progress
- admin settings
- audit log

For production at scale, migrate this interface to PostgreSQL, MySQL, or another managed database.
