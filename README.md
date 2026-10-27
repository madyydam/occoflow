# Occo Flow

A modern, fast, simple universal CRM SaaS platform for business owners by Heyocco.



IMPORTANT:

This is NOT a real-estate-only CRM. It must be a GENERAL-PURPOSE CRM that can be used by almost any business that manages leads, customers, follow-ups and sales.



Use the uploaded reference screenshots as UX inspiration:

1. The first two screenshots show the mobile CRM experience I want: clean lead cards, simple lead details, clear actions, pipeline stages and bottom navigation.

2. The third screenshot is the visual design reference for the overall theme, colors, spacing, cards, dashboard and professional SaaS appearance.



Do NOT copy the exact branding, logo, text, business names or real-estate-specific fields from the screenshots.



==================================================

1. CORE DESIGN PRINCIPLE

==================================================



The most important requirement is:



KEEP IT SIMPLE.



A normal business owner should understand the CRM immediately without needing training.



Do NOT create:

- complicated dashboards

- too many menus

- unnecessary widgets

- crowded screens

- excessive charts

- complicated forms

- confusing navigation

- enterprise-style complexity



Every screen should have a clear purpose.



The interface should feel:

- modern

- clean

- premium

- friendly

- simple

- fast

- professional

- mobile-first



Think of it as a CRM that a small business owner can open on their phone and understand within seconds.



==================================================

2. RESPONSIVE REQUIREMENT

==================================================



Build the entire application mobile-first.



MOBILE:

The experience should feel like a real mobile application, not a desktop website squeezed onto a phone.



Use:

- large touch-friendly buttons

- comfortable spacing

- swipe-friendly cards where appropriate

- sticky bottom navigation

- floating action buttons where useful

- readable typography

- simple forms

- compact but informative cards

- responsive bottom sheets/modals



DESKTOP/LAPTOP:

The same application must transform into a polished SaaS web portal.



Desktop should use:

- fixed left sidebar

- spacious content area

- responsive cards

- tables where useful

- clean dashboard layout

- proper desktop spacing



Tablet should automatically adapt between the two layouts.



==================================================

3. NAVIGATION STRUCTURE

==================================================



MOBILE MUST HAVE EXACTLY 5 BOTTOM NAVIGATION TABS:



1. Home

2. Leads

3. Deals

4. Tasks

5. More



Do NOT add more than 5 bottom navigation items.



The "More" section should contain secondary features such as:

- Contacts

- Calendar

- Analytics

- Settings

- Help

- Profile

- Subscription



MOBILE BOTTOM NAVIGATION:

- fixed at bottom

- rounded/premium appearance

- easy thumb access

- clear active state

- icons + short labels

- should not cover page content

- respect mobile safe-area spacing



==================================================

4. DESKTOP SIDEBAR

==================================================



DESKTOP/LAPTOP MUST HAVE EXACTLY 8 PRIMARY SIDEBAR ITEMS:



1. Dashboard

2. Leads

3. Contacts

4. Deals

5. Tasks

6. Calendar

7. Analytics

8. Settings



The sidebar should include:

- CRM logo/brand area at top

- primary navigation

- active navigation indicator

- user profile/subscription area at bottom



Do not create additional primary sidebar items.



==================================================

5. GLOBAL VISUAL THEME

==================================================



Use the THIRD uploaded screenshot as the primary visual reference.



Create a clean white/light interface with modern blue and purple accents.



Visual characteristics:

- white/light backgrounds

- deep navy/dark text

- blue primary actions

- subtle purple accent

- very light blue/purple backgrounds for selected cards

- soft borders

- subtle shadows

- rounded cards

- modern icons

- clean typography

- generous whitespace



Avoid:

- excessive gradients

- neon colors

- overly futuristic UI

- glassmorphism everywhere

- excessive animations

- dark complicated dashboards

- overly corporate appearance



The UI should look premium but approachable.



Use a consistent design system throughout the entire application.



==================================================

6. BRAND / PRODUCT STRUCTURE

==================================================



Create the application so the CRM brand name can easily be changed later.



For now use a clean placeholder CRM name such as:



"Occo Flow"



Keep the branding component-based so the logo/name can easily be replaced later.



Do not hard-code branding throughout the application.



==================================================

7. HOME / DASHBOARD

==================================================



Create a simple business-owner dashboard.



MOBILE DASHBOARD SHOULD SHOW:



Greeting:

"Good morning, [Business Owner]"



Small business summary.



Then only the most useful information:



- Total Leads

- New Leads

- Follow-ups Today

- Open Deals



Then:



"Today's Follow-ups"



Show 3–5 simple follow-up cards.



Each card:

- customer name

- phone

- follow-up time

- lead status

- quick Call button

- quick Message button



Then:



"Recent Leads"



Show a few recent leads.



Then a clear:

"+ Add Lead"



floating action button or prominent action.



