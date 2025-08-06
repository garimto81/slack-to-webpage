# Slack to Webpage Automator

This project automatically creates and updates a webpage based on messages and threads from a specific Slack channel. It uses Gemini AI to transform Slack messages into well-formatted, readable HTML content, which is then hosted on Vercel.

## Key Features

- **Real-time Automation:** New Slack messages instantly generate a new webpage.
- **Thread Updates:** Replies in a Slack thread are automatically appended to the corresponding webpage, creating a cohesive narrative.
- **AI-Powered Content:** Leverages Google's Gemini AI to intelligently format raw text into structured HTML with enhanced readability.
- **Serverless Architecture:** Built with Next.js and hosted on Vercel, utilizing Vercel Postgres for data storage.

---

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with [@tailwindcss/typography](https://tailwindcss.com/docs/typography-plugin)
- **Database:** [Vercel Postgres](https://vercel.com/storage/postgres)
- **AI:** [Google Gemini](https://gemini.google.com/)
- **Deployment:** [Vercel](https://vercel.com)
- **API:** [Slack Bolt](https://slack.dev/bolt-js)

---

## Setup and Configuration

### 1. Clone the Repository

```bash
git clone https://github.com/garimto81/slack-to-webpage.git
cd slack-to-webpage
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

This project requires several environment variables for its services to work. You can manage them by creating a `.env.local` file in the root of the project.

1.  **Link to Vercel Project:**
    Connect your local repository to a Vercel project to handle environment variables seamlessly.
    ```bash
    npx vercel link
    ```

2.  **Add Secrets to Vercel:**
    Use the Vercel CLI to add your secret keys. This is the recommended way to avoid exposing secrets.
    ```bash
    # Add your Gemini API Key
    npx vercel env add GEMINI_API_KEY

    # Add your Slack Bot Token (starts with xoxb-)
    npx vercel env add SLACK_BOT_TOKEN

    # Add your Slack Signing Secret
    npx vercel env add SLACK_SIGNING_SECRET

    # Add the ID of the Slack channel you want to monitor
    npx vercel env add SLACK_CHANNEL_ID
    ```

3.  **Pull Environment Variables Locally:**
    This command will create a `.env.local` file with all the variables you set up in Vercel, including the `POSTGRES_URL` from your Vercel Postgres database.
    ```bash
    npx vercel env pull .env.local
    ```

### 4. Create Database Table

Connect to your Vercel Postgres database and run the SQL script located in `scripts/create-pages-table.sql` to create the `pages` table.

### 5. Deploy to Vercel

Commit any changes and push to your main branch. Vercel will automatically build and deploy the project.

```bash
git push origin main
```

---

## How It Works

1.  **Event Trigger:** A new message in the designated Slack channel triggers an event.
2.  **API Endpoint:** The event is sent to the `/api/slack/events` endpoint deployed on Vercel.
3.  **AI Transformation:** The API forwards the message content to Gemini AI, which returns a structured HTML version.
4.  **Database Storage:** The generated HTML is stored in the Vercel Postgres database, linked to the Slack message's timestamp (`thread_ts`).
5.  **Frontend Rendering:** When a user visits `/<thread_ts>`, the Next.js frontend fetches the HTML from the database and renders it.