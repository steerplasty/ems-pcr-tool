# EMS PCR Tool

A free, fast web tool for EMS providers to create patient care report narratives.

## How it works
Select checkboxes and options through 15 sections. The narrative preview updates in real time on the right panel. When done, click **Copy Narrative** to paste into your ePCR system.

## Sections
1. Unit & Crew
2. Dispatch
3. Response
4. Scene
5. Initial Impression
6. ABCs
7. Complaint
8. History
9. Head-to-Toe Exam
10. Scenario & Procedures
11. Vitals
12. Medications Given
13. Refusal
14. Transportation
15. Transfer of Care

## Project Structure
```
ems-pcr-tool/
├── index.html       # Main app (all sections)
├── css/
│   └── style.css    # All styles
├── js/
│   └── app.js       # Logic, state, report generation
└── README.md
```

## Local Development
Just open `index.html` in any browser — no build step needed.
