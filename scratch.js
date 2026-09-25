const fs = require('fs');
let code = fs.readFileSync('app/[username]/page.tsx', 'utf8');

code = code.replace(
  'import { Markdown } from "@/components/markdown";',
  'import Markdown from "@/components/markdown";'
);

code = code.replace(
  '<Markdown content={user.portfolio} />',
  '<Markdown>{user.portfolio}</Markdown>'
);

code = code.replace(
  '<div className="mb-16 prose prose-neutral dark:prose-invert max-w-none">',
  '<div className="mb-16">'
);

fs.writeFileSync('app/[username]/page.tsx', code);
