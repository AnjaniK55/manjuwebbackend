# ManjuWeb Agency Backend

Backend REST API for the ManjuWeb Agency portfolio website and admin command center dashboard.

## Features

- Secure Authentication: JWT-based admin session authentication and password encryption.
- Client CRM: Receives client project configuration structures and emails notifications.
- CMS Administration: Fully equipped CRUD APIs for Services, Projects, Blogs, and Testimonials.
- Visitor Telemetry: Tracks page views, device metrics, and browser stats.
- Security Hardening: Configurable CORS origins, Helmet secure headers, and IP rate limits.

## Tech Stack

- Runtime: Node.js (ES Module support)
- Framework: Express.js
- Database: MongoDB (Mongoose models) with automatic local JSON database fallback.
- Email: Nodemailer

## Setup

1. Configure .env from .env.example.
2. Run npm install.
3. Run npm start.
