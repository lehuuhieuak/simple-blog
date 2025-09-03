# Blog Client - Next.js Frontend

This is the Next.js frontend for the blog application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.local.example .env.local
```

3. Update the `.env.local` file with your API URL (default: http://localhost:8080/api).

4. Make sure the Golang API server is running on port 8080.

5. Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Environment Variables

- `NEXT_PUBLIC_API_URL` - The base URL for the API server (default: http://localhost:8080/api)

## Features

- User authentication (register, login, logout)
- Create, edit, and delete blog posts
- View published posts
- Internationalization (English and Vietnamese)
- Responsive design with Tailwind CSS

## API Integration

The frontend communicates with the Golang API server using JWT tokens for authentication. Tokens are stored in localStorage and automatically included in API requests.