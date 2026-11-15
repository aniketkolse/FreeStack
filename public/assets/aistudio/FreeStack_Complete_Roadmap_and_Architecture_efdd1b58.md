# FreeStack

## Complete Product, Architecture, Technology Stack & Delivery Roadmap

**Document type:** Project master blueprint\
**Version:** 1.0\
**Status:** Product direction and MVP architecture approved;
implementation in progress\
**Project repository:** https://github.com/aniketkolse/FreeStack\
**Primary development workflow:** OpenCode harness → local
implementation and verification → GitHub push

------------------------------------------------------------------------

# 1. Executive Summary

FreeStack is a public discovery platform for genuinely useful free
digital resources. It helps students, developers, software engineers,
AI/ML developers, founders, designers, open-source contributors and
technology enthusiasts discover tools and learning materials without
having to search across dozens of websites.

The platform brings together:

-   AI models, LLMs and inference APIs
-   Cloud credits, hosting and deployment services
-   Developer tools and software
-   Databases and backend platforms
-   Programming courses, documentation, books and tutorials
-   Student benefits and educational software
-   Public APIs, SDKs and integrations
-   Design and creative tools
-   Security and networking resources
-   Productivity and collaboration tools

FreeStack's differentiator is not simply listing free products. It
explains **what is actually free**, what the limits are, who is
eligible, whether a payment card is required, whether access expires,
which regions are supported and when the information was last verified.

The public website should be fast, accessible, searchable and usable
without mandatory registration.

## Product principle

> Make free digital resources easier to discover, compare and trust.

------------------------------------------------------------------------

# 2. Product Vision and Goals

## 2.1 Vision

Create a dependable, searchable directory of free and free-tier digital
resources, supported by structured data, official evidence and a
transparent verification process.

## 2.2 Primary goals

1.  Centralize useful free digital resources.
2.  Explain free-tier conditions instead of relying on vague "free"
    labels.
3.  Make discovery easy through search, categories and filters.
4.  Separate permanent free access, free tiers, credits, trials and
    student-only offers.
5.  Show when resource information was last checked.
6.  Preserve a traceable source for important claims.
7.  Make contributions and corrections manageable through GitHub
    workflows.
8.  Keep the public website independent of runtime AI API keys.

## 2.3 Non-goals for the initial MVP

The initial release will not include:

-   Mandatory user accounts or profiles
-   A paid subscription system
-   A complex recommendation engine
-   An AI chatbot as the primary interface
-   A full administrative dashboard
-   Real-time scraping during public website requests
-   A mobile application
-   Supabase or a separate application database without a demonstrated
    need
-   Redis, Kubernetes or premature microservices
-   Automated publication of critical pricing or eligibility changes
    without review

These can be reconsidered only when real usage and operational needs
justify them.

------------------------------------------------------------------------

# 3. Target Audience

FreeStack is intended for a broad technology audience:

  -----------------------------------------------------------------------
  Audience                            Main needs
  ----------------------------------- -----------------------------------
  Students                            Student packs, courses, cloud
                                      credits, educational software

  Beginner developers                 Tutorials, documentation, practice
                                      and roadmaps

  Software engineers                  Developer tools, APIs, hosting,
                                      databases and automation

  AI/ML developers                    Models, inference APIs, datasets,
                                      notebooks and frameworks

  Founders and builders               Free hosting, backend services,
                                      APIs and product tools

  Designers                           UI tools, graphics, icons, fonts
                                      and creative resources

  Open-source contributors            Open-source software, development
                                      tools and learning resources

  Technology enthusiasts              Discovering useful free products
                                      and services
  -----------------------------------------------------------------------

The public website should not assume that visitors are experts. Explain
restrictions in plain language.

------------------------------------------------------------------------

# 4. Resource Taxonomy

## 4.1 Main categories

The initial category registry contains the following categories. It can
expand when genuinely useful resources do not fit the existing taxonomy.

1.  **AI & ML**
    -   AI models and LLMs
    -   Inference APIs
    -   AI agents and frameworks
    -   Machine-learning frameworks
    -   Datasets and notebooks
2.  **Cloud & Hosting**
    -   Cloud credits
    -   VPS and hosting
    -   Serverless platforms
    -   Storage
    -   Deployment platforms
3.  **Developer Tools**
    -   IDEs and editors
    -   Git and code collaboration
    -   Debugging
    -   API testing
    -   CI/CD
    -   Monitoring and security tools
4.  **Databases & Backend**
    -   SQL and NoSQL databases
    -   Backend-as-a-Service
    -   Authentication
    -   Storage
    -   Caching
5.  **Learning & Study Materials**
    -   Programming courses
    -   Documentation and tutorials
    -   E-books and technical books
    -   Learning roadmaps
    -   Computer science fundamentals
    -   Practice problems and coding challenges
6.  **Student Benefits**
    -   Student developer packs
    -   Educational software
    -   Student cloud credits
    -   Certifications and learning benefits
    -   Student-only AI and developer tools
7.  **APIs & Integrations**
    -   Public APIs
    -   SDKs and webhooks
    -   Maps and location APIs
    -   Payment sandboxes
    -   Testing APIs
8.  **Design & Creative Tools**
    -   UI and graphic design
    -   Icons and illustrations
    -   Fonts
    -   Image and video tools
9.  **Security & Networking**
    -   Security testing tools
    -   Scanning utilities
    -   Network utilities
    -   Practice labs
10. **Productivity & Collaboration**
    -   Project management
    -   Notes and documents
    -   Communication
    -   Workflow automation

