# Plazen

<p align="center">
  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12C5.66667 8 7.33333 8 10 12C12.6667 16 14.3333 16 17 12C19.6667 8 21 8 21 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="6" cy="10" r="1.5" fill="currentColor"/>
    <circle cx="12" cy="14" r="1.5" fill="currentColor"/>
    <circle cx="18" cy="10" r="1.5" fill="currentColor"/>
  </svg>
</p>

<h2 align="center">Let your schedule build itself.</h2>

Plazen is a modern, open-source task manager that intelligently plans your day for you. Add your flexible to-dos, and it automatically finds the perfect spot in your daily timetable. For crucial, time-sensitive appointments, you can pin them to a specific time. Reclaim your focus and reduce the mental load of planning.

---

## ✨ Key Features

- **Automatic Scheduling**: Add tasks with an estimated duration, and Plazen will find an open slot in your schedule.
- **Time-Sensitive Tasks**: Pin important tasks or appointments to a fixed time.
- **Visual Timetable**: View your entire day at a glance with a clean, intuitive timetable interface.
- **Task Management**: Mark tasks as complete, reschedule them with a simple drag-and-drop or right-click, and delete them when no longer needed.
- **Customizable View**: Adjust your timetable's start and end hours to match your day.
- **Real-time Indicator**: A "time needle" shows you the current time, helping you stay on track.
- **Secure Authentication**: User accounts are securely managed with Supabase Auth.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (React)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Backend & Auth**: [Supabase](https://supabase.io/)
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

## 🚀 Getting Started

Follow these instructions to get a local copy up and running for development and testing purposes.

### Prerequisites

- Node.js (v18.18 or later)
- npm, yarn, or pnpm
- A Supabase account and a new project created.

### 1. Clone the Repository

```bash
git clone [https://github.com/your-username/plazen.git](https://github.com/your-username/plazen.git)
cd plazen
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root of your project and add the following environment variables. You can find the Supabase URL and Anon Key in your Supabase project's API settings.

```env
# Supabase Project URL
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL

# Supabase Anon Key (public)
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# Database connection string (from Supabase project settings)
DATABASE_URL=YOUR_SUPABASE_DATABASE_CONNECTION_STRING

# Your local development URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Important:** Your `DATABASE_URL` should point to your Supabase PostgreSQL database. You can find this in your Supabase project under `Settings` > `Database`. Make sure to add your password to the connection string.

### 4. Set Up the Database

Push the Prisma schema to your Supabase database. This will create the necessary tables (`tasks`, `UserSettings`, etc.).

```bash
npx prisma db push
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. You can now sign up and start using the application.

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is distributed under the MIT License. See `LICENSE` for more information.
