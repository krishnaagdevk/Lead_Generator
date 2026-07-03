export default function DeliverabilityGuide() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-2">Email Deliverability Guide</h1>
      <p className="text-gray-500 mb-8">How to set up DKIM, SPF, and DMARC for your sending domain</p>

      <Section title="1. What is SPF?">
        <p>Sender Policy Framework (SPF) tells receiving mail servers which IP addresses are allowed to send email for your domain. Without SPF, your emails are more likely to be flagged as spam.</p>
        <CodeBlock>v=spf1 include:spf.your-email-provider.com ~all</CodeBlock>
        <p>Add this as a <strong>TXT record</strong> in your domain&apos;s DNS settings at your registrar (GoDaddy, Namecheap, Cloudflare, etc.).</p>
      </Section>

      <Section title="2. What is DKIM?">
        <p>DomainKeys Identified Mail (DKIM) adds a digital signature to every email you send. Receiving servers verify this signature using a public key published in your DNS.</p>
        <p>Your email provider (Google Workspace, SendGrid, SES, etc.) will give you a DKIM key to add as a <strong>TXT record</strong>.</p>
      </Section>

      <Section title="3. What is DMARC?">
        <p>Domain-based Message Authentication, Reporting & Conformance (DMARC) tells receivers what to do if SPF and DKIM both fail. Start with <code>p=none</code> to monitor, then move to <code>p=quarantine</code>.</p>
        <CodeBlock>v=DMARC1; p=none; rua=mailto:you@yourdomain.com</CodeBlock>
      </Section>

      <Section title="4. Check Your Setup">
        Use tools like <a href="https://mxtoolbox.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">MXToolbox</a> or <a href="https://www.dnsstuff.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">DNSstuff</a> to verify your records are correct.
      </Section>

      <Section title="5. Warming Up a New Domain">
        If you are sending from a brand new domain, warm it up slowly — start with 10–20 emails/day and gradually increase over 2–4 weeks. Cold domains with sudden high volume trigger spam filters.
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <div className="text-gray-600 space-y-3 leading-relaxed">{children}</div>
    </div>
  );
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="bg-gray-100 text-sm p-4 rounded-md overflow-x-auto font-mono border">{children}</pre>
  );
}