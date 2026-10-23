# TalentIQ — AI-Powered Recruitment Platform

TalentIQ is a full-stack recruitment application for candidates and recruiting teams. It includes account registration and login, candidate and company profiles, job listings, application tracking, resume upload and text extraction, and an explainable skill-matching baseline.

> **Matching disclosure:** TalentIQ uses a configurable dictionary of skills and keyword overlap. A score is the share of job requirement skills found in a candidate's profile or extracted resume text. It is not an AI model, a measure of ability, or an automated hiring decision. Recruiters must review candidates themselves. A match with no recognizable requirements scores 0.

> **Demo data:** The landing page contains illustrative interface previews (including sample name Alex Morgan and sample role counts). These are visual examples only. The app does not seed fictitious people, jobs, applications, or statistics into MongoDB.

## Technologies

- Frontend: React 18, Vite, React Router, JavaScript, CSS, Lucide icons
- Backend: Node.js (ES modules), Express, REST, Zod validation
- Database: MongoDB with Mongoose schemas and indexes
- Authentication: bcrypt password hashing, signed JWT in an HttpOnly cookie, role middleware
- Resumes: Multer upload validation, PDF text extraction, DOCX text extraction

## Folder structure

```text
TalentIQ/
├── client/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx (current screens and workflows)
│       ├── lib.js (API client)
│       ├── main.jsx
│       ├── styles.css
│       ├── components/ (empty scaffold)
│       ├── context/ (empty scaffold)
│       └── pages/ (empty scaffold)
├── server/
│   ├── controllers/ (empty scaffold)
│   ├── middleware/ (auth.js, errors.js)
│   ├── models/ (User.js, CandidateProfile.js, RecruiterProfile.js, Job.js, Application.js, Interview.js)
│   ├── routes/ (auth.js, profiles.js, jobs.js, applications.js, resumes.js)
│   ├── services/ (jobStatus.js, matching.js, resume.js)
│   ├── tests/ (auth.test.js, jobs.test.js, matching.test.js)
│   ├── uploads/ (runtime storage; contents omitted)
│   ├── utils/ (asyncHandler.js)
│   ├── app.js
│   └── index.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Prerequisites

- Node.js 20 LTS or newer and npm
- MongoDB Community Server running locally, or a MongoDB Atlas connection string

## Install

Open PowerShell in the `TalentIQ` directory:

```powershell
npm install
npm --prefix server install
npm --prefix client install
```

## Configure environment

Copy the example into the server directory and set a private JWT signing secret (at least 32 characters) and a MongoDB URI:

```powershell
Copy-Item .env.example server/.env
```

Edit `server/.env`. Example local values:

```dotenv
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/talentiq
JWT_SECRET=replace-this-with-a-random-secret-of-at-least-32-characters
CLIENT_ORIGIN=http://localhost:5173
UPLOAD_DIR=uploads
MAX_UPLOAD_MB=5
PASSWORD_RESET_BASE_URL=http://localhost:5173/reset-password
```

The example has placeholders, not credentials. Never commit `server/.env`. The frontend defaults to `http://localhost:4000/api`; to use another API origin, create `client/.env.local` with `VITE_API_URL=https://your-api.example/api` and restart Vite.

### Development skill-match diagnostics

For a local development session only, set `TALENTIQ_DEBUG_MATCHING=true` in `server/.env` while keeping `NODE_ENV=development`, then restart the API. Authorized application-history requests log profile skills, resume-extracted skills, the combined normalized skills, each requirement's match result, and the final score to the server console. The report is never returned by an API endpoint, does not include resume text or account contact details, and is disabled unless both settings are enabled. Treat console output as private candidate data and turn the flag off when debugging is complete.

## Start the application

Start MongoDB first. Then open one PowerShell terminal in `TalentIQ` and run:

```powershell
npm run dev
```

Or run backend and frontend separately:

```powershell
npm --prefix server run dev
```

```powershell
npm --prefix client run dev
```

Open **http://localhost:5173**. The API health endpoint is **http://localhost:4000/api/health**.

## Available API endpoints

