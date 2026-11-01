import { Mail, Phone, Apple, Play, MessageCircle, CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";

interface ContactBadgeProps {
  email?: string | null;
  phone?: string | null;
  socialLinks?: Record<string, string> | null;
  bestContact?: string | null;
  emailVerifiedStatus?: string | null;
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

export function ContactBadge({ email, phone, socialLinks, emailVerifiedStatus }: ContactBadgeProps) {
  const hasSocial = socialLinks && Object.keys(socialLinks).length > 0;

  return (
    <div className="flex flex-col gap-1.5 py-0.5">
      {email && (
        <div className="flex items-center gap-1.5">
          <a
            href={`mailto:${email}`}
            title={email}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/90 border border-indigo-200/60 px-2 py-0.5 rounded-md transition-colors font-medium max-w-[210px] truncate"
          >
            <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="truncate">{email}</span>
          </a>
          {emailVerifiedStatus === "valid" && (
            <span title="Verified email" className="text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          )}
          {emailVerifiedStatus === "catchall" && (
            <span title="Risky / Catch-all email" className="text-amber-500">
              <HelpCircle className="w-3.5 h-3.5" />
            </span>
          )}
          {emailVerifiedStatus === "invalid" && (
            <span title="Invalid email" className="text-rose-500">
              <AlertCircle className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      )}

      {phone && (
        <div className="flex items-center gap-1.5">
          <a
            href={`tel:${phone}`}
            title={phone}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-slate-700 hover:text-slate-900 font-medium hover:underline"
          >
            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{phone}</span>
          </a>
          <a
            href={`https://wa.me/${phone.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Chat on WhatsApp"
            className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 px-1.5 py-0.5 rounded transition-colors"
          >
            <MessageCircle className="w-2.5 h-2.5 text-emerald-600" />
            WA
          </a>
        </div>
      )}

      {hasSocial && (
        <div className="flex items-center gap-1.5 pt-0.5">
          {Object.entries(socialLinks).map(([platform, url]) => {
            if (platform === "playStore") {
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title="Google Play App"
                  className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
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
                  onClick={(e) => e.stopPropagation()}
                  title="App Store App"
                  className="p-1 rounded text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <Apple className="w-3.5 h-3.5" />
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
                  onClick={(e) => e.stopPropagation()}
                  title="Facebook"
                  className="p-1 rounded text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <FacebookIcon className="w-3.5 h-3.5" />
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
                  onClick={(e) => e.stopPropagation()}
                  title="Instagram"
                  className="p-1 rounded text-pink-600 hover:bg-pink-50 transition-colors"
                >
                  <InstagramIcon className="w-3.5 h-3.5" />
                </a>
              );
            }
            return null;
          })}
        </div>
      )}

      {!email && !phone && !hasSocial && (
        <span className="text-[11px] text-slate-400 font-medium">No contact info</span>
      )}
    </div>
  );
}