Do NOT overload the mobile dashboard with charts.



DESKTOP DASHBOARD:



Use a slightly more spacious layout.



Top KPI cards:

- Total Leads

- New Leads

- Follow-ups

- Open Deals



Then:

- Leads overview

- Sales/deal pipeline

- Today's follow-ups

- Recent activity



Keep analytics simple in Version 1.



==================================================

8. LEADS

==================================================



Create the main Leads screen inspired by the first uploaded mobile CRM screenshot.



MOBILE:



Header:

"Leads"



Top-right:

- Filter

- Search



Search field:

"Search leads by name, phone or company..."



Below search, use horizontally scrollable status filters:



All

New

Contacted

Qualified

Follow-up

Won

Lost



Lead cards should be simple and readable.



Each lead card can contain:



Customer name

Phone number

Company/business

Lead source

Status

Next follow-up

Potential value



Quick actions:

- Call

- Message



Example:



Rahul Sharma

+91 XXXXX XXXXX

ABC Enterprises

Website



Qualified

Follow-up: Today

Potential: ₹50,000



Call    Message



Do NOT use real-estate fields such as:

- BHK

- Property type

- Site visit

- Location requirement



The fields must be generic enough for every business.



==================================================

9. ADD LEAD

==================================================



Create a very simple Add Lead experience.



Required fields:



- Name

- Phone

- Email

- Company

- Lead Source

- Status

- Potential Value

- Next Follow-up

- Notes



Optional fields should remain hidden under:

"More Details"



Do NOT create a giant form.



On mobile, use a clean full-screen form or bottom-sheet style.



Primary CTA:



"Save Lead"



==================================================

10. LEAD DETAILS

==================================================



Create a clean Lead Details page inspired by the second uploaded screenshot.



Top section:



Back

Customer Name

Edit

More



Customer card:



Avatar

Name

Phone

Email

Company

Lead Status



Quick action row:



Call

Message

Email



Then:



PIPELINE STAGE



New

Contacted

Qualified

Follow-up

Won

Lost



Allow the user to easily change the stage.



Then:



CUSTOMER INFORMATION



Phone

Email

Company

Source

Potential Value



Then:



NEXT FOLLOW-UP



Date

Time

Reminder



Then:



NOTES & ACTIVITY



Show a simple chronological timeline:



Lead created

Called customer

Note added

Follow-up scheduled

Status changed



Use tabs only where genuinely useful.



Do not make the page complicated.



==================================================

11. CONTACTS

==================================================



Create a simple Contacts section.



Contacts should show:



- Name

- Phone

- Email

- Company

- Last interaction



Search and filter.



A contact can be opened to see its details.



Keep Leads and Contacts logically connected but don't make them confusing.



==================================================

12. DEALS

==================================================



Create a simple Deals/Pipeline screen.



Pipeline stages:



New

Qualified

Proposal

Negotiation

Won

Lost



On mobile:

Use horizontally scrollable stage sections or a simple stage selector.



On desktop:

Use a clean Kanban-style pipeline.



Deal card:



Customer

Deal name

Value

Stage

Expected closing date



Do not overload deal cards.



==================================================

13. TASKS

==================================================



Create a simple Tasks screen.



Categories:



Today

Upcoming

Completed



Task card:



Task title

Customer/Lead

Date

Time

Priority

Complete button



Examples:



"Call Rahul"

"Send quotation"

"Follow up with customer"



Allow:

+ Add Task



==================================================

14. CALENDAR

==================================================



Create a clean calendar for:



- Follow-ups

- Tasks

- Meetings



Mobile:

Use a simple agenda/list-first design.



Desktop:

Use calendar + agenda layout.



Do not make it overly complicated.



==================================================

15. ANALYTICS

==================================================



Version 1 should have basic analytics only.



Show:



Total Leads

New Leads

Converted Leads

Open Deals

Won Deals

Revenue/Potential Revenue



Simple charts:

- Leads over time

- Conversion overview

- Deal pipeline



Do not create complicated social-media analytics.



This is a CRM, not a social media management platform.



==================================================

16. SETTINGS

==================================================



Create a clean Settings page containing:



Business Profile

User Profile

Team

Notifications

CRM Preferences

Lead Statuses

Deal Stages

Subscription

Security

Help



For Version 1, these can be UI-ready pages/settings sections even if backend functionality is implemented later.



==================================================

17. GLOBAL SEARCH

==================================================



Desktop should have a global search field in the top header.



Mobile should have search available inside relevant sections.



Search should eventually support:

- Leads

- Contacts

- Deals

- Tasks



For Version 1, build the UI and interaction structure.



==================================================

18. ADD BUTTON

==================================================



Create a consistent global action system.



The main action should be:



"+ Add"



Depending on the current section:



Leads → Add Lead

Deals → Add Deal

Tasks → Add Task

Contacts → Add Contact



On mobile, use a floating action button where appropriate.



==================================================