Categories and subcategories must be data-driven. Do not hardcode
category counts or claim popularity without supporting data.

## 4.2 Pricing and access classifications

Every resource must use an explicit classification:

-   `completely_free`
-   `free_tier`
-   `free_credits`
-   `student_exclusive`
-   `open_source`
-   `free_learning_material`
-   `free_trial`
-   `freemium`

Important distinctions:

-   A free trial is not a permanent free tier.
-   Free credits may expire or require a payment method.
-   Freemium products may have meaningful paid restrictions.
-   Open source does not automatically mean every hosted service is
    free.
-   Student discounts are not the same as free access.
-   Unknown information must remain unknown, not be guessed.

## 4.3 Resource types

The approved resource types are:

-   `software`
-   `ai_model`
-   `api`
-   `course`
-   `book`
-   `documentation`
-   `tutorial`
-   `roadmap`
-   `dataset`
-   `cloud_service`
-   `developer_tool`
-   `student_benefit`
-   `practice`
-   `other`

------------------------------------------------------------------------

# 5. User Experience and Website Routes

## 5.1 Public route map

  -----------------------------------------------------------------------
  Route                               Purpose
  ----------------------------------- -----------------------------------
  `/`                                 Homepage and discovery entry point

  `/explore`                          Main searchable resource directory

  `/categories`                       Category overview

  `/category/[slug]`                  Category-specific resource
                                      discovery

  `/offer/[slug]`                     Resource detail page

  `/learning`                         Learning materials and practice
                                      resources

  `/students`                         Student benefits and eligibility
                                      information

  `/search`                           Search results

  `/about`                            Platform purpose, verification and
                                      contribution information
  -----------------------------------------------------------------------

The existing repository may contain a legacy or transitional route
naming convention. Inspect the actual implementation before changing
route names. Avoid breaking existing links during migration.

## 5.2 Homepage

Primary headline:

**Find more. Spend less. Build anything.**

Supporting description:

Discover free tools, AI models, APIs, cloud credits, courses and
resources to help you learn, build and grow.

Sections, in order:

1.  Hero section
2.  Search experience
3.  Suggested search chips
4.  Popular categories
5.  Featured resources
6.  Discover by purpose
7.  Learning highlights
8.  Recently added resources
9.  Recently verified resources
10. Closing call to action
11. Global footer

Homepage requirements:

-   Use actual category and resource data.
-   Do not invent resource counts, reviews, ratings or popularity
    metrics.
-   Show useful empty states when data is not yet available.
-   Search must work.
-   Category cards must navigate to real routes.
-   Resource cards must not link to detail routes that do not exist.

## 5.3 Explore

Explore is the primary resource directory.

Desktop layout:

-   Search area at the top
-   Filter sidebar on the left
-   Results area on the right
-   Three resource cards per row when space allows

Tablet:

-   Two-column result grid
-   Compact filters

Mobile:

-   Single-column cards
-   Accessible bottom filter drawer
-   Apply and Reset actions

Filters:

-   Category
-   Access/pricing type
-   Card requirement
-   Student eligibility
-   Region
-   Verification status
-   Resource type

Sort options:

-   Relevance
-   Recently added
-   Recently verified

Search and filter state should be reflected in URL query parameters.
Example:

`/explore?category=ai-ml&pricing=free_tier&card=not_required&sort=recent`

Unknown must not be treated as "no".

## 5.4 Resource detail page

A resource detail page should make the actual free conditions easy to
understand.

Display:

-   Resource name and provider
-   Logo or fallback
-   Category and subcategory
-   Description
-   Pricing classification
-   Free limits and usage periods
-   Account requirements
-   Payment card requirement
-   Payment method requirements
-   Validity and expiry
-   Auto-renewal information
-   Student eligibility
-   Supported regions
-   Conditions and restrictions
-   Official website and signup/documentation links
-   Verification status
-   Last verified timestamp
-   Evidence and source references
-   Related resources

Desktop layout can use a 70/30 main/sidebar arrangement. Mobile should
stack content in a clear reading order.

## 5.5 Categories

`/categories` displays the category registry.

`/category/[slug]` displays:

-   Category heading and description
-   Subcategory navigation
-   Featured resources, if supported by data
-   Filters and sorting
-   Resource grid
-   Related categories

## 5.6 Learning

Learning is a focused discovery experience for:

-   Programming languages
-   Computer science fundamentals
-   Data structures and algorithms
-   Web and app development
-   AI and machine learning
-   Mathematics
-   Software engineering
-   Interview preparation

Learning filters:

-   Format
-   Difficulty
-   Topic
-   Language
-   Pricing classification
-   Verification status

Learning formats:

-   Course
-   Book
-   Documentation
-   Tutorial
-   Roadmap
-   Video
-   Practice
-   Challenge
-   Other

Learning cards should not display irrelevant commercial product fields.

## 5.7 Students

The Students page should explain:

-   Developer packs
-   Cloud credits
-   Educational software
-   Certifications
-   Student AI and developer tools
-   Eligibility requirements
-   Verification date
-   Duration and credit amount
-   Supported regions
-   Expiry and renewal

Clearly distinguish a free benefit from a discount.

## 5.8 About

Explain:

-   What FreeStack is
-   How resources are discovered
-   How verification works
-   How to report outdated information
-   How to contribute
-   Why official terms and availability can change

------------------------------------------------------------------------

# 6. Visual Design System

## 6.1 Design source files

The supplied design references are:

-   `toca-boca-design-tokens-full.json`
-   `toca-boca-css-variables-full.css`
-   `toca-boca-tailwind-v4-full.css`
-   `toca-boca-design-md-full.md`

The current implementation selected the Tailwind v4 `@theme` stylesheet
as the base and centralized tokens in:

`apps/web/src/app/tokens.css`

The design Markdown provides rationale and visual guidance. The other
files remain references rather than competing sources of truth.

## 6.2 Brand palette

  Token             Color
  ----------------- -----------
  Midnight Mouth    `#101014`
  Paper             `#FFFFFF`
  Sky Blue          `#59ACFF`
  Grass Green       `#62D962`
  Daylight          `#F2F2FF`
  Bubblegum Pink    `#FF8CBC`
  Tangerine         `#FF7040`
  Sunshine Yellow   `#FFE359`
  Ink               `#0A0A0A`

Use the brand colors in a controlled manner. Ensure text contrast and
readable surfaces.

## 6.3 Typography

-   Headings: Wallop-style heavy geometric typography.
-   Heading fallback: Outfit.
-   Body: Inter.
-   System fallback: Arial and sans-serif.

Use a coherent type scale for:

-   Display
-   H1--H6
-   Body large
-   Body regular
-   Body small
-   Caption
-   Label
-   Button
-   Metadata

## 6.4 Layout and responsive behavior

-   Maximum content width: 1440px.
-   Desktop page padding: 32--40px.
-   Tablet page padding: 24px.
-   Mobile page padding: 16px.
-   Large card radius: 24--32px.
-   Mobile card radius: approximately 20px.
-   Pill buttons where appropriate.
-   Generous whitespace and clear section hierarchy.

Responsive breakpoints:

-   Mobile: below 768px
-   Tablet: 768--1279px
-   Desktop: 1280px and above

Test at 320, 375, 768, 1024, 1280, 1440 and 1920 pixels.

## 6.5 Visual principles

-   Flat, expressive color surfaces
-   Distinctive typography
-   Playful but professional visual language
-   Minimal borders and shadows
-   Clear status labels
-   Consistent card geometry
-   No generic gradients or excessive glassmorphism
-   Motion around 200ms for small interactions and 400--600ms for larger
    transitions
-   Respect `prefers-reduced-motion`

Do not copy Toca Boca-specific audience selection, children's imagery,
logos or irrelevant page sections.

------------------------------------------------------------------------

# 7. Technology Stack

The stack below distinguishes the current frontend foundation from
planned systems.

## 7.1 Current frontend foundation

  -----------------------------------------------------------------------
  Area                    Technology              Status
  ----------------------- ----------------------- -----------------------
  Framework               Next.js App Router      Implemented

  UI                      React                   Implemented

  Language                TypeScript              Implemented

  Styling                 Tailwind CSS v4         Implemented

  Workspace               pnpm                    Implemented

  Unit/component testing  Vitest                  Implemented

  Validation              ESLint and TypeScript   Implemented

  Design tokens           CSS custom properties   Implemented
                          and Tailwind v4 theme   

  Icons                   Lucide-compatible icon  Use consistently
                          system                  

  Fonts                   Outfit and Inter        Implemented
                          through `next/font`     
  -----------------------------------------------------------------------

The reported repository baseline is Next.js 15 with Tailwind CSS v4.
Inspect `package.json` and lockfile before changing versions.

## 7.2 Planned data and validation stack

  -----------------------------------------------------------------------
  Area                    Technology              Purpose
  ----------------------- ----------------------- -----------------------
  Published resource data JSON files in Git       Source of truth

  Resource contract       JSON Schema Draft       Machine-readable
                          2020-12                 contract

  Python models           Pydantic v2             Runtime validation

  Schema validation       `jsonschema` with       URL/date and structure
                          format validation       checks

  Tests                   pytest                  Pipeline and validation
                                                  tests
  -----------------------------------------------------------------------

## 7.3 Planned discovery and verification stack

  -----------------------------------------------------------------------
  Area                    Technology              Purpose
  ----------------------- ----------------------- -----------------------
  Discovery               Scrapy                  Find candidate
                                                  resources

  Primary fetch           Crawl4AI                Retrieve and process
                                                  accessible pages

  Fallback fetch          Scrapling               Secondary retrieval
                                                  path

  Primary AI extraction   Gemini                  Extract structured
                                                  candidate facts

  Selective secondary     Groq                    Interpret or
  check                                           cross-check ambiguous
                                                  extraction

  Automation              GitHub Actions          Scheduled and PR-driven
                                                  workflows

  Review/publishing       GitHub Pull Requests    Human approval and
                                                  publication
  -----------------------------------------------------------------------

These are planned components. Do not assume they are installed or
production-ready until implemented and tested.

## 7.4 Planned deployment

  Area              Technology           Purpose
  ----------------- -------------------- -------------------------------
  Website hosting   Cloudflare Pages     Public frontend
  Redirect layer    Cloudflare Workers   Controlled outbound redirects
  CI/CD             GitHub Actions       Validation and deployment
  Version control   GitHub               Source, review and history

No public website request should require a Gemini or Groq API key.

## 7.5 Deferred technologies

Do not introduce the following into the MVP without a documented reason:

-   Supabase
-   Redis
-   Kubernetes
-   Separate microservices
-   Mandatory authentication
-   Complex vector search
-   A large analytics stack
-   Runtime AI dependencies for ordinary website browsing

A search index or database can be introduced later if actual scale or
performance measurements justify it.

------------------------------------------------------------------------

# 8. Repository Structure Blueprint

