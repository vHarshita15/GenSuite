# GenSuite frontend

The GenSuite frontend is a React application built with Vite. It provides the career, AI image, learning, and community experiences in the GenSuite platform.

For full project setup, backend configuration, and deployment instructions, see the [main GenSuite README](../README.md).

## Run locally

From this directory, install dependencies and create a `.env` file:

```bash
npm install
```

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_BASE_URL=http://localhost:5000
```

Start the development server:

```bash
npm run dev
```

Vite prints the local address, usually `http://localhost:5173`.

## Scripts

- `npm run dev` — start the development server
- `npm run build` — create a production build in `dist/`
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint
