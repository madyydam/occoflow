# Universal CRM SaaS --- Product Requirements Document (PRD)

**Version:** 1.0\
**Product Type:** Multi-tenant SaaS CRM\
**Primary Build Platform:** Lovable\
**Product Strategy:** Build in 3 controlled versions\
**Design Priority:** Mobile-first, simple, premium, business-owner
friendly\
**Primary Theme:** Clean white UI with blue/purple accents inspired by
the provided analytics reference\
**Target Users:** Small and medium-sized business owners, sales teams,
service businesses, agencies, retailers and other businesses that manage
leads, customers and sales

------------------------------------------------------------------------

# 1. Product Overview

The product is a **general-purpose CRM SaaS** designed for business
owners who want to manage leads, customers, follow-ups, deals and daily
sales activity from one simple system.

The CRM must not feel like an enterprise system packed with hundreds of
confusing features. It should feel like a product a business owner can
open on their phone, immediately understand and start using.

The product should work across industries such as:

-   Real estate
-   Gyms and fitness businesses
-   Restaurants and catering
-   Salons and beauty businesses
-   Clinics and professional services
-   Marketing agencies
-   Web/app development agencies
-   Coaching and education businesses
-   Automobile businesses
-   Retail businesses
-   Home services
-   B2B service companies
-   Local businesses
-   Any business that handles leads and customers

The architecture must remain industry-neutral.

Industry-specific fields must not be hard-coded into the core CRM.

------------------------------------------------------------------------

# 2. Product Vision

Create a CRM that answers one simple business question:

> "Who are my customers, what is happening with them, and what should I
> do next?"

The product should make these actions extremely easy:

**Add Lead → Contact Customer → Follow Up → Update Status → Create Deal
→ Close Deal**

The interface should prioritize the most important actions and hide
secondary functionality until it is needed.

------------------------------------------------------------------------

# 3. Product Principles

## 3.1 Simplicity First

The product must be powerful underneath but simple on the surface.

Do not add a feature simply because other CRMs have it.

Every feature must pass this question:

> Does this help a business owner manage customers, sales or follow-ups
> more easily?

If not, it should not be part of the primary experience.

## 3.2 Mobile First

Mobile is a first-class product experience, not a responsive
afterthought.

A user should be able to manage the majority of daily CRM work from a
phone.

## 3.3 Desktop Ready

The same application must work as a professional SaaS web portal on
laptop and desktop.

The desktop version should provide more space without becoming a
different product.

## 3.4 Universal CRM

Do not use real-estate-specific terminology in the core UI.

For example, avoid:

-   BHK
-   Property Type
-   Site Visit
-   Property Requirement
-   Builder
-   Carpet Area

Instead use generic CRM concepts:

-   Requirement
-   Lead Type
-   Activity
-   Meeting
-   Deal
-   Value
-   Source
-   Follow-up

## 3.5 Business Data Isolation

Each business/workspace must have completely isolated data.

Business A must never be able to access Business B's leads, contacts,
deals, tasks, notes or activities.

Security must be enforced at the backend/database level, not only
through frontend filtering.

------------------------------------------------------------------------

# 4. Reference Design Direction

The provided reference images establish three important design
directions.

## Reference 1 and 2 --- Mobile CRM UX

Use these as inspiration for:

-   Lead cards
-   Search
-   Status filters
-   Lead detail pages
-   Pipeline stages
-   Quick actions
-   Call/message actions
-   Notes and activity timeline
-   Follow-up information
-   Simple bottom navigation
-   Floating Add Lead action

Do not copy their branding or real-estate-specific fields.

## Reference 3 --- Visual Theme

Use this as the primary visual reference for:

-   White/light interface
-   Blue and purple accent colors
-   Clean SaaS dashboard
-   Soft cards
-   Rounded components
-   Modern typography
-   Simple analytics
-   Professional spacing
-   Minimal visual noise

The final design should be original rather than a direct copy.

------------------------------------------------------------------------

# 5. Brand / Logo Direction

The CRM logo should be an **icon-based brand mark**, not merely a single
letter.

Requirements:

-   No text inside the icon
-   Easy to understand as a CRM/business-management product
-   Memorable silhouette
-   Distinctive enough to become a standalone SaaS brand
-   Simple enough to work as a mobile app icon
-   Clean enough for a website header
-   Works at small sizes
-   Blue/purple visual language
-   Avoid generic "letter + arrow" logos
-   Avoid overly literal stock-style people icons
-   Avoid excessive gradients
-   Avoid complicated 3D effects