The repository should evolve toward the following logical structure.
This is a target blueprint, not a claim that every directory currently
exists.

``` text
FreeStack/
│
├── apps/
│   └── web/
│       ├── public/
│       │   ├── images/
│       │   ├── icons/
│       │   └── fonts/
│       │
│       ├── src/
│       │   ├── app/
│       │   │   ├── page.tsx
│       │   │   ├── layout.tsx
│       │   │   ├── globals.css
│       │   │   ├── tokens.css
│       │   │   ├── explore/
│       │   │   ├── categories/
│       │   │   ├── category/
│       │   │   │   └── [slug]/
│       │   │   ├── offer/
│       │   │   │   └── [slug]/
│       │   │   ├── learning/
│       │   │   ├── students/
│       │   │   ├── search/
│       │   │   ├── about/
│       │   │   └── design-system/
│       │   │
│       │   ├── components/
│       │   │   ├── ui/
│       │   │   ├── layout/
│       │   │   ├── home/
│       │   │   ├── explore/
│       │   │   ├── resource/
│       │   │   ├── category/
│       │   │   ├── search/
│       │   │   └── learning/
│       │   │
│       │   ├── hooks/
│       │   ├── lib/
│       │   │   ├── data/
│       │   │   ├── search/
│       │   │   ├── filters/
│       │   │   ├── validation/
│       │   │   └── utils.ts
│       │   │
│       │   ├── types/
│       │   └── tests/
│       │
│       ├── package.json
│       ├── vitest.config.ts
│       └── tsconfig.json
│
├── data/
│   ├── categories.json
│   ├── sources/
│   │   └── registry.json
│   └── offers/
│       ├── ai/
│       ├── cloud/
│       ├── developer-tools/
│       ├── databases/
│       ├── learning/
│       ├── students/
│       ├── apis/
│       ├── design/
│       ├── security/
│       └── productivity/
│
├── schema/
│   ├── offer.schema.json
│   ├── category.schema.json
│   └── source.schema.json
│
├── pipeline/
│   ├── src/
│   │   └── freestack/
│   │       ├── discover/
│   │       ├── fetch/
│   │       ├── normalize/
│   │       ├── extract/
│   │       ├── verify/
│   │       ├── review/
│   │       ├── publish/
│   │       ├── models/
│   │       ├── validation/
│   │       └── common/
│   │
│   ├── prompts/
│   ├── tests/
│   └── pyproject.toml
│
├── worker/
│   ├── src/
│   ├── tests/
│   └── wrangler.toml
│
├── scripts/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATA-CONTRACT.md
│   ├── ROADMAP.md
│   ├── CONTRIBUTING.md
│   └── VERIFICATION-POLICY.md
│
├── .github/
│   └── workflows/
│       ├── web-ci.yml
│       ├── validate-data.yml
│       ├── test-pipeline.yml
│       ├── discover-resources.yml
│       ├── verify-resources.yml
│       ├── link-health.yml
│       └── deploy-web.yml
│
├── .env.example
├── .gitignore
├── CONTRIBUTING.md
├── LICENSE
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── README.md
```

## 8.1 Repository organization rules

-   Keep frontend code in `apps/web`.
-   Keep published resource records in `data`.
-   Keep machine-readable contracts in `schema`.
-   Keep discovery and verification code in `pipeline`.
-   Keep redirect behavior isolated in `worker`.
-   Keep project decisions and operational policies in `docs`.
-   Keep automation definitions in `.github/workflows`.
-   Avoid duplicating the same resource data in frontend source files.
-   Avoid placing secrets in the repository.

------------------------------------------------------------------------

# 9. Data Architecture

## 9.1 Source of truth

**Git-managed JSON is the source of truth for published resource
records.**

Use one JSON file per resource. Git history provides a record of changes
and makes review straightforward.

Pipeline state, temporary crawl data and page snapshots must remain
separate from published resource content.

## 9.2 Resource record shape

The approved conceptual resource structure is:

``` text
Resource
├── schema_version
├── identity
│   ├── id
│   ├── name
│   ├── slug
│   ├── provider
│   └── logo_url?
│
├── classification
│   ├── category
│   ├── subcategory
│   ├── resource_type
│   ├── pricing_model
│   └── tags
│
├── description
│
├── access
│   ├── free_limits
│   ├── requirements
│   ├── validity
│   └── restrictions
│
├── eligibility
│   ├── student_access
│   ├── regions
│   └── conditions
│
├── links
│   ├── official
│   ├── signup?
│   └── documentation?
│
├── learning?
│   ├── format
│   ├── difficulty
│   ├── topics
│   └── language?
│
├── evidence
│   ├── sources
│   └── claims
│
├── verification
│   ├── status
│   ├── last_verified_at
│   └── notes
│
└── metadata
    ├── created_at
    ├── updated_at
    └── contributor?
```

The exact field types and required/nullability rules must remain
consistent between JSON Schema and Pydantic.

## 9.3 Important enums

Pricing:

``` text
completely_free
free_tier
free_credits
student_exclusive
open_source
free_learning_material
free_trial
freemium
```

Verification:

``` text
verified
needs_review
expired
unavailable
unverified
```

Requirement:

``` text
required
not_required
unknown
```

Validity:

``` text
ongoing
fixed_period
credit_based
trial_period
unknown
```

Student access:

``` text
eligible
exclusive
not_eligible
unknown
```

Difficulty:

``` text
beginner
intermediate
advanced
all_levels
unknown
```

Learning format:

``` text
course
book
documentation
tutorial
roadmap
video
practice
challenge
other
```

