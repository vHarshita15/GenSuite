# GenSuite

GenSuite is a full-stack web application that brings AI-assisted career, content, and image tools together in one place. It includes a React and Vite frontend and an Express API, with Clerk authentication and optional Neon Postgres and Cloudinary integrations.

## Features

- **Career tools:** resume review, LinkedIn profile optimization, and mock interview practice.
- **Image tools:** generate images, remove backgrounds, and remove described objects.
- **Learning and community:** browse opportunities and resources, and share community resources.
- **Accounts:** sign in and manage access with Clerk.

## Tech stack

- Frontend: React, Vite, React Router, Tailwind CSS
- Backend: Node.js, Express
- Authentication: Clerk
- AI providers: Groq and Clipdrop
- Optional data and media services: Neon Postgres and Cloudinary
- Deployment configuration: Vercel (`vercel.json`)

## Requirements

- Node.js 18 or later and npm
- A Clerk application for authentication
- API credentials for the tools you want to use (Groq and Clipdrop)
- Neon Postgres and Cloudinary credentials for features that use those services

## Run locally

### 1. Install dependencies

From the repository root:

```bash
npm install
cd client && npm install
cd ../server && npm install
```

### 2. Configure the backend

Copy `server/.env.example` to `server/.env` and fill in the values for the services you use:

```env
PORT=5000
GROQ_API_KEY=your_groq_api_key
CLIPDROP_API_KEY=your_clipdrop_api_key
DATABASE_URL=your_neon_database_url
CLOUDINARY_URL=your_cloudinary_url
```

`CLERK_SECRET_KEY` and `DATABASE_URL` are required for authenticated API and database features. Configure Cloudinary with `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. Never commit `.env` files or put secret keys in frontend variables.

Start the API:

```bash
cd server
npm run server
```

The API listens on `http://localhost:5000` by default. Its health endpoint is `/api/test`.

### 3. Configure and start the frontend

Copy `client/.env.example` to `client/.env`, then set your Clerk publishable key and local API URL:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_BASE_URL=http://localhost:5000
```

Start the frontend in another terminal:

```bash
cd client
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## Available scripts

| Location | Command | Purpose |
|---|---|---|
| `client/` | `npm run dev` | Start the Vite development server |
| `client/` | `npm run build` | Build the frontend for production |
| `client/` | `npm run preview` | Preview the production build locally |
| `client/` | `npm run lint` | Run ESLint |
| `server/` | `npm run server` | Start the API with nodemon |
| `server/` | `npm start` | Start the API with Node.js |

## Deployment

The repository includes a Vercel configuration for the client and API, including a fallback for React Router deep links. Set production secrets in Vercel project settings: `CLERK_SECRET_KEY`, `DATABASE_URL`, and the provider keys for the tools you enable. Set `VITE_CLERK_PUBLISHABLE_KEY` for the frontend build. If the API is deployed in this same Vercel project, leave `VITE_BASE_URL` blank so the frontend uses same-origin `/api` routes; set it only when the API is hosted separately. Pushes to the configured production branch trigger deployments when Git integration is enabled.

## Security

Keep API secrets in local environment files or your deployment platform's secret settings. Only frontend-safe values should use the `VITE_` prefix because Vite exposes those values to browser code. If a secret has been committed or shared, rotate it with its provider.

## License

No license file is currently included in this repository. Add a `LICENSE` file before redistributing the project under a specific license.