The symbol should communicate a combination of:

-   Customers/relationships
-   Organization
-   Growth
-   Business management
-   Connection

The logo must feel like a real technology company brand rather than a
generic CRM template.

------------------------------------------------------------------------

# 6. Navigation Architecture

Navigation must remain intentionally limited.

## Mobile --- EXACTLY 5 Bottom Tabs

1.  Home
2.  Leads
3.  Deals
4.  Tasks
5.  More

No sixth primary tab should be added.

Secondary sections live inside More:

-   Contacts
-   Calendar
-   Analytics
-   Settings
-   Profile
-   Subscription
-   Help

The bottom navigation must:

-   Stay fixed
-   Respect mobile safe areas
-   Never cover content
-   Have a clear active state
-   Use icons + short labels
-   Be thumb-friendly
-   Remain visually simple

## Desktop/Laptop --- EXACTLY 8 Sidebar Tabs

1.  Dashboard
2.  Leads
3.  Contacts
4.  Deals
5.  Tasks
6.  Calendar
7.  Analytics
8.  Settings

The desktop sidebar should include:

-   Brand/logo
-   Primary navigation
-   Active state
-   User/business profile
-   Subscription information near the bottom

Do not add extra primary navigation items.

------------------------------------------------------------------------

# 7. Core Application Modules

The CRM consists of:

1.  Authentication
2.  Business/workspace management
3.  Dashboard
4.  Leads
5.  Contacts
6.  Deals
7.  Tasks
8.  Calendar
9.  Analytics
10. Activities
11. Follow-ups
12. Notes
13. Notifications
14. Settings
15. Subscription/billing
16. Communication
17. Team management

Some modules are introduced progressively across the three build
versions.

------------------------------------------------------------------------

# 8. Three-Version Development Strategy

The application must be built in three controlled stages.

## VERSION 1 --- Product Foundation and UI

Goal:

Create the complete responsive product experience and reusable design
system.

Includes:

-   Mobile-first UI
-   Desktop portal
-   Authentication screens/UI
-   Dashboard
-   Leads
-   Lead details
-   Contacts
-   Deals
-   Tasks
-   Calendar
-   Analytics
-   Settings
-   Add/edit forms
-   Empty states
-   Loading states
-   Demo data
-   Responsive component system

Version 1 should establish the visual and UX foundation.

Do not implement paid subscriptions yet.

Do not implement advanced calling/messaging yet.

------------------------------------------------------------------------

# 9. VERSION 2 --- Functional CRM

Goal:

Turn Version 1 into a real working CRM.

Includes:

-   Authentication
-   Database
-   Multi-tenancy
-   Business/workspace isolation
-   Real CRUD operations
-   Leads
-   Contacts
-   Deals
-   Tasks
-   Follow-ups
-   Notes
-   Activity timeline
-   Search
-   Filters
-   Sorting
-   Dashboard calculations
-   Analytics based on real data
-   User/business profiles
-   Notifications
-   Authorization
-   Security

The existing Version 1 design must not be unnecessarily redesigned.

Version 2 should feel like the same product, now powered by real data.

------------------------------------------------------------------------

# 10. VERSION 3 --- SaaS Monetization and Premium Communication

Goal:

Turn the CRM into a commercial SaaS.

Plans:

### Standard Monthly

**₹199/month**

### Premium Monthly

**₹499/month**

### Standard Yearly

**₹1,999/year**

### Premium Yearly

**₹4,999/year**

Premium adds communication functionality such as:

-   In-app calling
-   In-app messaging
-   Communication history
-   Premium communication tools

Version 3 also includes:

-   Payment gateway
-   Subscription lifecycle
-   Plan management
-   Upgrade
-   Downgrade
-   Renewal
-   Cancellation
-   Billing history
-   Invoice/receipt support
-   Feature gating
-   Premium feature locks
-   Subscription status
-   Trial support if enabled
-   Payment failure handling

------------------------------------------------------------------------

# 11. User Personas

## Persona 1 --- Small Business Owner

Needs:

-   Quick lead entry
-   Follow-up reminders
-   Customer information
-   Simple sales pipeline
-   Daily activity overview

Does not want:

-   Complex dashboards
-   Technical terminology
-   Long setup processes

