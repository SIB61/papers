import { LandingHeader } from "@/components/landing-header";
import { Metadata } from "next";
import Markdown from "@/components/markdown";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for portfolioo",
};

const termsMarkdown = `
# Terms of Service

*Last updated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}*

## 1. Acceptance of Terms

By accessing and using portfolioo, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.

## 2. Description of Service

portfolioo is a minimalist markdown-based blogging platform. We provide users with the ability to write, draft, and publish markdown documents to a custom subdomain (e.g., \`username.portfolioo.site\`).

## 3. User Accounts and Content

- **Authentication**: You must sign in using Google Authentication to create and publish content.
- **Responsibility**: You are solely responsible for the content you create and publish on portfolioo.
- **Ownership**: You retain all ownership rights to the content you write. By publishing on portfolioo, you grant us a license to display, host, and distribute your content strictly to provide the service.
- **Prohibited Content**: You may not publish content that is illegal, abusive, harassing, defamatory, or violates the intellectual property rights of others. We reserve the right to remove any content or terminate accounts that violate these guidelines.

## 4. Service Availability

We strive to maintain maximum uptime, but we do not guarantee that the service will be uninterrupted or error-free. We reserve the right to modify, suspend, or discontinue the service at any time with or without notice.

## 5. Limitation of Liability

In no event shall portfolioo or its operators be liable for any direct, indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service, including but not limited to loss of data or unauthorized access to your account.

## 6. Changes to Terms

We may update these Terms of Service from time to time. We will notify you of any significant changes by posting the new Terms on this page. Your continued use of the service after any such changes constitutes your acceptance of the new Terms.

## 7. Contact Information

If you have any questions about these Terms of Service, please contact us through our website.
`;

export default function TermsOfServicePage() {
  return (
    <>
      <LandingHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-20 animate-page-in">
        <article className="mx-auto max-w-[680px]">
          <Markdown>{termsMarkdown}</Markdown>
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