19. EMPTY STATES

==================================================



Every major section needs a beautiful empty state.



Example:



"No leads yet"



"Add your first lead and start managing your customer pipeline."



CTA:

"Add Lead"



Do not leave blank white screens.



==================================================

20. RESPONSIVE BEHAVIOR

==================================================



Make sure:



Mobile:

- no horizontal page overflow

- no tiny text

- no desktop tables forced onto mobile

- touch targets minimum approximately 44px

- sticky bottom navigation

- content never hidden behind navigation

- cards stack vertically

- buttons remain accessible

- forms are easy to complete with one hand



Desktop:

- sidebar remains fixed

- content uses available screen width

- cards adapt naturally

- tables can be used where appropriate

- dashboard uses columns/grid

- no excessive empty space



==================================================

21. COMPONENT ARCHITECTURE

==================================================



Build reusable components:



- Button

- Card

- Badge

- Avatar

- SearchBar

- FilterButton

- BottomNavigation

- DesktopSidebar

- Header

- LeadCard

- LeadStatusBadge

- PipelineStage

- DealCard

- TaskCard

- ActivityTimeline

- KPI Card

- Modal

- BottomSheet

- FormField

- EmptyState

- Toast/Notification



Use a consistent component system.



==================================================

22. DATA STRUCTURE PREPARATION

==================================================



Even though Version 1 focuses heavily on the UI, structure the application so it can later connect to a real backend.



Prepare models/interfaces for:



User

Business

Lead

Contact

Deal

Task

Activity

FollowUp

Subscription



Do not use random duplicated data throughout components.



Use centralized mock/demo data for Version 1.



==================================================

23. DEMO DATA

==================================================



Populate the UI with realistic generic business data.



Use different types of businesses in the demo data so the CRM clearly feels universal.



Examples:

- Gym membership lead

- Restaurant catering enquiry

- Website development enquiry

- Real-estate enquiry

- Salon appointment enquiry

- Coaching enquiry

- Automobile enquiry



But don't make the interface dependent on any specific industry.



==================================================

24. UX RULE

==================================================



Always prioritize:



SIMPLE > MORE FEATURES



If a feature makes a screen confusing, hide it under:

"More"



Do not add features just because a normal CRM has them.



The owner should be able to perform the most common actions in 1–3 taps.



Most important actions:



Add Lead

Call

Message

Follow Up

Update Status

Add Note

Create Deal

Complete Task



==================================================

25. PERFORMANCE

==================================================



Keep the application lightweight and fast.



Avoid unnecessary heavy animations.



Use smooth but subtle transitions.



Use lazy loading where appropriate.



Optimize the layout for mobile devices.



==================================================

26. VERSION 1 SCOPE

==================================================



DO NOT implement the complete subscription/payment system yet.



DO NOT implement real phone calling yet.



DO NOT implement real SMS/WhatsApp API yet.



DO NOT implement complicated automation yet.



DO NOT implement advanced AI features yet.



DO NOT overbuild the backend yet.



Version 1 should establish:



1. Complete UI structure

2. Navigation

3. Responsive design

4. Mobile-first experience

5. Desktop portal

6. Dashboard

7. Leads

8. Lead details

9. Contacts

10. Deals

11. Tasks

12. Calendar

13. Analytics

14. Settings

15. Add/edit forms

16. Reusable components

17. Demo data

18. Clean architecture ready for Version 2



==================================================

27. FINAL QUALITY REQUIREMENT

==================================================



Before considering Version 1 complete, test the entire UI at:



- Small Android phone

- Large Android phone

- Tablet

- Laptop

- Desktop



The mobile experience is especially important.



The final result should feel like:



"A simple CRM that any business owner can understand and start using immediately."



NOT:



"A complicated enterprise CRM with hundreds of features."



Keep the interface visually inspired by the uploaded references while creating an original design system.



Build Version 1 carefully and consistently across every screen.

## Project Documentation

Comprehensive documentation has been organized into the [`docs/`](docs/) directory:

1. [01 - Product Requirements Document (PRD)](docs/01_PRD.md)
2. [02 - Technical Architecture & System Design](docs/02_TECHNICAL_ARCHITECTURE.md)
3. [03 - Data Model & API Specification](docs/03_DATA_MODEL_AND_API_SPEC.md)
4. [04 - UI/UX Design System Guidelines](docs/04_UI_UX_DESIGN_SYSTEM.md)
5. [05 - User Manual & Feature Guide](docs/05_USER_MANUAL_AND_FEATURE_GUIDE.md)
6. [06 - Deployment & DevOps Operations Guide](docs/06_DEPLOYMENT_AND_DEVOPS_GUIDE.md)
7. [07 - Security, Compliance & QA Strategy](docs/07_SECURITY_QA_AND_TESTING_STRATEGY.md)

## Development

Prerequisites: Node.js (v18+) and npm.

```sh
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```