## Persona 2 --- Salesperson

Needs:

-   Leads
-   Contacts
-   Follow-ups
-   Tasks
-   Deals
-   Communication
-   Activity history

## Persona 3 --- Small Team Owner

Needs:

-   Multiple users
-   Assigned leads
-   Team visibility
-   Activity tracking
-   Business-level analytics

------------------------------------------------------------------------

# 12. Authentication Requirements

Screens:

-   Login
-   Sign Up
-   Forgot Password
-   Reset Password
-   Logout

Sign-up fields:

-   Full Name
-   Business Name
-   Email
-   Phone
-   Password

After signup:

1.  Create user
2.  Create business/workspace
3.  Create membership
4.  Create default CRM configuration
5.  Open dashboard

Authentication must be secure.

Never expose passwords or secrets in frontend code.

------------------------------------------------------------------------

# 13. Multi-Tenant Architecture

Core entities:

-   User
-   Business
-   Membership

Every CRM entity must belong to a Business.

Relationship:

Business → Users → Leads → Contacts → Deals → Tasks → Follow-ups →
Activities → Notes → Notifications → Subscription

Backend authorization must ensure:

`user → membership → business → records`

A user must not be able to access another business's records by
manipulating IDs or API requests.

------------------------------------------------------------------------

# 14. Database Entities

Recommended core entities:

## Users

-   id
-   name
-   email
-   phone
-   avatar
-   created_at
-   updated_at

## Businesses

-   id
-   name
-   logo
-   phone
-   email
-   address
-   industry
-   owner_id
-   created_at
-   updated_at

## Memberships

-   id
-   business_id
-   user_id
-   role
-   created_at

## Leads

-   id
-   business_id
-   name
-   phone
-   email
-   company
-   source
-   status
-   priority
-   potential_value
-   assigned_user_id
-   next_follow_up_at
-   notes
-   created_at
-   updated_at

## Contacts

-   id
-   business_id
-   name
-   phone
-   email
-   company
-   notes
-   created_at
-   updated_at

## Deals

-   id
-   business_id
-   name
-   contact_id
-   lead_id
-   value
-   stage
-   expected_close_date
-   assigned_user_id
-   notes
-   created_at
-   updated_at

## Tasks

-   id
-   business_id
-   title
-   description
-   lead_id
-   contact_id
-   deal_id
-   due_at
-   priority
-   status
-   assigned_user_id
-   created_at
-   updated_at

## Follow-ups

-   id
-   business_id
-   lead_id
-   contact_id
-   scheduled_at
-   note
-   reminder
-   status
-   created_by
-   created_at

## Activities

-   id
-   business_id
-   lead_id
-   contact_id
-   deal_id
-   task_id
-   activity_type
-   description
-   created_by
-   created_at

## Notes

-   id
-   business_id
-   lead_id
-   contact_id
-   deal_id
-   content
-   created_by
-   created_at
-   updated_at

## Notifications

-   id
-   business_id
-   user_id
-   type
-   title
-   message
-   read
-   created_at

## Subscriptions

-   id
-   business_id
-   plan
-   billing_cycle
-   status
-   provider_customer_id
-   provider_subscription_id
-   current_period_start
-   current_period_end
-   created_at
-   updated_at

------------------------------------------------------------------------

# 15. Lead Management

Leads are the primary CRM object.

Statuses:

-   New
-   Contacted
-   Qualified
-   Follow-up
-   Won
-   Lost

Priorities:

-   Low
-   Medium
-   High

Sources can include:

-   Website
-   Referral
-   Social Media
-   Advertisement
-   Walk-in
-   Phone
-   WhatsApp
-   Other

Users can:

-   Add
-   Edit
-   Archive
-   Restore
-   Search
-   Filter
-   Sort
-   Assign
-   Change status
-   Add note
-   Schedule follow-up
-   Create task
-   Convert to contact
-   Convert to deal

------------------------------------------------------------------------

# 16. Lead Card Design

Mobile cards should show only useful information.

Recommended structure:

**Customer Name**

Phone / Company

Source

Status badge

Next follow-up

Potential value

Quick actions:

-   Call
-   Message

Avoid stuffing every field into the card.

------------------------------------------------------------------------

# 17. Lead Details

Header:

-   Back
-   Customer name
-   Edit
-   More

Customer card:

-   Avatar
-   Name
-   Phone
-   Email
-   Company
-   Status

Primary actions:

-   Call
-   Message
-   Email

Sections:

### Pipeline Stage

New → Contacted → Qualified → Follow-up → Won/Lost

### Customer Information

Phone\
Email\
Company\
Source\
Potential Value

### Next Follow-up

Date\
Time\
Reminder

### Activity

Chronological activity timeline.

### Notes

Recent notes and add-note action.

### Related Deal

If applicable.

------------------------------------------------------------------------

# 18. Contact Management

Contacts are long-term customer records.

Users can:

-   Add
-   Edit
-   Archive
-   Search
-   Filter
-   Open

Fields:

-   Name
-   Phone
-   Email
-   Company
-   Notes
-   Tags

A lead should be convertible into a contact without requiring duplicate
data entry.

------------------------------------------------------------------------

# 19. Deal Management

Pipeline:

1.  New
2.  Qualified
3.  Proposal
4.  Negotiation
5.  Won
6.  Lost

Deal card:

-   Deal name
-   Customer
-   Value
-   Stage
-   Expected closing date

Desktop:

Use Kanban-style pipeline.

Mobile:

Use a stage selector or horizontally navigable stages.

Do not force a large desktop Kanban onto a phone.

------------------------------------------------------------------------

# 20. Tasks

Task categories:

-   Today
-   Upcoming
-   Completed

Task fields:

-   Title
-   Description
-   Related customer
-   Due date
-   Due time
-   Priority
-   Assigned user
-   Status

Statuses:

-   Pending
-   In Progress
-   Completed

Common examples:

-   Call customer
-   Send quotation
-   Follow up
-   Send documents
-   Schedule meeting

------------------------------------------------------------------------

# 21. Follow-up System

Follow-ups are one of the most important CRM workflows.

A follow-up contains:

-   Customer
-   Date
-   Time
-   Reminder
-   Note
-   Status

Statuses:

-   Pending
-   Completed
-   Cancelled

Completing a follow-up must create an activity record.

Dashboard must show pending follow-ups for the current day.

------------------------------------------------------------------------

# 22. Activity Timeline

Activity types:

-   Lead Created
-   Lead Updated
-   Status Changed
-   Call
-   Message
-   Email
-   Note Added
-   Follow-up Created
-   Follow-up Completed
-   Task Created
-   Task Completed
-   Deal Created
-   Deal Stage Changed
-   Deal Won
-   Deal Lost

The timeline should be readable and chronological.

------------------------------------------------------------------------

# 23. Dashboard Requirements

## Mobile

Header:

`Good morning, [Name]`

Summary cards:

-   Total Leads
-   New Leads
-   Follow-ups Today
-   Open Deals

Then:

### Today's Follow-ups

3--5 important items.

### Recent Leads

Recent customer cards.

### Recent Activity

Small timeline.

Primary action:

`+ Add Lead`

Do not overload mobile with charts.

## Desktop

Top KPI cards:

-   Total Leads
-   New Leads
-   Follow-ups
-   Open Deals

Then:

-   Lead overview
-   Deal pipeline
-   Today's follow-ups
-   Recent activity

------------------------------------------------------------------------

# 24. Analytics

Analytics must remain understandable.

KPIs:

-   Total Leads
-   New Leads
-   Contacted Leads
-   Qualified Leads
-   Open Deals
-   Won Deals
-   Lost Deals
-   Total Deal Value
-   Won Revenue

Charts:

-   Leads over time
-   Lead status distribution
-   Deal pipeline
-   Won vs Lost
-   Revenue over time

Date ranges:

-   7 Days
-   30 Days
-   90 Days
-   This Year

Avoid unnecessary charts.

------------------------------------------------------------------------

# 25. Calendar

Calendar is for:

-   Follow-ups
-   Tasks
-   Meetings

Mobile:

Use agenda-first layout.

Desktop:

Use calendar + agenda.

The calendar should not become an independent complex scheduling
product.

------------------------------------------------------------------------

# 26. Search

Global desktop search should support:

-   Leads
-   Contacts
-   Deals
-   Tasks

Lead search:

-   Name
-   Phone
-   Email
-   Company

Contact search:

-   Name
-   Phone
-   Email
-   Company

Search should be fast.

------------------------------------------------------------------------

# 27. Filters

Lead filters:

-   Status
-   Priority
-   Source
-   Assigned User
-   Follow-up date

Deal filters:

-   Stage
-   Assigned User
-   Expected close date

Task filters:

-   Status
-   Priority
-   Due date
-   Assigned User

Mobile filters should open as a bottom sheet or simple modal.

------------------------------------------------------------------------

# 28. Settings

Settings should remain simple.

Sections:

### Business Profile

-   Business name
-   Logo
-   Phone
-   Email
-   Address
-   Industry

### User Profile

-   Name
-   Photo
-   Phone
-   Email

### CRM Preferences

-   Lead statuses
-   Deal stages
-   Default follow-up preferences

### Team

-   Users
-   Roles
-   Invitations

### Notifications

-   Follow-up reminders
-   Task reminders
-   Deal notifications

### Subscription

-   Current plan
-   Billing
-   Upgrade
-   Renewal

### Security

-   Password
-   Session/logout

### Help

-   Support
-   FAQ

------------------------------------------------------------------------

# 29. Subscription Model

The commercial model is:

  Plan            Monthly        Yearly
  ---------- ------------ -------------
  Standard     ₹199/month   ₹1,999/year
  Premium      ₹499/month   ₹4,999/year

The exact feature matrix should be implemented in Version 3.

## Standard

Core CRM:

-   Dashboard
-   Leads
-   Contacts
-   Deals
-   Tasks
-   Calendar
-   Analytics
-   Follow-ups
-   Notes
-   Activity timeline

## Premium

Everything in Standard plus:

-   In-app calling
-   In-app messaging
-   Communication history
-   Premium communication functionality

Feature limits and future limits must be configurable rather than
hard-coded into UI components.

------------------------------------------------------------------------

# 30. Communication Architecture

Version 3 should support communication without changing the core CRM UI.

Communication types:

-   Phone
-   SMS/message
-   WhatsApp or supported messaging provider
-   Email

Communication history should attach to the relevant customer/lead.

Example:

Customer timeline:

10:20 AM --- Called customer\
11:00 AM --- Message sent\
2:00 PM --- Follow-up scheduled

Actual provider/API choices should be decided during Version 3
implementation based on availability, cost, permissions and regional
support.

------------------------------------------------------------------------

# 31. Mobile UX Rules

Mobile is the highest-priority interface.

Minimum requirements:

-   No horizontal overflow
-   No tiny text
-   No desktop tables forced into phone screens
-   Touch targets around 44px or larger
-   Bottom navigation always accessible
-   Content must account for safe areas
-   Forms must remain usable when keyboard is open
-   Important CTAs must be thumb reachable
-   Cards must stack naturally
-   Bottom sheets should replace oversized desktop modals
-   Search must be easy to access
-   Filters must be easy to operate

Common actions should require no more than 1--3 meaningful interactions
where practical.

------------------------------------------------------------------------

# 32. Desktop UX Rules

Desktop must feel like a professional SaaS portal.

Use:

-   Fixed sidebar
-   Top utility area
-   Responsive content width
-   Grid layouts
-   Tables when appropriate
-   Kanban for Deals
-   Larger analytics views
-   Proper hover states
-   Keyboard-friendly interactions

Do not simply stretch the mobile layout across the desktop screen.

------------------------------------------------------------------------

# 33. Design System

Use a consistent component system.

Components:

-   Button
-   Card
-   Badge
-   Avatar
-   Search bar
-   Filter button
-   Sidebar
-   Bottom navigation
-   Header
-   Lead card
-   Deal card
-   Task card
-   KPI card
-   Timeline
-   Modal
-   Bottom sheet
-   Input
-   Select
-   Date picker
-   Toast
-   Empty state
-   Loading skeleton
-   Confirmation dialog

Design language:

-   Rounded but not excessively rounded
-   Clean borders
-   Soft shadows
-   Strong hierarchy
-   Generous whitespace
-   Consistent spacing
-   Consistent iconography

------------------------------------------------------------------------

# 34. Color Direction

Primary visual direction:

-   White / off-white backgrounds
-   Dark navy text
-   Primary blue
-   Secondary purple
-   Very light blue/purple surfaces
-   Subtle green for success
-   Subtle red for destructive/error
-   Neutral gray for secondary information

Avoid:

-   Neon UI
-   Excessive gradients
-   Heavy glassmorphism
-   Dark cyberpunk styling
-   Excessive shadows
-   Too many colors

