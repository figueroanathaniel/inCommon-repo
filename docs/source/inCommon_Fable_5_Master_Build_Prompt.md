# inCommon — Fable 5 Master Build Prompt

**Artifact:** Founding build prompt and editable product specification  
**Product name:** `inCommon`  
**Initial platform:** Mobile-responsive web application / Progressive Web App (PWA), architected for later native iOS and Android releases  
**Initial access model:** Entirely free; no subscription, purchase, locked interpretation, or paywall at launch  
**Founder requirement:** Founder-controlled project, infrastructure, data, content, administration, deployment, and continued real-time development access

---

## PROMPT TO GIVE FABLE 5

You are Fable 5 acting as a senior product strategist, spiritual-platform architect, UX designer, full-stack engineer, data/privacy engineer, calculation-systems integrator, content-systems designer, and quality-assurance lead.

Design and build a production-ready mobile app titled **inCommon**.

Do not treat this as a one-off mockup or a static prototype. Build an extensible, founder-owned product that can launch as a mobile-responsive web application/PWA and later become native iOS and Android apps without rebuilding the underlying product from scratch. The founder must retain real-time access after launch to edit content, change prompts, add or disable systems, inspect data, manage releases, and continue development.

Before making any irreversible architecture, licensing, calculation, hosting, or data-ownership decision, surface the decision, your recommendation, alternatives, cost implications, and migration consequences. Use editable configuration instead of hard-coding whenever practical.

### 1. Product vision

inCommon is a unified self-discovery and spiritual operating system. It combines multiple systems people use to understand themselves, their relationships, their timing, and their growth. It must function simultaneously as:

1. A personal operating system that turns many frameworks into practical guidance.
2. A comprehensive spiritual and psychological reference library.
3. A daily forecasting, reflection, and progress-tracking companion.
4. A relationship and compatibility platform.

The product should draw broad product inspiration—but never copied design, text, branding, proprietary logic, or trade dress—from the personalized charting, timing, compatibility, and conversational qualities associated with products such as Co–Star, The Pattern, Astra, and leading Human Design tools.

Its essential difference is this:

> Most apps ask the user to enter the same information repeatedly and then trap each interpretation inside a separate system. inCommon calculates what it responsibly can from one profile, preserves each system’s integrity, and then helps the user see what the systems have in common, where they disagree, and whether the insight proves useful over time.

Do not flatten every tradition into a single claim. The value of inCommon is not that every system always agrees. The value is that the app makes agreement, tension, repetition, difference, uncertainty, and lived results visible.

### 2. Brand voice and product character

The interpretive voice must be, in descending order:

1. Conversational
2. Psychological
3. Slightly academic
4. Mystical

Write clearly enough for a curious beginner while allowing experienced users to reveal deeper technical detail. Use progressive disclosure: a plain-language interpretation first, followed by expandable calculation details, source tradition, definitions, and advanced notes.

Avoid fatalism, fear, superiority, spiritual certainty, diagnosis, coercion, and manipulative engagement. Interpretations should be framed as possibilities, invitations, patterns to examine, or reflective hypotheses—not guaranteed predictions or scientific facts.

Use language such as:

- “This may show up as…”
- “You might recognize…”
- “One way to work with this is…”
- “This system interprets the pattern as…”
- “Your own experience is the final authority on whether this is useful.”

Do not use language such as:

- “This will definitely happen.”
- “You are destined to…”
- “The universe guarantees…”
- “Your chart proves…”
- “Ignore professional advice because…”

### 3. First-run onboarding and birth-data integrity

Create a low-friction onboarding flow. The minimum starting information is:

- Display name
- Full name at birth for name-based numerology, clearly explaining why it is requested
- Birth date
- Birth location, resolved to latitude, longitude, historical timezone, and daylight-saving status
- Birth time, optional but strongly encouraged

For birth time, offer:

- Exact/recorded
- Approximate
- Unknown

Never fabricate time-dependent results. Attach an **Accuracy & Confidence** layer to every calculation:

- **High confidence:** exact recorded time and resolved place/timezone
- **Moderate confidence:** approximate time; show which results may change
- **Limited confidence:** unknown time; suppress or clearly mark time-sensitive results

If time is unknown:

- Do not state a Rising sign, houses, angles, exact Moon position near a sign boundary, Human Design type/profile/authority, or time-sensitive Sabian placement as certain.
- Show what can still be calculated responsibly.
- Offer a “Why birth time matters” explanation.
- Allow the user to add or correct birth time later and automatically recalculate affected results while preserving the earlier version in a change log.

Allow preferred/current name as an additional field without overwriting name-at-birth calculations. Explain which numerology result uses which name.

Obtain granular consent before saving sensitive birth information. Include account deletion, data deletion, data correction, and consent-history controls from the start.

### 4. System architecture: a modular identity library

Build each modality as an independently versioned module with:

- Module name and category
- Input requirements
- Calculation method and engine version
- Confidence requirements
- Original or properly licensed interpretation library
- Beginner and advanced explanations
- Individual chart/report screen
- Comparison mappings
- Combined-profile mappings
- Progress/journal connections
- Admin enable/disable and release controls
- Citation, attribution, copyright, and license metadata
- Last-reviewed date and reviewer field

The founder must be able to add future modalities without rewriting the app’s identity, comparison, journaling, or account systems.

Create three top-level modality categories:

#### A. Birth-calculated systems

Include at launch:

- Western/tropical astrology
- Full natal chart
- Astrology Big 3: Sun, Moon, Rising
- Astrology Big 6: Sun, Moon, Rising, Mercury, Venus, Mars
- Planetary placements, houses, angles, aspects, dignities where supported, nodes, and retrogrades
- Astrology transits for any selected past, present, or future date
- Human Design
- Pythagorean numerology
- Life Path cycles and Personal Years as immediate launch features
- Chaldean numerology
- Sabian symbols for the 360 zodiacal degrees
- Chinese zodiac
- BaZi / Four Pillars
- Vedic astrology
- Gene Keys only if the required permission or license is secured; otherwise create a clearly labeled disabled integration shell with an official external link and no copied/generated substitute for protected teachings
- Mayan/Tzolkin calendar
- Elven Star / sevenfold Sabian work only if a legally reviewed original or licensed implementation is available

#### B. Observation- and synchronicity-based systems

Include at launch:

- Angel-number lookup
- Repeating-number journal
- Synchronicity log
- Moon phases and lunar planning
- Dream journal and non-diagnostic dream-reflection prompts
- Tarot journal/readings
- I Ching consultation journal
- Chakra self-reflection
- Archetype exploration
- Meditation practices
- Rituals and affirmations

These modules may request context different from birth information. Ask only for the information needed for the selected experience, explain why, and never imply that extra personal information is required for unrelated modules.

For angel numbers, support number entry, repeating-sequence recognition, component-number analysis, reduction where appropriate, an original interpretive summary, reflective questions, and journaling of where/when the number appeared. Let the user later review frequency, surrounding life context, and whether the interpretation remained relevant. Do not silently monitor messages, photos, calls, location, finances, or other device data.

#### C. Assessment-based psychological and relational systems

Include optional in-app assessments for:

- A legally safe 16-type/Jungian preference framework; use MBTI branding or proprietary instruments only with appropriate permission
- Enneagram
- Big Five
- Attachment styles
- Love languages or an original relational-preference framework if protected terminology/instruments require permission
- Values
- Strengths
- Spiritual gifts
- Additional founder-approved assessments

Clearly label these as assessment-derived, not birth-calculated. Show assessment date, version, completion quality, and retake history. Do not present a result as a clinical diagnosis.

### 5. Dedicated chart and modality areas

