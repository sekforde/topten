App Concept: Family Top 10

Overview:
A lightweight, link-based web app where families (or small groups) can collaboratively build and rank “Top 10” lists asynchronously — movies, meals, trips, anything — using simple 0–5 scoring against custom criteria. No accounts, no logins, just shared participation.

It should be developed "mobile first" as most users will be voting on their phones.

⸻

Core Features
	1.	Create a List
	•	User names the list (e.g. “Family Holiday Ideas”).
	•	Defines one or more criteria (e.g. Cost, Fun, Weather, Ease of Travel).
	•	Receives a shareable link to send to family members.
	2.	Join a List
	•	Others open the shared link.
	•	Enter a simple display name (no registration).
	•	Their identity is stored locally via cookie or browser token.
	3.	Add Items
	•	Anyone can add new items to the list (e.g. “Italy”, “Scotland”, “Iceland”).
	•	Items remain editable until locked by the list creator.
	4.	Rate Items
	•	Members rate each item 0–5 on each defined criterion, or mark “No experience” to skip.
	•	Users can rate only items they know; missing scores are ignored in averages.
	5.	Rank & Display
	•	Each item displays an average score (simple mean of all valid ratings).
	•	Show who has rated (e.g., “4 of 6 family members have voted”).
	•	Top 10 automatically updates as new votes come in.
	•	Option to filter:
	•	“Only items I’ve rated”
	•	“Hide items I can’t rate”
	•	“Show only my votes”
	6.	Fairness & Confidence
	•	Items with fewer ratings can be marked as “low confidence” (e.g., “2 votes only”).
	•	A setting can hide items until they have a minimum number of votes.
	7.	Owner Controls (via cookie-based owner token)
	•	Lock or edit criteria.
	•	Remove or hide items.
	•	Optionally send reminders (future feature).

⸻

Tech Outline
	•	Frontend: Next.js (React + Tailwind)
	•	Backend: Vercel KV or Supabase (for simple persistence)
	•	Identity: Per-list token (stored locally, not global accounts)
	•	Ranking Formula:

Item score = (sum of all rating values) / (count of all rating values)


	•	Optional future features: email or push reminders, comments per item, exporting Top 10 as image or share link.

⸻

Example User Flow
	1.	Alice creates a “Top 10 Family Holiday Ideas” list with criteria “Fun”, “Cost”, and “Ease of Travel.”
	2.	She shares the link with her family.
	3.	Each person joins with a name like “Dad,” “Mum,” “Martha,” “Archie.”
	4.	They each add ideas (e.g., “Portugal”, “Lake District”).
	5.	Everyone rates what they know, skipping places they haven’t been.
	6.	The app calculates averages and displays the live Top 10.