All JSON endpoints return JSON errors in `{ "error": "..." }` format. Authenticated browser requests use the `tiq_session` HttpOnly cookie and must be sent with credentials. Page results are limited to 12 by default and 30 maximum.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | API health |
| POST | `/api/auth/register` | Public | Candidate or recruiter registration |
| POST | `/api/auth/login` | Public | Sign in |
| POST | `/api/auth/logout` | Public | Clear session cookie |
| GET | `/api/auth/me` | Signed in | Current account |
| POST | `/api/auth/forgot-password` | Public | Create a 30-minute reset token |
| POST | `/api/auth/reset-password` | Public | Set a new password with token |
| GET/PUT | `/api/profiles/candidate` | Candidate | Read/update own profile |
| GET/PUT | `/api/profiles/recruiter` | Recruiter | Read/update own company profile |
| GET | `/api/jobs` | Public | Search published, open, and active jobs (`q`, `location`, `page`, `limit`) |
| GET | `/api/jobs/mine` | Recruiter | List own jobs with application counts |
| POST | `/api/jobs` | Recruiter | Publish a job (status is always set to `published`) |
| PUT | `/api/jobs/:id` | Owning recruiter | Edit job details |
| PATCH | `/api/jobs/:id/status` | Owning recruiter | Publish/reopen or close a job (`published` or `closed`) |
| DELETE | `/api/jobs/:id` | Owning recruiter | Close a job (compatibility endpoint) |
| POST | `/api/jobs/:id/apply` | Candidate | Apply and calculate skill match |
| GET | `/api/applications/mine` | Candidate | Own application history |
| GET | `/api/applications/job/:jobId` | Owning recruiter | Applicants ranked by keyword overlap |
| PATCH | `/api/applications/:id/status` | Owning recruiter | Change applicant status |
| POST | `/api/applications/:id/interviews` | Owning recruiter | Schedule an interview |
| GET | `/api/applications/interviews/mine` | Signed in | Own interview schedule |
| POST | `/api/resumes` | Candidate | Upload PDF/DOCX, extract text and known skills |
| GET | `/api/resumes/application/:id` | Applicant or owning recruiter | Authorized resume download |

Registration is limited to candidate and recruiter roles; administrator registration is not available. Recruiters can only modify their own jobs and access applicants/resumes for their jobs.

## Password recovery

No email provider is configured, so TalentIQ does **not** claim to send reset emails. In development, the forgot-password response includes a reset link only when the email belongs to an account. In production the response is generic and no delivery is attempted. Configure a mail provider before offering production password recovery, and remove the development reset link behavior before production deployment.

## Testing

```powershell
npm test
npm run build
```

Unit tests cover the matching service's skill boundaries, score explanation and empty requirements. Production build checks frontend compilation. MongoDB integration and browser end-to-end tests are not included.

## Troubleshooting

- **MongoDB connection refused:** Start MongoDB Community Server or set `MONGODB_URI` to a reachable Atlas URI in `server/.env`.
- **JWT_SECRET error:** Set a private secret with 32 or more characters; do not use the example placeholder.
- **Browser reports a network/CORS error:** Ensure both dev servers are running and `CLIENT_ORIGIN` exactly matches the frontend URL, typically `http://localhost:5173`.
- **Resume rejected:** Only PDF and DOCX are supported and the file must be at most `MAX_UPLOAD_MB` (5 by default). The extension and MIME type are both checked.
- **Scanned PDF has no extracted words:** The baseline extracts embedded PDF text; it does not perform OCR.
- **Duplicate application:** Each candidate can apply to a job once. The unique candidate/job database index enforces this.

## Production notes

Use HTTPS, a strong managed JWT secret, a managed MongoDB deployment, private durable file storage with malware scanning, an email provider for password recovery, and operational logging/backup policies before production use. The current upload directory is local disk and is not a multi-instance storage service. Cookie `SameSite=Lax`, CORS origin allowlisting, and JSON-only state-changing routes provide baseline browser request protection; deploy behind HTTPS and keep origins restricted. Review retention/privacy obligations for resumes before launch.
