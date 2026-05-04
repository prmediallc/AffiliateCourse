# PR Media LLC & Tapoos Affiliate Marketing Mastery Course

Static web app for PR Media LLC & Tapoos student courses.

## Included Courses

- Affiliate Marketing Mastery Course - UAE Edition
- Facebook Content Monetization Course - Pakistan + UAE Edition

## Run locally

Open `index.html` directly in a browser.

## Deploy to Vercel

1. Upload this folder to GitHub.
2. Import the repository in Vercel.
3. Use the project root as the deployment root.
4. No build command is required.
5. Output directory can be left empty.
6. Add these optional environment variables in Vercel:

```env
COURSE_PASSWORD=Coconina@Bakri
COURSE_AUTH_SECRET=replace-with-a-long-random-secret
```

If `COURSE_PASSWORD` is not set, the app uses the current password hash.

## Security Notes

- Revoke any GitHub tokens pasted into chats or terminals.
- The course content is served through Vercel serverless routes after password login.
- Legal pages are public for compliance and trust.
- Ask a qualified legal professional to review Privacy, Terms, and Affiliate Disclosure before selling publicly.

## Files

- `index.html` - app structure
- `styles.css` - visual design
- `script.js` - curriculum data, progress tracking, downloads
- `private/course.html` - protected course shell served by `/api/course`
- `private/app.js` - protected course data and app logic served by `/api/asset`
- `api/login.js` - password login route
- `api/course.js` - protected course page route
- `api/asset.js` - protected private script route
- `vercel.json` - Vercel static settings
- `contact.html` - public contact page
- `privacy.html` - public privacy policy
- `terms.html` - public terms page
- `affiliate-disclosure.html` - public affiliate disclosure
- `downloads/` - downloadable CSV worksheets and trackers