Evidence confidence:

``` text
high
medium
low
```

## 9.4 Data quality rules

-   Unknown information is represented explicitly.
-   Missing data must never be silently interpreted as a negative.
-   URLs should be validated as HTTPS where required.
-   Dates should use a consistent machine-readable format.
-   IDs and slugs must be unique.
-   Category and subcategory values must exist in the registry.
-   Evidence claims must reference existing evidence source IDs.
-   Metadata update time must not precede creation time.
-   Free-trial records must use trial validity.
-   Student-exclusive records must use the matching student-access
    value.
-   Learning resource types must have the required learning metadata.
-   A verified record must meet the evidence and verification rules.
-   An expired status requires supporting evidence.
-   Global uniqueness must be checked across all resource files.

## 9.5 Schema and model parity

The JSON Schema Draft 2020-12 contract and Pydantic v2 models must
enforce the same required fields, nullability and cross-field
constraints.

Known parity requirements to audit in the existing implementation:

-   `classification.tags` is required.
-   `access.free_limits` and `access.restrictions` are required.
-   `validity.auto_renewal` is required.
-   `eligibility.student_access`, `regions` and `conditions` are
    required.
-   `evidence.claims` is required, even if empty.
-   `verification.notes` is required but may be null.
-   `identity.logo_url`, when present, must be HTTPS.
-   Evidence source URLs must be validated.
-   Optional `learning` must validate all required fields when present.
-   Do not use Pydantic defaults to make JSON Schema-required fields
    optional.
-   JSON Schema and Pydantic must both use `student_access`, not an
    earlier boolean field.
-   Cross-record uniqueness and category-registry validation must be
    tested.

These are audit requirements, not claims that every one is already
implemented.

------------------------------------------------------------------------

# 10. Verification and Trust Architecture

FreeStack must not label a resource verified merely because an AI model
extracted information from a webpage.

## 10.1 Verification states

  Status         Meaning
  -------------- -------------------------------------------------------
  Verified       Important claims checked against acceptable evidence
  Needs review   Information is ambiguous, incomplete or changed
  Expired        A time-limited offer has ended, supported by evidence
  Unavailable    Resource or offer is confirmed unavailable
  Unverified     Not yet checked to the required standard

## 10.2 Evidence requirements

Prefer official sources:

-   Official pricing pages
-   Official documentation
-   Official terms and conditions
-   Official student eligibility pages
-   Official announcements

For important claims, preserve:

-   Source ID
-   URL
-   Source type
-   Checked timestamp
-   Relevant claim field path
-   Short supporting quote or captured evidence
-   Confidence
-   Notes

A URL alone is not sufficient evidence that a claim is correct. Quotes
or captured page content should be traceable to the fetched source.

## 10.3 Human review policy

Human review is required for critical changes, including:

-   Pricing classification changes
-   Free limit reductions
-   Payment card requirement changes
-   Eligibility changes
-   Region availability changes
-   Expiry and renewal changes
-   Claims that a resource has become unavailable

Low-risk metadata updates may be automated under a documented policy.

## 10.4 Fetch failure behavior

-   A failed fetch must not delete a published record.
-   A timeout does not prove that an offer expired.
-   Retry with bounded backoff.
-   Preserve the last verified data.
-   Mark stale or needing review when appropriate.
-   Record meaningful changes in free-tier limits.
-   Avoid aggressive or repeated requests.

------------------------------------------------------------------------

# 11. Discovery and Verification Pipeline

The pipeline is planned as a staged system. Do not build it before the
public website and data contract are stable.

## 11.1 High-level flow

``` text
Candidate discovery
       |
       v
Candidate normalization
       |
       v
URL and source policy checks
       |
       v
Page fetching
       |
       +---- Primary: Crawl4AI
       |
       +---- Fallback: Scrapling
       |
       v
Content extraction
       |
       v
Structured AI extraction
       |
       +---- Gemini primary extraction
       |
       +---- Groq selective cross-check
       |
       v
Schema validation
       |
       v
Evidence and confidence checks
       |
       v
Change detection
       |
       v
Review classification
       |
       +---- Low-risk eligible changes
       |
       +---- Human review required
       |
       v
GitHub Pull Request
       |
       v
CI validation and approval
       |
       v
Published JSON data
       |
       v
Website build and deployment
```

## 11.2 Pipeline stages

### A. Discovery

Use Scrapy to identify candidate resources from permitted sources.

Respect:

-   Robots rules
-   Website terms
-   Rate limits
-   Access restrictions
-   Crawl budgets

Do not bypass access controls.

### B. Fetching

-   Crawl4AI is the planned primary fetcher.
-   Scrapling is the planned fallback.
-   Store fetched snapshots and pipeline state outside published
    content.
-   Use bounded retries and timeouts.

### C. Normalization

Normalize:

-   Names
-   Providers
-   URLs
-   Categories
-   Tags
-   Pricing language
-   Eligibility descriptions
-   Limits and periods

Deduplicate candidates using stable identifiers and canonical URLs.

### D. AI extraction

Use Gemini to extract structured candidate information.

Use Groq selectively for ambiguous interpretation or secondary checking.

AI output is untrusted candidate data. It must pass schema, evidence and
review checks.

### E. Verification

Compare extracted claims with acceptable official evidence.

Track:

-   New claims
-   Changed claims
-   Removed claims
-   Evidence freshness
-   Confidence
-   Review severity

### F. Review and publishing

Generate a GitHub Pull Request containing proposed changes.

The PR should show:

-   Resource record changes
-   Evidence changes
-   Verification status changes
-   Summary of detected differences
-   Reasons human review is or is not required

Critical changes must not be auto-published.

------------------------------------------------------------------------

# 12. Search and Discovery Architecture

## 12.1 Initial search

Start with reliable local text search over published JSON data.

Search fields:

-   Resource name
-   Provider
-   Category
-   Subcategory
-   Tags
-   Description
-   Features
-   Pricing classification

Natural-language examples:

-   `free LLM API for Python`
-   `free PostgreSQL hosting`
-   `free React learning resources`
-   `student cloud credits`

Initial search should use text matching, filters and a transparent
relevance ranking.

## 12.2 Later search improvements

Consider, only when justified:

-   Typo tolerance
-   Synonym expansion
-   Better relevance scoring
-   Semantic search
-   Search analytics
-   Dedicated search indexing

Do not make semantic AI search a requirement for the first public
release.

## 12.3 URL-driven filters

Search and filters should be shareable and bookmarkable.

Changing a filter should update query parameters. Loading a URL with
query parameters should restore the selected filters.

------------------------------------------------------------------------

# 13. Security, Privacy and Operational Rules

## 13.1 Secrets

-   Never commit `.env` files.
-   Keep `.env.example` limited to placeholder values.
-   Use GitHub Actions secrets for CI credentials.
-   Do not expose private API keys to browser bundles.
-   The public website must not require AI credentials at runtime.

## 13.2 Outbound links and redirects

-   Allowlist approved HTTPS destinations.
-   Avoid open redirects.
-   Validate redirect targets.
-   Do not trust arbitrary user-provided destinations.
-   Preserve clear official destination information.

## 13.3 Crawling

-   Respect robots rules and terms.
-   Respect rate limits.
-   Do not bypass login, paywalls or technical access controls.
-   Keep fetch retries bounded.
-   Avoid treating inaccessible pages as proof of expiry.

## 13.4 Public content

-   Prefer official evidence.
-   Keep claims concise and factual.
-   Make verification timestamps visible.
-   Explain uncertainty.
-   Provide a way to report outdated information.

------------------------------------------------------------------------

# 14. Testing and Quality Strategy

## 14.1 Frontend

Current reported tooling includes:

-   TypeScript
-   ESLint
-   Vitest
-   React component tests
-   Next.js production build

Add as the project grows:

-   React Testing Library coverage where useful
-   Playwright end-to-end tests
-   Automated accessibility checks
-   Visual regression tests when the UI stabilizes

## 14.2 Data and pipeline

Use:

-   JSON Schema validation
-   Pydantic validation
-   pytest
-   Cross-record uniqueness tests
-   Category registry checks
-   Evidence-reference checks
-   Cross-field business-rule tests
-   URL and date format checks
-   Pipeline retry and failure tests
-   Change-detection tests

## 14.3 Release checks

A release must verify:

-   Homepage and primary routes work.
-   Search and filters work.
-   Resource details accurately display limits and eligibility.
-   Official links work.
-   Verification status is visible.
-   Mobile and desktop layouts work.
-   No horizontal overflow.
-   Keyboard navigation works.
-   Schema validation passes.
-   Tests pass.
-   Production build passes.
-   No secrets are committed.

------------------------------------------------------------------------

# 15. CI/CD and GitHub Workflow

Planned workflows:

  Workflow                   Responsibility
  -------------------------- --------------------------------------------
  `web-ci.yml`               Frontend lint, typecheck, tests and build
  `validate-data.yml`        Validate resource JSON and schemas
  `test-pipeline.yml`        Python tests and static checks
  `discover-resources.yml`   Scheduled candidate discovery
  `verify-resources.yml`     Scheduled verification checks
  `link-health.yml`          Check approved links with safe rate limits
  `deploy-web.yml`           Deploy validated website builds

The actual repository already contains some CI workflows. Audit and
extend them instead of creating duplicates.

## Git workflow

-   Work on the existing project branch unless a feature branch is
    appropriate.
-   Review `git status` before editing.
-   Do not overwrite unrelated changes.
-   Run the relevant checks before committing.
-   Never force-push.
-   Never commit secrets.
-   Use descriptive commit messages.
-   Push through the user's OpenCode workflow.

------------------------------------------------------------------------

# 16. Implementation Roadmap: Start to End

Build incrementally. Complete and verify each milestone before beginning
the next.

## Milestone 0 --- Product definition and architecture

**Status: Approved**

Deliverables:

-   Product vision and audience
-   Resource taxonomy
-   Pricing classifications
-   Public route map
-   MVP boundaries
-   Data and verification principles
-   Technology direction
-   Architecture decisions

Acceptance:

-   Product scope is clear.
-   MVP and deferred scope are separated.
-   No unnecessary infrastructure is introduced.

## Milestone 1 --- Repository and technical foundation

**Status: Initial implementation exists; runtime verification should be
maintained**

Foundation includes:

-   Next.js App Router
-   React and TypeScript
-   Tailwind CSS v4
-   pnpm workspace
-   Initial routes
-   JSON Schema files
-   Python/Pydantic validation foundation
-   Category registry
-   GitHub CI foundations

Important follow-up:

-   Continue auditing the current repository rather than assuming every
    initial file is correct.
-   Keep lockfile and CI behavior consistent.

## Milestone 2 --- Design system and shared UI foundation

**Status: Reported complete and pushed**

Latest reported commits:

-   `99ffc96` ---
    `feat(ui): establish FreeStack design system and shared components`