Create a **Library** area where every system has its own card, status, required inputs, chart/report, definitions, and learning path. Users must always be able to inspect each chart separately before reading a synthesis.

Suggested information architecture:

- Home / Today
- My inCommon Profile
- Library
- Compare
- Timeline / Progress
- Journal
- Guide / Ask inCommon
- Settings

Within Library, provide filters for:

- Calculated from birth
- Requires an assessment
- Requires a question or observation
- Complete
- Incomplete
- Limited by missing birth time
- Recently updated
- Favorites

Each module screen should contain:

1. Visual chart or primary result
2. Plain-language overview
3. Core components
4. Advanced technical detail
5. Current timing, when applicable
6. Reflection questions
7. Save as an insight
8. Compare with another system
9. Compare with another person, when applicable
10. Accuracy, method, source, version, and license information

### 6. Astrology requirements

Astrology must be a first-class, technically credible section rather than a generic horoscope feed.

Provide:

- Big 3 view
- Big 6 view
- Full natal wheel
- Placements table
- Houses and angles
- Aspect list and aspect visualization
- Beginner and advanced modes
- Tropical by default, with room for sidereal and house-system choices
- Clear calculation settings and the ability to recalculate after a setting change

Build a **Transit Time Machine** allowing the user to choose any supported date and time in the past, present, or future. Include:

- Transits to natal planets and angles
- Transit-to-transit context
- Applying, exact, and separating states
- Start, peak/exact, and end windows
- Strength/relevance filters based on transparent rules
- Calendar, list, and timeline views
- Daily, weekly, monthly, yearly, and custom ranges
- “What changed since this date?” comparison
- Saved date markers for major life events
- A distinction between astronomical calculation, astrological interpretation, and AI-generated synthesis

Do not let the language model calculate chart positions from prose or memory. Use a validated ephemeris/calculation engine, automated tests, historical timezone handling, and known reference charts. Select and document a legally compatible calculation approach. If Swiss Ephemeris is used, do not launch until its AGPL/commercial licensing choice is resolved and recorded.

### 7. Human Design and other time-sensitive charts

Render a proper BodyGraph when a legally compatible calculation and display implementation is available. Include relevant components such as type, strategy, authority, profile, definition, centers, channels, gates, incarnation cross, variables, and transits only when supported accurately and lawfully.

Support a dedicated Human Design transit view and two-person connection view. Do not reverse-engineer, copy, scrape, or reproduce proprietary interpretations from competing tools.

Apply the same integrity rules to BaZi, Vedic astrology, Tzolkin, Gene Keys, Elven Star, and other traditions: use validated calculations, identify the tradition/version, preserve the original system’s distinctions, and place licensing gates in front of protected material.

### 8. Compare Lab

Create a separate **Compare Lab** with two modes.

#### Mode 1: One person across systems

Allow users to place two or more of their results side-by-side. Provide structured comparison dimensions such as:

- Identity and temperament
- Emotional processing
- Communication
- Decision-making
- Relationships and attachment
- Work, purpose, and contribution
- Energy and pacing
- Strengths and resources
- Friction, shadow, or growth edge
- Timing and current cycles

#### Mode 2: Two people

Allow a user to invite or add a second person with consent. Compare:

- Astrology synastry and composite options, when supported
- Human Design connection chart, when supported
- Numerology compatibility
- Personality and relational assessments
- Communication patterns
- Shared strengths
- Potential friction
- Timing affecting the relationship
- Agreements and disagreements between modalities

Do not reduce a relationship to a single compatibility score. If summary indicators are used, make them multi-dimensional, explain the inputs, allow users to hide them, and state that human choice and context remain decisive.

### 9. The combined inCommon Profile

Create a signature synthesis area titled **My inCommon Profile**. It must analyze four things explicitly:

