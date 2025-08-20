# ChatAI - GPT-Powered Chat Assistant

![ChatAI Screenshot 1](https://res.cloudinary.com/dvovo1lfg/image/upload/v1755253932/projects/chat-ai/Screenshot_2025-08-15_155701_dmcmdj.png)

![ChatAI Screenshot 2](https://res.cloudinary.com/dvovo1lfg/image/upload/v1755253931/projects/chat-ai/Screenshot_2025-08-15_155753_y2r4q5.png)

![ChatAI Screenshot 3](https://res.cloudinary.com/dvovo1lfg/image/upload/v1755253931/projects/chat-ai/Screenshot_2025-08-15_155914_uwnpv4.png)

![ChatAI Screenshot 4](https://res.cloudinary.com/dvovo1lfg/image/upload/v1755253931/projects/chat-ai/Screenshot_2025-08-15_160046_vnx7gl.png)

![ChatAI Screenshot 5](https://res.cloudinary.com/dvovo1lfg/image/upload/v1755253931/projects/chat-ai/Screenshot_2025-08-15_155723_ycyk8v.png)

![ChatAI Screenshot 6](https://res.cloudinary.com/dvovo1lfg/image/upload/v1755253931/projects/chat-ai/Screenshot_2025-08-15_160029_s3vijx.png)

![ChatAI Screenshot 7](https://res.cloudinary.com/dvovo1lfg/image/upload/v1755253931/projects/chat-ai/Screenshot_2025-08-15_160117_ovrtg6.png)

ChatAI is a versatile GPT-powered chat assistant that lets users ask questions, upload files, and manage conversations seamlessly. With real-time response streaming, multi-format file support, and secure authentication, it's designed to deliver a smooth AI chat experience. Built with Next.js and integrated with cutting-edge APIs like Groq and OpenRouter, ChatAI combines performance with modern UI/UX.

## Features 🎉

- 💬 **AI-Powered Conversations:** Chat with AI for answers, coding help, or creative ideas.
- 🌊 **Real-Time Streaming:** Responses stream instantly for a natural chat experience.
- ✏️ **Edit Previous Messages:** Correct or refine past messages effortlessly.
- 📂 **File Uploads:** Support for images, PDFs, TXT, CSV, and more.
- 🔍 **Conversation Search:** Quickly find past chats with search functionality.
- 🗑️ **Conversation Management:** Create, delete, and organize chat histories.
- 🔒 **Secure Authentication:** Sign-in/sign-up via Clerk for seamless access.
- 🚀 **Vercel Deployment:** Optimized for speed and scalability.
- 📊 **State Management:** Zustand for lightweight global state.
- 🎨 **Modern UI:** Shadcn UI + TailwindCSS for a sleek, responsive design.

## Installation

To run ChatAI locally:

1. Clone the repository:

```bash
  git clone https://github.com/your-username/chat-ai.git
  cd chat-ai
```

2. Install dependencies:

```bash
 npm install
```

3. Set up environment variables:
   Create a .env file with the following (replace placeholders):

```bash
  # Clerk authentication
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
  CLERK_SECRET_KEY="your-clerk-secret-key"

  # MongoDB connection
  MONGODB_URL="your-mongodb-connection-string"

  # Clerk redirect URLs
  NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
  NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/"
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/"

  # Database URL (same as MONGODB_URL)
  DATABASE_URL="same as above"

  # Mem0 API
  MEM0_API_KEY="your-mem0-api-key"

  # Google APIs
  GOOGLE_API_KEY="your-google-api-key"
  GOOGLE_GENERATIVE_AI_API_KEY="same as above"

  # Groq API
  GROQ_API_KEY="your-groq-api-key"

  # OpenRouter API
  OPENROUTER_API_KEY="your-openrouter-api-key"
  OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"

  # Cloudinary
  CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
  CLOUDINARY_API_KEY="your-cloudinary-api-key"
  CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
  CLOUDINARY_URL="cloudinary://<api_key>:<api_secret>@<cloud_name>"
```

4. Initialize the database:

```bash
  npx prisma generate
  npx prisma db push
```

5. Start the dev server:

```bash
  npm run dev
```

## Technologies Used

- **Frontend:** Next.js 14, TypeScript, TailwindCSS
- **UI Library:** Shadcn UI
- **State Management:** Zustand, Tanstack Query
- **Database:** MongoDB, Prisma ORM
- **Auth:** Clerk
- **APIs:** Groq, OpenRouter, Google Generative AI
- **Storage:** Cloudinary (files), Mem0 (memory)
- **Deployment:** Vercel

## Configuration

Ensure all environment variables (listed above) are set in your `.env` file.

## Usage

Try the live demo: [ChatAI Assistant](https://chat-ai-iota-ashy.vercel.app)

## Contributing

Contributions are welcome! Follow these steps:

1. Fork the repository.
2. Create a branch (`git checkout -b feature/your-feature`).
3. Commit changes (`git commit -m 'Add feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a Pull Request.

## License

License to be decided (MIT/Apache/etc.).