-   `314d605` ---
    `chore(ui): serve design-system showcase in development only`

Reported implementation:

-   Centralized tokens in `apps/web/src/app/tokens.css`
-   Global styles and typography
-   Shared UI primitives
-   Header and footer
-   Page container and navigation
-   Resource and category card foundations
-   Development-only design system showcase
-   Component tests
-   Lockfile

Reported verification:

-   TypeScript: passed
-   ESLint: passed
-   Vitest: 30/30 tests passed across 8 files
-   Production build: passed
-   Production showcase protection: inspected
-   GitHub branch synchronized

These results are based on the implementation report supplied by the
project owner.

## Milestone 3 --- Production homepage

**Status: Next planned milestone**

Build:

-   Hero
-   Functional search
-   Suggested search chips
-   Popular categories
-   Featured resources
-   Discover by purpose
-   Learning highlights
-   Recently added
-   Recently verified
-   Closing CTA

Acceptance:

-   Existing design system reused.
-   Real JSON data used.
-   No fabricated resource information.
-   Search and category navigation work.
-   Empty states are honest.
-   Responsive layouts pass.
-   Tests and production build pass.

## Milestone 4 --- Resource cards and detail pages

Build:

-   Final ResourceCard variants
-   Resource logo and fallback behavior
-   Pricing and verification indicators
-   Resource detail route
-   Free limit presentation
-   Eligibility and payment requirements
-   Expiry and renewal presentation
-   Evidence list
-   Official destination links
-   Related resources

Acceptance:

-   Detail pages load by valid slug.
-   Unknown values are explicit.
-   Critical free-access conditions are easy to understand.
-   Broken and unsafe links are handled.
-   Resource cards navigate only to valid detail routes.

## Milestone 5 --- Explore, search and filters

Build:

-   Explore layout
-   Search field and suggestions
-   Desktop filter sidebar
-   Mobile filter drawer
-   Active filter chips
-   Sorting
-   Pagination or appropriate incremental loading
-   URL-driven state
-   Empty and loading states

Acceptance:

-   Filters combine correctly.
-   Query parameters restore state.
-   Search matches the expected fields.
-   Unknown values are handled correctly.
-   Mobile filtering is accessible.
-   Search tests cover meaningful cases.

## Milestone 6 --- Categories and learning

Build:

-   Categories overview
-   Category detail pages
-   Subcategory navigation
-   Category-specific resource lists
-   Learning landing page
-   Learning filters
-   Learning card variants
-   Topic and format navigation

Acceptance:

-   Category registry drives the UI.
-   Invalid category slugs produce a proper not-found state.
-   Learning metadata is validated.
-   No fabricated course or provider information.

## Milestone 7 --- Student benefits

Build:

-   Student benefits landing page
-   Eligibility guide
-   Student-exclusive resources
-   Student cloud credits
-   Educational software
-   Certification and learning benefits
-   Duration, expiry and region information

Acceptance:

-   Student access is explicit.
-   Discounts and free benefits are distinguished.
-   Eligibility evidence is visible.
-   Unknown eligibility is not guessed.

## Milestone 8 --- Production data quality and initial resource catalog

Build:

-   Schema/Pydantic parity audit
-   Cross-record validation
-   Category registry validation
-   Evidence-reference validation
-   Initial manually verified resource catalog
-   Data quality reports
-   Duplicate detection
-   Resource metadata conventions

Acceptance:

-   All published records pass validation.
-   Important claims have traceable evidence.
-   IDs and slugs are globally unique.
-   No resource is marked verified without meeting policy.

## Milestone 9 --- Discovery and verification pipeline

Build:

-   Scrapy discovery
-   Crawl4AI primary fetch
-   Scrapling fallback
-   Normalization and deduplication
-   Gemini structured extraction
-   Selective Groq cross-check
-   Evidence extraction and claim mapping
-   Change detection
-   Review classification
-   GitHub PR generation

Acceptance:

-   Pipeline failures do not delete published data.
-   Critical changes require review.
-   AI output is validated and treated as untrusted.
-   Fetch behavior respects source policies.
-   Pipeline tests cover failure and retry paths.

## Milestone 10 --- Accessibility, SEO, performance and security

Build and audit:

-   Semantic HTML
-   Keyboard navigation
-   Focus management
-   Color contrast
-   Reduced motion
-   Automated accessibility checks
-   Metadata and canonical URLs
-   Sitemap and robots rules
-   Open Graph metadata
-   Image optimization
-   Font loading strategy
-   Performance measurements
-   Outbound link safety
-   Security headers and dependency checks where appropriate

Acceptance:

-   Core journeys work with keyboard navigation.
-   Metadata is correct for important routes.
-   No critical accessibility issues remain.
-   Performance is measured rather than guessed.
-   Secrets and unsafe redirects are absent.

## Milestone 11 --- Deployment and public beta

Build:

-   Cloudflare Pages deployment
-   GitHub Actions deployment workflow
-   Environment configuration
-   Domain and HTTPS configuration
-   Redirect worker only if needed
-   Production smoke tests
-   Error monitoring approach
-   Rollback procedure
-   Public contribution instructions

Acceptance:

-   Production build deploys reliably.
-   Public routes work.
-   Search and filters work in production.
-   No runtime AI key is required.
-   Resource links and verification information are correct.
-   Rollback steps are documented.

## Milestone 12 --- Post-launch improvements

Prioritize based on real usage and user feedback:

-   Better relevance ranking
-   Typo tolerance and synonyms
-   More resource categories
-   Contributor experience
-   Resource correction/reporting workflow
-   Freshness dashboards
-   Search analytics with privacy-conscious design
-   More efficient verification scheduling
-   Semantic search if justified
-   Database or search index if justified by scale

Do not add features simply because they are technically interesting. Use
evidence of user need.

------------------------------------------------------------------------

# 17. Definition of Done for Every Milestone

A milestone is not complete because code was generated.

Every milestone must include:

1.  Repository inspection before changes.
2.  A clear implementation plan.
3.  Reuse of existing architecture.
4.  Type-safe implementation.
5.  Tests for new behavior.
6.  Existing tests still passing.
7.  Lint and type checks.
8.  Production build when applicable.
9.  Responsive verification for UI work.
10. Accessibility review for interactive UI.
11. Diff review.
12. Secret and environment-file review.
13. Descriptive commit.
14. Normal GitHub push.
15. A completion report with actual command outputs.

Never claim a check passed unless it was executed.

------------------------------------------------------------------------

# 18. Development Workflow and Responsibilities

The project uses an OpenCode-first implementation workflow.

## ChatGPT responsibilities

-   Maintain the overall roadmap.
-   Explain architecture decisions.
-   Prepare detailed milestone prompts.
-   Review implementation reports.
-   Identify gaps and regressions.
-   Prepare testing and acceptance criteria.
-   Recommend the next milestone.

## OpenCode responsibilities

-   Inspect the local repository.
-   Implement the requested milestone.
-   Run commands and tests.
-   Inspect the actual UI in a browser when required.
-   Fix failures.
-   Review the Git diff.
-   Commit and push changes through the configured Git workflow.
-   Report actual results.

## Project owner responsibilities

-   Run and supervise the OpenCode harness.
-   Review important changes and approvals.
-   Provide implementation reports and screenshots.
-   Approve sensitive changes.
-   Manage GitHub access and secrets.

## Standard milestone loop

``` text
ChatGPT prepares milestone plan and prompt
                  |
                  v
User runs prompt through OpenCode
                  |
                  v
OpenCode inspects repository
                  |
                  v
OpenCode implements milestone
                  |
                  v
OpenCode runs tests and visual checks
                  |
                  v
OpenCode fixes discovered issues
                  |
                  v
OpenCode reviews, commits and pushes
                  |
                  v
User shares results with ChatGPT
                  |
                  v
ChatGPT reviews and prepares next milestone
```

Do not skip verification or start multiple dependent milestones before
the current one is accepted.

------------------------------------------------------------------------

# 19. Current Project State Snapshot

This snapshot reflects the latest implementation report supplied for
this project. It is not a live repository inspection.

## Confirmed by the supplied report

-   Repository: `aniketkolse/FreeStack`
-   Main branch
-   Latest reported commit: `314d6058b319892e820e00dca52aa92fd7f8029e`
-   Next.js 15 and Tailwind CSS v4 foundation
-   pnpm lockfile introduced
-   Shared design system implemented
-   Resource and category component foundations implemented
-   Development-only design system showcase implemented
-   Reported TypeScript, ESLint, Vitest and production build checks
    passed
-   Reported Git status clean and synchronized with origin

## Known follow-ups

-   Roadmap numbering in repository documentation may be stale.
-   Resource detail routes are not yet implemented.
-   Resource logos currently use `<img>`; revisit image optimization
    when real provider logos are added.
-   Homepage still has legacy markup and is the next planned
    implementation.
-   Tooltip behavior is intentionally minimal.
-   Fonts are fetched through Google at build time.
-   Automated accessibility and visual regression testing are not yet
    established.
-   Existing CI should be checked against the newly introduced lockfile.
-   The data schema and Pydantic implementation still require a detailed
    parity and cross-field validation audit.

## Immediate next step

**Milestone 3: Build the production FreeStack homepage.**

Do not restart the design system milestone. Reuse the components already
implemented.

------------------------------------------------------------------------

# 20. Architecture Decision Summary

  Decision                    Approved direction
  --------------------------- ----------------------------------------
  Product name                FreeStack
  Public access               No mandatory login
  Published data source       Git-managed JSON
  Resource storage            One JSON file per resource
  Data contract               JSON Schema Draft 2020-12
  Python validation           Pydantic v2
  Frontend                    Next.js App Router, React, TypeScript
  Styling                     Tailwind CSS v4 and centralized tokens
  Search MVP                  Text, tags, category and provider
  Discovery                   Scrapy
  Primary fetch               Crawl4AI
  Fallback fetch              Scrapling
  Primary extraction          Gemini
  Selective secondary check   Groq
  Review and publishing       GitHub Pull Requests
  Automation                  GitHub Actions
  Hosting direction           Cloudflare Pages
  Redirect direction          Cloudflare Workers, if needed
  Critical verification       Human approval
  Runtime AI dependency       None for public browsing
  Implementation workflow     OpenCode harness
  Development strategy        Incremental, tested milestones

------------------------------------------------------------------------

# 21. Final Product Standard

FreeStack should become more than a list of links.

Every resource should help a visitor answer:

1.  What is this resource?
2.  What can I use it for?
3.  What part is actually free?
4.  What are the limits?
5.  Do I need a payment card?
6.  Who is eligible?
7.  Which regions are supported?
8.  Does access expire?
9.  Where is the official source?
10. When was the information last verified?

The platform should be visually distinctive, technically maintainable,
transparent about uncertainty and careful with claims.

**Build a trustworthy resource directory first. Add automation and
advanced discovery only after the core experience and data quality are
reliable.**