Blue/purple should feel like a modern technology brand, not a gaming
interface.

------------------------------------------------------------------------

# 35. Typography

Typography must prioritize readability.

Hierarchy:

-   Large page title
-   Medium section heading
-   Strong card title
-   Comfortable body text
-   Small metadata

Avoid extremely thin text.

Important values and statuses should have clear visual hierarchy.

------------------------------------------------------------------------

# 36. States

Every major operation needs:

### Loading

Use skeletons or subtle loading indicators.

### Empty

Example:

`No leads yet`

`Add your first lead to start managing your sales pipeline.`

CTA:

`Add Lead`

### Error

Example:

`Something went wrong. Please try again.`

### Success

Example:

`Lead saved successfully.`

### Confirmation

For destructive actions:

`Delete this lead?`

Provide:

Cancel\
Delete

------------------------------------------------------------------------

# 37. Data Validation

Validate:

-   Required fields
-   Email format
-   Phone format
-   Number fields
-   Dates
-   Duplicate/obviously invalid data where appropriate

Errors should appear near the relevant field.

Do not use technical database error messages.

------------------------------------------------------------------------

# 38. Performance Requirements

The application should remain fast as data grows.

Use:

-   Pagination
-   Efficient queries
-   Database indexes
-   Lazy loading where useful
-   Optimized lists
-   Debounced search where appropriate

Do not load thousands of records unnecessarily.

------------------------------------------------------------------------

# 39. Security Requirements

Security is a core requirement.

Implement:

-   Secure authentication
-   Backend authorization
-   Business-level data isolation
-   Proper database policies
-   Secure secrets
-   Protected API routes
-   Input validation
-   Safe error handling

Never trust the frontend for authorization.

------------------------------------------------------------------------

# 40. Accessibility

The product should be usable by a broad range of users.

Requirements:

-   Adequate contrast
-   Visible focus states
-   Accessible labels
-   Keyboard navigation on desktop
-   Screen-reader-friendly controls where practical
-   Touch-friendly mobile controls
-   Do not communicate information by color alone

------------------------------------------------------------------------

# 41. Notifications

Notification types:

-   Follow-up due
-   Follow-up overdue
-   Task due
-   Task overdue
-   Deal update
-   Assignment

Version 2 should establish the notification structure.

Version 3 can expand into push/email/SMS notifications as needed.

------------------------------------------------------------------------

# 42. Team Structure

The system should be prepared for multiple users even if the initial
product is mainly used by a single business owner.

Potential roles:

-   Owner
-   Admin
-   Sales User
-   Staff/User

Permissions should be implemented progressively.

Do not make permissions unnecessarily complicated in the first release.

------------------------------------------------------------------------

# 43. Universal CRM Configuration

Businesses should eventually be able to configure:

-   Lead statuses
-   Deal stages
-   Sources
-   Priorities
-   Custom tags

However, configuration should not make onboarding difficult.

Provide sensible defaults.

------------------------------------------------------------------------

# 44. Onboarding

First-time user experience:

1.  Create account
2.  Enter business name
3.  Select broad business category
4.  Confirm profile
5.  Enter CRM

Optional onboarding guidance can explain:

-   Add your first lead
-   Create a follow-up
-   Move a lead to a deal
-   Track your pipeline

Do not force a long setup wizard.

------------------------------------------------------------------------

# 45. Primary User Journeys

## Journey A --- New Lead

Dashboard\
→ Add Lead\
→ Enter Name + Phone + Source\
→ Save\
→ Lead appears in Leads\
→ Lead activity created

## Journey B --- Follow-up

Lead\
→ Schedule Follow-up\
→ Select date/time\
→ Add note\
→ Save\
→ Appears in Today's Follow-ups

## Journey C --- Sales Pipeline

Lead\
→ Qualified\
→ Create Deal\
→ Deal appears in pipeline\
→ Proposal\
→ Negotiation\
→ Won

## Journey D --- Customer

Lead\
→ Convert to Contact\
→ Contact profile created\
→ Activity history retained

## Journey E --- Daily Work

Dashboard\
→ Today's Follow-ups\
→ Open customer\
→ Call/message\
→ Add note\
→ Complete follow-up\
→ Activity recorded

------------------------------------------------------------------------

# 46. Version 1 Acceptance Criteria

Version 1 is complete when:

-   Mobile layout works cleanly
-   Desktop layout works cleanly
-   Exactly 5 mobile bottom tabs exist
-   Exactly 8 desktop primary sidebar tabs exist
-   Dashboard exists
-   Leads exists
-   Lead details exists
-   Contacts exists
-   Deals exists
-   Tasks exists
-   Calendar exists
-   Analytics exists
-   Settings exists
-   Add/edit forms exist
-   Empty states exist
-   Demo data exists
-   Components are reusable
-   UI is visually consistent
-   No horizontal overflow occurs on mobile

------------------------------------------------------------------------

# 47. Version 2 Acceptance Criteria

Version 2 is complete when:

-   Users can register
-   Users can log in
-   Businesses are created
-   Business data is isolated
-   Leads are persisted
-   Contacts are persisted
-   Deals are persisted
-   Tasks are persisted
-   Follow-ups are persisted
-   Notes are persisted
-   Activities are persisted
-   Search works
-   Filters work
-   Dashboard uses real data
-   Analytics uses real data
-   Lead-to-contact conversion works
-   Lead-to-deal workflow works
-   Deal pipeline works
-   Task completion works
-   Follow-up completion works
-   Authorization is enforced
-   Mobile and desktop workflows work

------------------------------------------------------------------------

# 48. Version 3 Acceptance Criteria

Version 3 is complete when:

-   Monthly Standard plan exists at ₹199
-   Monthly Premium plan exists at ₹499
-   Yearly Standard plan exists at ₹1,999
-   Yearly Premium plan exists at ₹4,999
-   Subscription status is stored
-   Payment integration is working
-   Upgrade works
-   Downgrade works
-   Cancellation works
-   Renewal handling exists
-   Billing history exists
-   Feature gating works
-   Premium communication features are restricted correctly
-   In-app calling works through the selected supported provider
-   In-app messaging works through the selected supported provider
-   Communication history appears in customer activity
-   Subscription UI is mobile friendly

------------------------------------------------------------------------

# 49. Non-Goals

The first versions should NOT become:

-   Full ERP
-   Accounting software
-   HR management system
-   Inventory management system
-   Social media management platform
-   Project management suite
-   Complex marketing automation platform
-   Enterprise BI platform

The CRM can integrate with such systems later, but the core product
should remain focused.

------------------------------------------------------------------------

# 50. Future Expansion

Potential future modules:

-   AI lead summaries
-   AI follow-up suggestions
-   Automated lead assignment
-   Email automation
-   WhatsApp automation
-   Marketing campaign tracking
-   Forms
-   Landing-page lead capture
-   Website lead widget
-   API
-   Webhooks
-   Integrations
-   Advanced team permissions
-   Custom fields
-   Import/export
-   Bulk actions
-   Mobile push notifications
-   Revenue forecasting
-   Customer segmentation

These must not be allowed to make the core product confusing.

------------------------------------------------------------------------

# 51. Product Quality Standard

The final CRM should feel like a serious commercial SaaS product.

The quality target is:

**Simple on the surface. Powerful underneath.**

A business owner should be able to understand the main workflow without
reading documentation.

The interface should communicate:

-   Trust
-   Simplicity
-   Growth
-   Organization
-   Professionalism
-   Modern technology

The CRM must not feel:

-   Generic
-   Template-like
-   Over-designed
-   Complicated
-   Corporate-heavy
-   Childish
-   Visually noisy

------------------------------------------------------------------------

# 52. Final Product Definition

This product is a **mobile-first, universal CRM SaaS for business
owners**.

The central workflow is:

**LEADS → FOLLOW-UPS → CONTACTS → DEALS → TASKS → CLOSED BUSINESS**

The mobile application uses exactly:

**Home \| Leads \| Deals \| Tasks \| More**

The desktop portal uses exactly:

**Dashboard \| Leads \| Contacts \| Deals \| Tasks \| Calendar \|
Analytics \| Settings**

The product is developed in three stages:

### Version 1

**Design + responsive product foundation**

### Version 2

**Real CRM + database + authentication + workflows**

### Version 3

**Subscriptions + payments + premium communication**

The commercial pricing structure is:

**₹199/month --- Standard**\
**₹499/month --- Premium**\
**₹1,999/year --- Standard**\
**₹4,999/year --- Premium**

The most important product rule remains:

> **Keep it simple. Make the complex work happen underneath the
> interface.**
