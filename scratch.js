const fs = require('fs');
let code = fs.readFileSync('components/social-links-form.tsx', 'utf8');

code = code.replace(
  'import { Twitter, Github, Linkedin, Whatsapp } from "@/components/icons";',
  'import { Twitter, Github, Linkedin, Whatsapp } from "@/components/icons";\nimport { BookOpen } from "lucide-react";\nimport { MediumImportButton } from "@/components/medium-import";'
);

code = code.replace(
  'user: { twitter: string; github: string; linkedin: string; website: string; contactEmail: string; whatsapp: string };',
  'user: { twitter: string; github: string; linkedin: string; medium: string; website: string; contactEmail: string; whatsapp: string };'
);

code = code.replace(
  '    linkedin: user.linkedin || "",',
  '    linkedin: user.linkedin || "",\n    medium: user.medium || "",'
);

code = code.replace(
  '      linkedin: user.linkedin || "",',
  '      linkedin: user.linkedin || "",\n      medium: user.medium || "",'
);

code = code.replace(
  '    formData.linkedin.trim() !== (user.linkedin || "") ||',
  '    formData.linkedin.trim() !== (user.linkedin || "") ||\n    formData.medium.trim() !== (user.medium || "") ||'
);

const mediumJSX = `        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="medium" className="text-sm font-medium">Medium</label>
            {user.medium && <MediumImportButton />}
          </div>
          <div className="relative">
            <BookOpen className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="medium"
              name="medium"
              type="text"
              value={formData.medium}
              onChange={handleChange}
              placeholder="username"
              className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all"
            />
          </div>
        </div>
`;

code = code.replace(
  '        <div className="space-y-2">\n          <label htmlFor="linkedin"',
  mediumJSX + '        <div className="space-y-2">\n          <label htmlFor="linkedin"'
);

fs.writeFileSync('components/social-links-form.tsx', code);
