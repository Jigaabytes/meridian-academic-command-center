# Meridian — Academic Command Center

A responsive Student Registration and Result Management System for an HTML5, CSS3 and vanilla JavaScript assignment. The visual direction is an academic command center: a dark registry rail, editorial hero panel, live record inspector, results workspace and data-led performance views.

## Run the project

1. Extract the folder.
2. Open `index.html` in a modern browser. For the most reliable local development experience, open the folder in VS Code and use the Live Server extension.
3. Start in the **Overview** view. Use **Register student** to add a student, or open **Student registry** to search, filter, edit and inspect records.
4. Open **Results lab** to select a student, enter marks out of 100 and save. The grade, percentage and pass/fail result are calculated automatically.
5. Open **Performance** to view live class and subject analytics.

## Features

- Responsive layout for desktop, tablet and mobile.
- Student registration with required-field and duplicate-email validation.
- Search by name, student ID, email, programme or phone; filter by programme and semester.
- Profile inspector with contact details and subject-level marks.
- Edit and delete student records.
- Result entry for five subjects, with automatic total, average, grade and pass status.
- Live subject-performance bars and grade distribution.
- Export student records and a performance report to CSV.
- Browser localStorage persistence; records remain after refresh in the same browser.
- Eight sample students for demonstration. They can be edited or deleted.

## Grading rules used in this demo

Each subject is marked out of 100. A student passes when every subject has at least 40 marks. Overall grade: A = 80–100, B = 70–79, C = 60–69, D = 40–59, F = below 40. These are configurable demo rules, not an official university grading policy.

## Technology

- HTML5
- CSS3 (responsive layout, custom design tokens, CSS-based charts)
- Vanilla JavaScript (DOM rendering, calculations, validation and localStorage)

There is no backend or external JavaScript framework. Google Fonts are loaded from the web; if unavailable, the interface uses fallback fonts. Student data is stored in the current browser and is not sent to a server.