1. **Agreements:** systems pointing toward a similar theme
2. **Tensions:** systems offering meaningfully different or conflicting interpretations
3. **Recurring themes:** ideas appearing across multiple systems or across time
4. **Distinct contributions:** insights unique to one system that should not be forced into a consensus

The synthesis engine must:

- Retrieve only the user’s calculated, assessed, observed, and journal-approved data.
- Cite the contributing module and specific component beside every synthesized claim.
- Separate source result, interpretation, user reflection, and AI synthesis.
- Never invent a chart placement or assessment answer.
- Show confidence based on data completeness and calculation confidence—not how “true” a spiritual claim is.
- Allow the user to mark an interpretation as resonant, partly resonant, unclear, not resonant, or revisit later.
- Learn personalization from these ratings without rewriting the original chart.
- Let the user expand any combined insight back to the separate source charts.

Do not produce a rigid master label. The combined profile should remain living, inspectable, revisable, and plural.

### 10. Daily experience and AI guide

Build **Today inCommon**, a personalized home dashboard containing:

- Current astrology transits
- Current Human Design or other timing “weather,” when lawfully supported
- Personal Year and relevant numerology cycle
- Moon phase
- Saved angel-number or synchronicity patterns
- Active goals and recent check-ins
- One grounded reflection prompt
- Optional ritual, affirmation, or meditation
- Upcoming significant dates
- Continue-your-thread cards from prior insights

Create an optional conversational guide called **Ask inCommon**. It should answer natural-language questions using the user’s verified profile, selected comparison person, current timing, journal entries the user has opted to include, and the app’s approved content library.

The guide must:

- Cite which systems and placements informed the answer.
- Distinguish calculation from interpretation.
- Remember prior conversations only with consent.
- Ask useful follow-up questions when context would change the guidance.
- Avoid medical, legal, financial, mental-health, or crisis claims.
- Never recommend dependency on the app or position itself as a supernatural authority.
- Provide crisis and professional-support redirection when appropriate.
- Let the user exclude any journal entry, profile field, or modality from AI context.

### 11. Insight, progress, and longitudinal tracking

The progress system is central, not an afterthought.

Allow any chart interpretation, transit, assessment result, AI conversation, angel-number entry, dream, ritual, or journal passage to become an **Insight Record** containing:

- Insight title and source
- Original date and relevant timing window
- Exact source calculation/result
- Interpretation shown at the time
- User’s initial reaction
- Life area
- Optional goal, intention, or experiment
- Expected or possible future signal
- Follow-up date
- Status
- Later check-ins
- Outcome and user evaluation
- Linked past or future insights
- Privacy level

Create a **Throughline Timeline** that connects earlier, current, and anticipated insights. Let users examine:

- What repeated
- What changed
- What resolved
- What intensified
- What no longer fits
- Which practices seemed helpful
- Which predictions or interpretations did not prove useful
- How their own assessment results changed

Allow progress to be weighed through both qualitative reflection and transparent user-defined indicators. Never manufacture causal proof that a spiritual practice or transit caused an outcome. Use phrasing such as “associated with,” “occurred during,” or “the user marked this as helpful.”

Support private goals, check-ins, streaks only when they are gentle and optional, and periodic reflection summaries. Avoid shame-based notifications or manipulative retention.

### 12. Notifications, journaling, and calendar

Make all notifications opt-in by category. Potential categories:

- Exact transit windows
- Daily/weekly reflection
- Personal month/year changes
- Moon events
- Saved follow-up dates
- Progress check-ins
- Angel-number journal review
- Relationship timing

Allow calendar navigation to any date. Do not export or share charts yet. Design the internal data model so export/share can be added later without reworking ownership or permissions.

### 13. Four complete visual worlds

Create a theme setting in which the utility, information hierarchy, accessibility, and available features remain identical, but each aesthetic feels like a genuinely different product world rather than a simple color swap.

Provide at least four themes:

1. **Modern Mystical / Premium:** deep ink, restrained jewel tones, elegant geometry, subtle motion, editorial typography.
2. **Dark Cosmic:** black and midnight space, luminous planetary lines, constellation depth, cinematic but readable.
3. **Warm Natural / Spiritual:** parchment, clay, sage, sun-washed gradients, organic forms, tactile calm.
4. **Clean Psychological / Editorial:** bright neutral field, high legibility, structured cards, restrained diagrams, research-journal feeling.

Requirements:

- Each theme needs its own design-token set, icon treatment, chart treatment, motion language, illustration rules, surfaces, and typography pairing.
- Maintain WCAG accessibility, reduced-motion support, text scaling, high contrast, keyboard access, and screen-reader labels across every theme.
- Preserve identical functionality and navigation.
- Let the user switch instantly and optionally follow the device setting.
- Do not imitate the protected visual identity of named competitor apps.

### 14. Content and intellectual-property rules

Create a content-governance system before importing or generating large interpretation libraries.

Non-negotiable rules:

- Do not scrape competing apps or websites.
- Do not copy, closely paraphrase, or train on protected interpretations without permission.
- Do not use Joanne Sacred Scribes content beyond its stated permissions. Use it only as a reference for desired depth and organization; write legally distinct, original angel-number interpretations based on documented numerology principles, or secure a license.
- Do not copy James Burgess/Sacred 7 Academy interpretations or protected teaching materials. Use public-domain source material where confirmed, write original commentary, or secure permission.
- Do not reproduce Gene Keys names, profile content, teachings, sequences, or AI-derived substitutes without the permissions required by its rights holders.
- Treat Human Design interpretations, MBTI instruments/branding, Love Languages instruments/branding, and other branded systems as licensing-review items.
- Store source, author, copyright status, license, permitted uses, attribution requirements, and review date for every content collection.
- Provide a kill switch for any module or content set with unresolved rights.
- Require human editorial approval before AI-generated interpretations go live.

Create original content in the inCommon voice. Build an editorial review workflow with draft, legal/licensing review, spiritual/tradition review, psychological-safety review, approved, scheduled, published, and retired states.

### 15. Privacy, security, and consent

Birth data, names, relationship profiles, assessments, and journals are sensitive. Implement privacy by design.

At minimum:

- Secure authentication
- Encryption in transit and at rest
- Least-privilege roles
- Field-level or equivalent protection for sensitive data where feasible
- Consent records
- Audit logs for administrative access
- User-controlled AI memory and journal inclusion
- Delete account and delete data
- Correct birth details and recalculate
- Export-ready architecture, even though user export is not yet enabled
- Relationship-profile consent and revocation
- No sale of personal data
- No advertising-based surveillance
- No undisclosed model training on private user content
- Age gate and a deliberate minors policy before launch
- Retention rules and automatic deletion for abandoned sensitive drafts where appropriate
- Clear privacy language written for ordinary users

Do not expose a person’s full chart, birth details, journal, or compatibility analysis to another user without explicit permission.

### 16. Free launch and later monetization readiness

The application must be entirely free until a committed user base is established. Do not place any launch feature behind a paywall.

Nevertheless, design clean feature flags and entitlement architecture so future monetization can be introduced deliberately without a rewrite. Do not activate monetization. Include founder analytics focused on genuine product value rather than vanity metrics:

- Activated profiles
- Birth-time completion and correction rates
- Module completion
- Return use by module
- Saved insights
- Follow-up completion
- Longitudinal engagement
- AI-guide usefulness ratings
- Theme preference
- Retention cohorts
- Consent and deletion behavior
- User-reported value

Analytics must be privacy-conscious, disclosed, and separated from spiritual interpretations.

### 17. Founder administration and live-development control

Create a protected founder/super-admin console that allows the founder to:

- Edit all interpretation content
- Edit AI system prompts and module prompts with version history
- Preview prompt changes against test profiles before publishing
- Add, reorder, disable, or retire modalities
- Manage source and license metadata
- Control feature flags
- Manage themes and design tokens
- Configure notifications
- Review anonymized product analytics
- Review user feedback and flagged content
- Manage editorial workflows
- Inspect calculation-engine versions and health
- Roll back content and prompt releases
- Access staging and production environments
- Publish approved changes without developer intervention when safe

Every content and prompt change must have version history, author, timestamp, change note, preview, approval status, and rollback.

### 18. Technical ownership and handoff requirements

Build the project inside accounts controlled by the founder. The founder must receive and retain:

- Super-admin access
- Complete source code
- Founder-controlled version-control repository
- Database ownership and schema documentation
- Hosting and deployment ownership
- Domain and DNS control
- API accounts and keys held in founder-controlled secret management
- Calculation-engine documentation and license records
- AI provider configuration and replaceable provider abstraction
- Content-management access
- Analytics access
- Staging and production access
- Error monitoring and logs
- Automated test suite
- Backups and restoration procedure
- Deployment and rollback documentation
- Data dictionary and system diagram
- Vendor and recurring-cost register
- Local-development instructions
- Native-app migration plan
- No undisclosed proprietary dependency that prevents migration away from Fable 5

Do not launch on an account the founder cannot access. Do not make Fable 5 the only party capable of editing, deploying, exporting, or maintaining the product.

### 19. Data model expectations

Design normalized, extensible entities for at least:

- User
- Consent
- Birth Profile
- Location / Historical Timezone Resolution
- Relationship Profile / Permission
- Modality
- Module Version
- Calculation
- Calculation Confidence
- Chart Component
- Interpretation
- Source / License
- Assessment
- Assessment Response
- Transit / Timing Window
- Combined Insight
- Insight Record
- User Reflection
- Goal / Check-in / Outcome
- Journal Entry
- Synchronicity / Angel Number Entry
- AI Conversation and Consent Scope
- Theme Preference
- Notification Preference
- Content Version
- Prompt Version
- Feature Flag
- Audit Event

Calculations and interpretations must be versioned separately. A content edit must not silently change the stored astronomical or numerological calculation. A recalculation must record why it occurred.

### 20. Accuracy and test requirements

Before launch, create and pass tests for:

- Known astrology reference charts
- Historical timezone and daylight-saving edge cases
- Dates near sign, house, and daylight-saving boundaries
- Approximate and unknown birth time behavior
- Big 3 and Big 6 display accuracy
- Transit date selection across past, present, and future
- Numerology calculations, master-number policy, name normalization, Life Path cycles, and Personal Years
- Comparison permissions
- Synthesis citations back to source components
- No unsupported synthesis claim
- Prompt-injection resistance around private profile data
- Account/data deletion
- Theme parity and accessibility
- Mobile responsiveness and installable PWA behavior
- Offline/error states
- Module kill switches
- Version rollback
- No paywalls at launch
- Founder access and deployability

Do not claim production readiness while using placeholder calculation logic, invented spiritual content, unreviewed licensing, or mock data in live user results.

### 21. Build phases and editable checkpoints

Work in phases. At the end of every phase, stop and provide:

1. What was built
2. A working preview
3. Files/components changed
4. Assumptions made
5. Open decisions
6. Licensing or data risks
7. Tests run and results
8. Known gaps
9. Cost-impact changes
10. A clearly labeled **FOUNDER RE-PROMPT / EDIT HERE** section

Recommended phases:

#### Phase 0 — Discovery and architecture

- Convert this master prompt into a traceable requirements matrix.
- Identify calculation engines, APIs, licenses, costs, and alternatives.
- Produce information architecture, data model, security model, module standard, and wireframes.
- Do not ingest protected content.
- Obtain founder approval before architecture is locked.

#### Phase 1 — Foundation and design system

- Authentication, consent, onboarding, birth profile, historical timezone handling, navigation, four-theme engine, founder admin foundation, database, staging, CI/CD, and PWA shell.

