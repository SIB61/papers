import { LandingHeader } from "@/components/landing-header";
import { Metadata } from "next";
import Markdown from "@/components/markdown";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for portfolioo",
};

const policyMarkdown = `
# Privacy Policy

*Last updated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}*

## 1. Information We Collect

When you sign in using Google Authentication, we collect the following information provided by your Google account:

- Your email address
- Your name
- Your profile picture (avatar)

We also store the content you create (your markdown posts, settings, and profile details) on our servers to provide the blogging service.

## 2. How We Use Your Information

We use the information we collect solely for the following purposes:

- To create and manage your account and profile.
- To authenticate your identity when you sign in.
- To provide, operate, and maintain the portfolioo platform.

## 3. Data Sharing and Protection

We do not sell, rent, or share your personal information with third parties for marketing purposes. Your data is stored securely in our database, and we implement industry-standard security measures to protect it.

The posts you mark as "Published" will be publicly accessible on your custom subdomain. Drafts remain private and are only accessible by you.

## 4. Data Deletion and Your Rights

You have the right to access, modify, or delete your personal information at any time. If you wish to delete your account and all associated data (including your posts and profile), you can contact us, and we will process your request promptly.

## 5. Contact Us

If you have any questions or concerns about this Privacy Policy or our data practices, please contact us through our website.
`;

export default function PrivacyPolicyPage() {
  return (
    <>
      <LandingHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-20 animate-page-in">
        <article className="mx-auto max-w-[680px]">
          <Markdown>{policyMarkdown}</Markdown>
        </article>
      </main>
      
      <footer className="border-t border-border mt-auto">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 text-xs text-muted-foreground">
          <span>portfolioo · a markdown blog</span>
          <span>{new Date().getFullYear()}</span>
        </div>
      </footer>
    </>
  );
}
