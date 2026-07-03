# LeadHunter — Complete Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Environment Variables](#environment-variables)
5. [Database Schema](#database-schema)
6. [Features Implementation](#features-implementation)
   - [Phase 1: Lead Discovery & Enrichment](#phase-1-lead-discovery--enrichment)
   - [Phase 2: Outreach & Communication](#phase-2-outreach--communication)
   - [Phase 3: CRM & Pipeline Enhancements](#phase-3-crm--pipeline-enhancements)
   - [Phase 4: Smart AI Features](#phase-4-smart-ai-features)
   - [Phase 5: Analytics & Reporting](#phase-5-analytics--reporting)
   - [Phase 6: Integrations](#phase-6-integrations)
   - [Phase 7: Trust & Deliverability](#phase-7-trust--deliverability)
   - [Phase 8: Platform Extensions](#phase-8-platform-extensions)
7. [API Reference](#api-reference)
8. [Background Jobs](#background-jobs)
9. [UI Components](#ui-components)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)

---

## Project Overview

**LeadHunter** is a comprehensive lead generation and outreach platform for web design agencies. It automates finding local businesses that need websites, enriching their contact info, and managing multi-channel outreach campaigns.

### Key Value Proposition
- **Automated Lead Discovery**: Find businesses with poor or no websites via Google Maps data
- **AI-Powered Enrichment**: Find emails, check domain expiry, analyze reviews
- **Multi-Channel Outreach**: Email sequences, SMS, call scripts
- **CRM & Pipeline**: Drag-and-drop Kanban with deal values
- **AI Personalization**: Generate drafts, proposals, tone analysis, spam checks
- **Analytics**: Revenue dashboard, search heatmap, weekly summary emails
- **Integrations**: Slack notifications, Calendly, Zapier/Make webhooks, Notion export
- **Platform**: Public REST API with API keys, white-label branding

---

## Architecture

### Tech Stack
- **Frontend**: Next.js 16 (App Router) with React 19
- **Backend**: Next.js API routes (Node.js)
- **Database**: PostgreSQL (via Neon) with Prisma ORM
- **Auth**: Session-based JWT tokens
- **AI**: Groq (Llama 3 8B) for all content generation
- **Email**: Gmail API (OAuth) for sending, tracking, reply detection
- **Maps**: Google Places API for business discovery, geocoding
- **SMS**: Twilio
- **Slack**: @slack/web-api
- **Background Jobs**: Database-backed queue with Prisma

### Project Structure
```
frontend/
├── app/
│   ├── (app)/           # Authenticated routes
│   │   ├── analytics/   # Revenue dashboard, heatmap
│   │   ├── campaigns/   # Campaign report
│   │   ├── compose/     # Email/SMS compose
│   │   ├── guide/       # User guide + deliverability guide
│   │   ├── leads/       # Leads list, pitch page
│   │   ├── pipeline/    # Kanban pipeline
│   │   ├── search/      # Lead discovery
│   │   └── settings/    # Profile, Gmail, integrations, API keys, branding
│   ├── api/             # All API routes
│   │   ├── v1/          # Public REST API (API key auth)
│   │   ├── analytics/   # Heatmap, revenue
│   │   ├── campaigns/   # CRUD, drafts, steps, enroll, send, export
│   │   ├── leads/       # CRUD, enrich, sms, call-script, pitch, export
│   │   ├── tasks/       # Task CRUD
│   │   ├── tools/       # rank-subjects, analyze-tone, spam-score, export-notion, api-keys
│   │   ├── auth/        # Login, signup, logout, me
│   │   ├── settings/    # User settings PATCH
│   │   ├── search/      # Search jobs
│   │   └── team/        # Team management
│   ├── login/ & signup/
│   └── (marketing)/     # Landing page
├── components/
│   ├── layout/          # Sidebar (white-label aware)
│   ├── leads/           # LeadsTable, LeadDetailDrawer, TaskPanel, StatusBadge, ExportMenu, FilterBar
│   ├── pipeline/        # KanbanColumn, KanbanCard
│   ├── campaigns/       # SequenceBuilder
│   ├── search/          # SearchPanel, MapView
│   └── ui/              # Button, Input
├── lib/
│   ├── db.ts            # Prisma client singleton
│   ├── utils.ts         # cn() utility
│   ├── server/
│   │   ├── auth.ts      # JWT sign/verify, getSession
│   │   ├── jobs.ts      # All background job handlers
│   │   ├── queue.ts     # Job queue system
│   │   ├── groq.ts      # AI functions (draft, reply, call-script, pitch, subject-rank, tone, spam)
│   │   ├── gmail.ts     # Gmail API send/receive
│   │   ├── places.ts    # Google Places search + details
│   │   ├── geocoding.ts # Lat/lng utilities
│   │   ├── crawler.ts   # Website contact scraping
│   │   ├── scoring.ts   # Lead scoring algorithm
│   │   ├── ping.ts      # Website status check
│   │   ├── enrichment.ts # Hunter.io email finder
│   │   ├── domainChecker.ts # WHOIS domain expiry
│   │   ├── sentimentAnalysis.ts # Google review AI analysis
│   │   ├── sms.ts       # Twilio SMS
│   │   ├── slack.ts     # Slack notifications (per-user token support)
│   │   ├── notion.ts    # Notion export
│   │   ├── webhook.ts   # Webhook fire-and-forget
│   │   ├── apiKeyAuth.ts # Public API key auth
│   │   └── verification.ts # ZeroBounce email verification
│   └── generated/prisma/ # Prisma generated client
├── prisma/
│   └── schema.prisma    # Complete database schema
└── public/              # Static assets
```

---

## Installation

### Prerequisites
- Node.js 20+
- Bun 1.3+
- PostgreSQL (Neon recommended)
- Google Cloud (Places API, Gmail API)
- API keys: Groq, Hunter.io, Twilio, etc.

### Setup
```bash
git clone <repo-url>
cd frontend
bun install
# Set up .env.local (see below)
bunx prisma db push
bunx prisma generate
bun run dev
```

---

## Environment Variables
```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"

# Auth
JWT_SECRET="your-jwt-secret"
ENCRYPTION_KEY="32-char-key"

# Google APIs
GOOGLE_PLACES_API_KEY="..."
GOOGLE_OAUTH_CLIENT_ID="..."
GOOGLE_OAUTH_CLIENT_SECRET="..."
GOOGLE_REDIRECT_URI="http://localhost:3000/api/email-accounts/callback"
NEXT_PUBLIC_GOOGLE_MAPS_KEY="..."

# AI
GROQ_API_KEY="..."

# Enrichment
HUNTER_API_KEY="..."
WHOIS_API_KEY="..."

# SMS
TWILIO_ACCOUNT_SID="..."
TWILIO_AUTH_TOKEN="..."
TWILIO_FROM_NUMBER="+1xxxxxxxxxx"

# Email Delivery
RESEND_API_KEY="re_xxx"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# Integrations
SLACK_BOT_TOKEN="xoxb-..."
SLACK_CHANNEL_ID="C0XXX"
NOTION_API_KEY="secret_..."
NOTION_DATABASE_ID="..."

# Verification
ZERO_BOUNCE_API_KEY="..."
```

---

## Database Schema

### User
```prisma
model User {
  id               Int
  email            String     @unique
  passwordHash     String
  plan             Plan       @default(free)
  usageLeads       Int        @default(0)
  usageAiCalls     Int        @default(0)
  stripeCustomerId String?
  parentId         Int?
  role             String     @default("owner")
  createdAt        DateTime   @default(now())

  // Integrations
  calendlyUrl      String?
  slackBotToken    String?
  slackChannelId   String?
  webhookUrl       String?
  webhookEnabled   Boolean    @default(false)

  // White-label
  brandName        String?
  brandLogo        String?
  brandColor       String?
  whiteLabel       Boolean    @default(false)

  // Relations
  parent           User?          @relation("TeamMembers")
  teamMembers      User[]         @relation("TeamMembers")
  searchJobs       SearchJob[]
  leads            Lead[]
  emailAccounts    EmailAccount[]
  campaigns        Campaign[]
  suppressions     Suppression[]
  savedSearches    SavedSearch[]
  smsLogs          SmsLog[]
  tasks            Task[]
  apiKeys          ApiKey[]
}
```

### Lead
```prisma
model Lead {
  id                  Int
  userId              Int
  searchJobId         Int
  placeId             String
  name                String
  category            String?
  address             String?
  phone               String?
  email               String?
  emailVerifiedStatus EmailVerifiedStatus @default(unverified)
  emailVerifiedAt     DateTime?
  leadScore           Int                 @default(0)
  websiteUrl          String?
  websiteStatus       WebsiteStatus       @default(unknown)
  socialLinks         Json?
  bestContact         BestContact?
  rating              Float?
  reviewCount         Int?
  mapsUrl             String?
  pipelineStage       PipelineStage       @default(new)
  notes               String?
  createdAt           DateTime            @default(now())

  // Enrichment
  enrichedAt            DateTime?
  enrichmentSource      String?
  decisionMakerName     String?
  decisionMakerTitle    String?
  decisionMakerLinkedIn String?

  // Domain expiry
  domainExpiryDate      DateTime?
  domainExpiresInDays   Int?

  // Geolocation (heatmap)
  lat   Float?
  lng   Float?

  // Review sentiment
  reviewSentiment    String?
  reviewPainPoints   Json?
  reviewPitchAngle   String?

  // Deal tracking
  dealValue       Float?
  dealClosedAt    DateTime?
  dealNotes       String?

  // Relations
  user            User              @relation
  searchJob       SearchJob         @relation
  emailDrafts     EmailDraft[]
  emailLogs       EmailLog[]
  enrollments     SequenceEnrollment[]
  smsLogs         SmsLog[]
  tasks           Task[]
}
```

### Campaign & Sequences
```prisma
model Campaign {
  id              Int
  userId          Int
  emailAccountId  Int?
  name            String
  templateSubject String
  templateBody    String
  status          CampaignStatus @default(draft)
  scheduledAt     DateTime?
  followUpDays    Int?
  followUpCount   Int            @default(0)
  createdAt       DateTime       @default(now())
  isSequence      Boolean        @default(false)
  user            User           @relation
  emailAccount    EmailAccount?  @relation
  steps           SequenceStep[]
  enrollments     SequenceEnrollment[]
  drafts          EmailDraft[]
  logs            EmailLog[]
}

model SequenceStep {
  id          Int
  campaignId  Int
  stepNumber  Int
  delayDays   Int            @default(3)
  subject     String
  body        String
  createdAt   DateTime       @default(now())
  campaign    Campaign       @relation(onDelete: Cascade)
  enrollments SequenceEnrollment[]
}

enum EnrollmentStatus { active completed replied unsubscribed failed }

model SequenceEnrollment {
  id           Int
  leadId       Int
  campaignId   Int
  stepId       Int?
  currentStep  Int              @default(1)
  status       EnrollmentStatus @default(active)
  nextSendAt   DateTime
  createdAt    DateTime         @default(now())
  lead         Lead             @relation
  campaign     Campaign         @relation
  step         SequenceStep?    @relation
  @@unique([leadId, campaignId])
}
```

### Other Models
- **ApiKey**: `id, userId, name, keyHash (unique), keyPrefix, lastUsed, createdAt`
- **Task**: `id, userId, leadId?, title, description?, dueAt, completedAt?, createdAt`
- **SmsLog**: `id, leadId, userId, message, twilioSid?, status, sentAt`
- **EmailAccount**: OAuth token storage, daily limits, warmup
- **EmailDraft**: Per-lead email drafts with status tracking
- **EmailLog**: Sent email tracking, open/reply detection
- **SearchJob**: Search parameters, status, results
- **SavedSearch**: User-preserved search criteria
- **JobQueue**: Background job system (taskType, payload, status, runAt, attempts)
- **Suppression**: Bounced/unsubscribed email suppression
- **SequenceEnrollment**: Lead enrollment in a sequence (compound unique leadId+campaignId)

---

## Features Implementation

### Phase 1: Lead Discovery & Enrichment

#### 1.1 Email Finder (Hunter.io)
- **File**: `lib/server/enrichment.ts`
- **Job**: `enrichLead()` in `lib/server/jobs.ts`
- **API Routes**: `POST /api/leads/[id]/enrich`, `POST /api/leads/enrich-bulk`
- **UI**: Enrich button per row in LeadsTable, "Find Emails (N)" bulk button
- **Schema**: `enrichedAt`, `enrichmentSource`, `decisionMakerName`, `decisionMakerTitle`, `decisionMakerLinkedIn`

#### 1.2 Domain Expiry Checker
- **File**: `lib/server/domainChecker.ts` (WHOIS XML API)
- **Job**: `checkLeadDomainExpiry()` in `lib/server/jobs.ts`
- **UI**: Warning badge in LeadDetailDrawer when `domainExpiresInDays <= 90`
- **Schema**: `domainExpiryDate DateTime?`, `domainExpiresInDays Int?`

#### 1.3 Review Sentiment Analysis
- **File**: `lib/server/sentimentAnalysis.ts` (Groq AI)
- **Job**: `analyzeLeadReviews()` in `lib/server/jobs.ts`
- **UI**: Amber insight card in LeadDetailDrawer showing pitch angle + pain points
- **Schema**: `reviewSentiment`, `reviewPainPoints (Json)`, `reviewPitchAngle`
- **Integration**: `buildPrompt()` in `groq.ts` includes `reviewPitchAngle` in email generation

### Phase 2: Outreach & Communication

#### 2.1 Multi-Step Email Sequences
- **API**: `campaigns/[id]/steps` (GET/POST), `steps/[stepId]` (PATCH/DELETE), `enroll` (POST)
- **Job**: `processSequences()` — auto-sends next step after delay, stops on reply
- **UI**: `SequenceBuilder.tsx` component in compose page (up to 5 steps)
- **Toggle**: `isSequence` checkbox on campaign creation
- **Auto-stop**: Reply detection triggers `sequenceEnrollment.updateMany({ status: "replied" })`

#### 2.2 SMS via Twilio
- **File**: `lib/server/sms.ts`
- **API Route**: `POST /api/leads/[id]/sms`
- **UI**: SMS compose card in LeadDetailDrawer when `lead.phone` is set (160 char limit)
- **Schema**: `SmsLog` model

#### 2.3 AI Call Script Generator
- **Function**: `generateCallScript()` in `lib/server/groq.ts`
- **API Route**: `POST /api/leads/[id]/call-script`
- **UI**: "Generate Call Script" button + expandable card with Opening/Pitch/Objection/CTA sections

### Phase 3: CRM & Pipeline

#### 3.1 Deal Value & Revenue Dashboard
- **Schema**: `dealValue`, `dealClosedAt`, `dealNotes`
- **API Route**: `GET /api/analytics/revenue` — groupBy pipelineStage with sum/count
- **Page**: `app/(app)/analytics/revenue/page.tsx` — stats cards + stage breakdown table
- **UI**: Deal value input in LeadDetailDrawer, deal value badge in KanbanCard
- **Pipeline card**: `KanbanCard.tsx` shows `$N,NNN` when `dealValue` is set

#### 3.2 Task & Reminder System
- **Schema**: `Task` model (title, description, dueAt, completedAt, leadId)
- **API Routes**: `GET/POST /api/tasks`, `PATCH/DELETE /api/tasks/[id]`
- **UI**: `TaskPanel.tsx` component in LeadDetailDrawer — add, complete, delete tasks

#### 3.3 Duplicate Detection
- **Logic in `runSearchJob()`**: Checks `placeId` first, then case-insensitive `name + address` compound match
- If duplicate found, updates existing lead with fresh `rating`/`reviewCount`/`mapsUrl` instead of creating new

### Phase 4: Smart AI Features

#### 4.1 AI Pitch Generator
- **Function**: `generatePitch()` in `lib/server/groq.ts`
- **API Route**: `POST /api/leads/[id]/pitch` — returns `{ headline, problem, solution, proof, pricing, cta }`
- **Page**: `app/(app)/leads/[id]/pitch/page.tsx` — print-friendly proposal with `window.print()`
- **UI**: "Generate Sales Proposal" link in LeadDetailDrawer

#### 4.2 Subject Line Optimizer
- **Function**: `rankSubjectLines()` in `lib/server/groq.ts`
- **API Route**: `POST /api/tools/rank-subjects`
- **UI**: Detects `|||` delimiter in subject field, shows "Rank these subject lines" button + ranked list

#### 4.3 Email Tone Analyzer
- **Function**: `analyzeTone()` in `lib/server/groq.ts` — returns score, issues, suggestions, verdict
- **API Route**: `POST /api/tools/analyze-tone`
- **UI**: "Analyze Tone" button in DraftEditor, color-coded score + issues + suggestions panel

### Phase 5: Analytics & Reporting

#### 5.1 Search Heatmap
- **Schema**: `lat Float?`, `lng Float?` on Lead (populated during search job)
- **API Route**: `GET /api/analytics/heatmap`
- **Page**: `app/(app)/analytics/heatmap/page.tsx` — uses `@react-google-maps/api` HeatmapLayer
- **Visual**: Google Map with lead density heatmap overlay

#### 5.2 Weekly Summary Email
- **Job**: `sendWeeklySummary()` — counts new leads, sent emails, replies, won deals
- **Delivery**: Uses Resend API (`POST https://api.resend.com/emails`)
- **Self-perpetuating**: Reschedules itself every 604,800 seconds (7 days)
- **Seeded**: On queue worker start if no pending weekly_summary job exists

### Phase 6: Integrations

#### 6.1 Slack Notifications
- **File**: `lib/server/slack.ts` — supports per-user tokens + global env vars
- **Integration 1**: `checkAllCampaignReplies()` fires `sendSlackReplyNotification()` on reply detection
- **Integration 2**: Lead PATCH handler fires `sendSlackPipelineNotification()` on stage change
- **Settings UI**: Slack Bot Token + Channel ID fields in integrations section

#### 6.2 Calendly Integration
- **Schema**: `calendlyUrl String?` on User
- **Integration**: `buildPrompt()` appends P.S. with Calendly link when drafting emails
- **Settings UI**: Calendly URL field in integrations section

#### 6.3 Zapier/Make Webhook
- **Schema**: `webhookUrl String?`, `webhookEnabled Boolean @default(false)` on User
- **Integration**: `runSearchJob()` fires POST to webhook URL for each new lead
- **Payload**: `{ event: "leads.created", timestamp, data: { count, leads: [...] } }`
- **Settings UI**: Webhook URL + enabled toggle in integrations section

#### 6.4 Notion Export
- **File**: `lib/server/notion.ts` — creates pages in Notion database
- **API Route**: `POST /api/tools/export-notion`
- **Properties**: Name, Email, Phone, Address, Website Status, Lead Score, Maps URL
- **Settings**: Requires `NOTION_API_KEY` and `NOTION_DATABASE_ID` env vars

### Phase 7: Trust & Deliverability

#### 7.1 Email Verification (ZeroBounce)
- **File**: `lib/server/verification.ts` — updated with ZeroBounce API call
- **Status mapping**: valid, invalid, catch_all, spamtrap, abuse → Prisma EmailVerifiedStatus
- **Fallback**: Returns "unknown" if no API key configured

#### 7.2 Spam Score Checker
- **Function**: `checkSpamScore()` in `lib/server/groq.ts` — AI analyzes for spam signals
- **API Route**: `POST /api/tools/spam-score`
- **UI**: "Check Spam" button in DraftEditor, color-coded risk badge (green/amber/red) + flags + suggestions

#### 7.3 DKIM/SPF Setup Guide
- **Page**: `app/(app)/guide/deliverability/page.tsx` — static guide with SPF, DKIM, DMARC explanations + DNS record examples
- **Sections**: SPF record format, DKIM key setup, DMARC policy, warming up new domains, verification tools

### Phase 8: Platform Extensions

#### 8.1 Public API with API Keys
- **Schema**: `ApiKey` model (name, keyHash, keyPrefix, lastUsed)
- **Auth**: `lib/server/apiKeyAuth.ts` — extracts Bearer `lh_*` key, bcrypt-verifies against stored hash
- **API Route**: `GET/POST /api/v1/leads` — paginated list + create lead (API key instead of session)
- **Management Routes**: `GET/POST/DELETE /api/tools/api-keys` — list, create (returns key once), revoke
- **Settings UI**: "API Keys" section with list, create, copy, delete

#### 8.2 White-Label Mode
- **Schema**: `brandName`, `brandLogo`, `brandColor`, `whiteLabel` on User
- **Sidebar**: Server-rendered props pass `brandName`/`brandLogo`/`brandColor` — replaces "LeadHunter" text + pin icon
- **Settings UI**: Brand Name, Logo URL, Color picker (hex), preview card, enable toggle (available to all plans)
- **Layout**: Reads from Prisma in server component layout, passes to Sidebar

---

## API Reference

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login, returns JWT cookie |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/me` | Current user (incl. integrations + brand) |
| PATCH | `/api/auth/me` | Update email, password, plan |

### Leads
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/leads` | List leads (filter: websiteStatus, hasEmail, minRating, minScore, sortBy, category, pipelineStage) |
| GET | `/api/leads/[id]` | Lead detail with emailLogs, drafts |
| PATCH | `/api/leads/[id]` | Update (pipelineStage, notes, email, phone, dealValue, dealClosedAt, dealNotes) |
| DELETE | `/api/leads/[id]` | Delete lead + related logs/drafts |
| POST | `/api/leads/[id]/enrich` | Queue email enrichment |
| POST | `/api/leads/[id]/sms` | Send SMS |
| POST | `/api/leads/[id]/call-script` | Generate call script |
| POST | `/api/leads/[id]/pitch` | Generate sales proposal |
| POST | `/api/leads/enrich-bulk` | Bulk enrich (all or by IDs) |

### Campaigns
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/campaigns` | List campaigns |
| POST | `/api/campaigns` | Create campaign (supports `isSequence`) |
| GET | `/api/campaigns/[id]/drafts` | List drafts for campaign |
| POST | `/api/campaigns/[id]/generate` | Queue AI draft generation |
| POST | `/api/campaigns/[id]/send` | Queue send |
| GET | `/api/campaigns/[id]/stats` | Campaign stats |
| POST | `/api/campaigns/[id]/export` | Export campaign as CSV |
| GET | `/api/campaigns/[id]/steps` | List sequence steps |
| POST | `/api/campaigns/[id]/steps` | Add step |
| PATCH | `/api/campaigns/[id]/steps/[stepId]` | Update step |
| DELETE | `/api/campaigns/[id]/steps/[stepId]` | Delete step |
| POST | `/api/campaigns/[id]/enroll` | Enroll leads in sequence |

### Tasks
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/tasks` | List tasks (filter: leadId) |
| POST | `/api/tasks` | Create task |
| PATCH | `/api/tasks/[id]` | Update/complete task |
| DELETE | `/api/tasks/[id]` | Delete task |

### Analytics
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/analytics/revenue` | Revenue by pipeline stage |
| GET | `/api/analytics/heatmap` | Lead coordinates for heatmap |

### Tools
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/tools/rank-subjects` | Rank subject lines |
| POST | `/api/tools/analyze-tone` | Analyze email tone |
| POST | `/api/tools/spam-score` | Check spam score |
| POST | `/api/tools/export-notion` | Export leads to Notion |
| GET | `/api/tools/api-keys` | List API keys |
| POST | `/api/tools/api-keys` | Create API key |
| DELETE | `/api/tools/api-keys` | Revoke API key |

### Settings
| Method | Path | Description |
|--------|------|-------------|
| PATCH | `/api/settings` | Update integrations + white-label settings |

### Public API (API Key Auth)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/leads` | List leads (paginated, auth via Bearer `lh_*`) |
| POST | `/api/v1/leads` | Create lead (auth via Bearer `lh_*`) |

---

## Background Jobs

All jobs are registered in `lib/server/queue.ts` → `runTask()` switch.

| Task Type | Handler | Trigger | Description |
|-----------|---------|---------|-------------|
| `search` | `runSearchJob()` | Manual | Search Google Places, find leads |
| `ping` | `pingLead()` | After search | Check website status |
| `crawl` | `crawlLead()` | After ping (if live) | Extract contact info from website |
| `verify_email` | `verifyLeadEmail()` | After crawl | Verify email (ZeroBounce / fallback) |
| `calculate_score` | `calculateLeadScore()` | After enrichment chain | Recalculate lead score |
| `ai_draft` | `generateCampaignDrafts()` | Manual | Generate AI drafts for campaign |
| `send` | `sendCampaign()` | Manual | Send campaign emails |
| `send_follow_up` | `sendFollowUpCampaign()` | After send (delayed) | Send follow-up email |
| `check_replies` | `checkAllCampaignReplies()` | Self-perpetuating (60s) | Check for email replies, AI classify, stop sequences, Slack notify |
| `enrich_lead` | `enrichLead()` | Manual | Hunter.io email finder |
| `check_domain_expiry` | `checkLeadDomainExpiry()` | Manual | WHOIS domain check |
| `analyze_reviews` | `analyzeLeadReviews()` | Manual | Google review sentiment analysis |
| `process_sequences` | `processSequences()` | Self-perpetuating (1h) | Send next step in email sequences |
| `weekly_summary` | `sendWeeklySummary()` | Self-perpetuating (7d) | Send weekly analytics digest |

### Job Queue Architecture
- **Table**: `JobQueue` in PostgreSQL
- **Locking**: Atomic `UPDATE ... WHERE id = (SELECT ... FOR UPDATE SKIP LOCKED)`
- **Retries**: Backoff 15s × attempt number, up to `maxAttempts` (default 3)
- **Worker**: `startQueueWorker()` runs a polling loop every 3 seconds
- **Seeded on start**: `check_replies` and `weekly_summary` if no pending jobs exist

---

## UI Components

### layout/
- **Sidebar.tsx**: Navigation with optional white-label `brandName`, `brandLogo`, `brandColor`

### leads/
- **LeadsTable.tsx**: Sortable table with enrich button, multi-select, bulk actions
- **LeadDetailDrawer.tsx**: Rich sidebar panel with all features: enrichment info, domain expiry, review insights, SMS compose, call scripts, deal value, tasks, sales proposal, pipeline stage selector
- **TaskPanel.tsx**: Create, complete, and delete lead-specific tasks with due dates
- **StatusBadge.tsx**: Color-coded website status badge
- **FilterBar.tsx**: Multi-filter control for lead list
- **ExportMenu.tsx**: CSV, Excel, Google Sheets, Notion export options

### pipeline/
- **KanbanColumn.tsx**: Droppable pipeline stage column with color header and count
- **KanbanCard.tsx**: Draggable lead card with name, category, website status, deal value badge

### campaigns/
- **SequenceBuilder.tsx**: Multi-step email sequence builder (up to 5 steps) with inline editing

### search/
- **SearchPanel.tsx**: Radius/city/polygon search configuration
- **MapView.tsx**: Google Maps integration for visual search

### ui/
- **Button.tsx**: Reusable button with loading state, variants, size options

---

## Deployment

### Build
```bash
bun run build
```

### Production Start
```bash
bun start  # or next start
```

### Database Migrations
After any schema change:
```bash
bunx prisma db push --accept-data-loss  # dev only
bunx prisma generate
```

### Key Considerations
- **Background worker**: Runs in-process with `startQueueWorker()` in `lib/db.ts`. For production, consider a separate worker process.
- **Queue state**: Not persisted across restarts for pending `check_replies` — auto-seeded.
- **Rate limits**: Enrichment respects plan limits (50/1000/10000/unlimited leads).
- **Gmail warmup**: Built-in warmup starts at 5/day, increments by 5/day until full daily limit.

---

## Troubleshooting

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| `Module not found: Can't resolve 'next-auth'` | Route imports `next-auth` instead of custom auth | Replace `getServerSession` with `getSession` from `@/lib/server/auth` |
| `Type error: params` | Next.js 16 requires `Promise<{ id: string }>` | Change `{ params }: { params: { id } }` → `{ params }: { params: Promise<{ id }> }` with `await params` |
| `Error: A unique constraint ... will be added` | Prisma schema change with data | Use `--accept-data-loss` flag |
| `Slack not sending` | Missing token or channel | Set `SLACK_BOT_TOKEN` + `SLACK_CHANNEL_ID` env vars, or configure per-user in Settings |
| `Heatmap not rendering` | Missing API key | Install `@react-google-maps/api`, set `NEXT_PUBLIC_GOOGLE_MAPS_KEY` |
| `Weekly summary not sending` | Missing Resend key | Set `RESEND_API_KEY` env var |
| `Sequence not progressing` | Job queue worker not running | Verify `startQueueWorker()` is called in `lib/db.ts` |

### Debugging Jobs
Jobs log to console. Check terminal output for:
- `Processing background job #N (taskType)...`
- `Completed background job #N`
- `Failed background job #N: <error>`