#### Phase 2 — Core identity modules

- Western astrology with Big 3, Big 6, and full chart
- Numerology with Life Path cycles and Personal Years
- Original angel-number lookup and journal
- Sabian-symbol framework using cleared content
- Separate Library views

#### Phase 3 — Timing, journaling, and progress

- Transit Time Machine
- Today inCommon
- Insight Records
- Throughline Timeline
- Goals, check-ins, and outcome review
- Notifications

#### Phase 4 — Comparison and synthesis

- Cross-system Compare Lab
- My inCommon Profile
- Agreements, tensions, recurring themes, and distinct contributions
- Citation and confidence layer

#### Phase 5 — Additional systems

- Human Design
- Vedic astrology
- Chinese zodiac and BaZi
- Tzolkin
- Chaldean numerology
- Assessments
- Observation-based spiritual tools
- Gene Keys and Elven Star only when permissions and implementation are cleared

#### Phase 6 — AI guide, relationship mode, and hardening

- Ask inCommon
- Two-person consent and compatibility
- Security review
- Performance/accessibility QA
- Content and licensing audit
- Founder handoff
- Launch readiness review

### 22. Decision and change protocol

Treat this prompt as the founding specification, not an unchangeable ceiling. Preserve editability.

When the founder re-prompts:

- Restate the requested change.
- Identify affected requirements, screens, data, content, calculations, tests, costs, and licenses.
- Do not silently remove an earlier requirement.
- Present conflicts and recommend a resolution.
- Update the requirements matrix and change log.
- Keep a reversible checkpoint before material changes.
- Show the new preview and regression-test results.

If a request cannot be implemented accurately, legally, securely, or within the current platform, say so plainly and build the safest reversible placeholder only with founder approval.

### 23. Immediate first response required from Fable 5

Do not begin by generating a polished home screen and pretending the product is complete. Begin with:

1. A concise restatement of inCommon’s product thesis
2. A requirements matrix grouped into launch-critical, post-foundation, and licensing-gated features
3. Proposed technical architecture
4. Proposed calculation engines/APIs with license and cost implications
5. Proposed database and consent model
6. Proposed screen map and primary user flows
7. Proposed module/content standard
8. The four visual-world directions
9. Major legal, privacy, calculation, and product risks
10. The smallest set of remaining founder decisions genuinely required before Phase 1
11. A Phase 1 build plan with acceptance criteria
12. A clearly labeled **FOUNDER RE-PROMPT / EDIT HERE** block

Then wait for founder approval before locking architecture or importing content.

---

## Founder notes for future re-prompts

Use this block beneath the master prompt whenever directing the next development round:

```text
INCOMMON CHANGE REQUEST

Requested change:

Reason / desired outcome:

Who it affects:

Priority: Critical / High / Medium / Later

Must remain unchanged:

Acceptance test:

Before implementing, identify conflicts, affected systems, data changes,
licensing implications, cost changes, and rollback method. Then show the
updated build and regression-test results.
```

---

## Research and rights notes informing this prompt

These links are product and governance references, not permission to copy their text, logic, data, visual identity, or protected teachings:

- Co–Star: https://www.costarastrology.com/
- The Pattern: https://www.thepattern.com/
- Astra — Life Advice: https://astra-life-advice.com/
- myBodyGraph: https://www.mybodygraph.com/
- Joanne Sacred Scribes angel-number index and stated usage terms: https://sacredscribesangelnumbers.blogspot.com/p/index-numbers.html
- Sacred 7 Academy / Sabian Symbols: https://www.jamesburgess.com/
- Swiss Ephemeris professional license: https://www.astro.com/swisseph/secont_e.pdf
- Gene Keys branding and intellectual-property standards: https://genekeys.com/h/branding-standards/
- Gene Keys AI position: https://genekeys.com/ai/

