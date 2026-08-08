import { db } from "../lib/db/index";
import { posts, users } from "../lib/db/schema";

async function main() {
  const seed = [
    {
      slug: "hello",
      title: "Hello, world",
      status: "published" as const,
      content: `# Hello, world

Your blog is live. Everything here is written in **markdown**.

## How it works

1. Open the [editor](/write)
2. Write the post in markdown
3. Give it a **path** — for example \`portfolio/cv\`
4. Set it to *published* and it is served at that path

\`\`\`
npm run dev
\`\`\`
`,
    },
    {
      slug: "portfolio",
      title: "Portfolio",
      status: "template" as const,
      content: `# Portfolio

## Selected work

### Project — year

A short description of what it is, what it does, and the stack.
`,
    },
  ];

  const owner = (await db.select().from(users).limit(1))[0];
  if (!owner) {
    console.error("No user found. Sign in once, then run the seed again.");
    process.exit(1);
  }

  for (const post of seed) {
    await db
      .insert(posts)
      .values({ ...post, userId: owner.id })
      .onConflictDoNothing({ target: [posts.userId, posts.slug] });
    console.log("seeded:", owner.username, post.slug);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});