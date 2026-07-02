import { Mail, Phone, Apple, Play } from "lucide-react";

interface ContactBadgeProps {
  email?: string | null;
  phone?: string | null;
  socialLinks?: Record<string, string> | null;
  bestContact?: string | null;
}

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export function ContactBadge({ email, phone, socialLinks }: ContactBadgeProps) {
  const hasSocial = socialLinks && Object.keys(socialLinks).length > 0;

  return (
    <div className="flex flex-col gap-1.5 py-1">
      {email && (
        <a
          href={`mailto:${email}`}
          title={email}
          className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-150"
        >
          <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span className="truncate max-w-[170px] font-medium">{email}</span>
        </a>
      )}
      {phone && (
        <a
          href={`tel:${phone}`}
          title={phone}
          className="inline-flex items-center gap-1.5 text-xs text-green-600 hover:text-green-800 hover:underline transition-colors duration-150"
        >
          <Phone className="w-3.5 h-3.5 text-green-500 shrink-0" />
          <span className="font-medium">{phone}</span>
        </a>
      )}
      {hasSocial && (
        <div className="flex flex-col gap-1.5">
          {Object.entries(socialLinks).map(([platform, url]) => {
            if (platform === "playStore") {
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-800 hover:underline transition-colors duration-150"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="font-medium">Google Play App</span>
                </a>
              );
            }
            if (platform === "appStore") {
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-gray-700 hover:text-gray-900 hover:underline transition-colors duration-150"
                >
                  <Apple className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                  <span className="font-medium">App Store App</span>
                </a>
              );
            }
            if (platform === "facebook") {
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-900 hover:underline transition-colors duration-150"
                >
                  <FacebookIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="font-medium">Facebook</span>
                </a>
              );
            }
            if (platform === "instagram") {
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-pink-600 hover:text-pink-800 hover:underline transition-colors duration-150"
                >
                  <InstagramIcon className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                  <span className="font-medium">Instagram</span>
                </a>
              );
            }
            return null;
          })}
        </div>
      )}
      {!email && !phone && !hasSocial && (
        <span className="text-xs text-muted/60 font-medium">No contact info</span>
      )}
    </div>
  );
}
