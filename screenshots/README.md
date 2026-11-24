# Screenshot checklist

This folder holds the images referenced by [README.md](../README.md#9-screenshots). **The PNG files are placeholders to be captured**; they are not committed yet. Capture them from a clean local run (frontend at `http://localhost:5173`, backend at `http://localhost:5000/api`) before publishing a release.

## Capture guidelines

- Use a seeded demo account with sample tasks so charts and tables are non-empty but contain no real personal data.
- Hide or blur real email addresses, tokens, and browser password managers.
- Use a consistent viewport and browser zoom. Suggested desktop size: 1440 × 900.
- Use light mode unless a screenshot is explicitly about dark mode.
- Save as PNG with the exact filenames below.
- After capturing, verify each image renders in the README table.

## Required screenshots

| # | Filename | Viewport | What it should show |
| --- | --- | --- | --- |
| 1 | `dashboard.png` | Desktop 1440 × 900 | Signed-in Dashboard page: navigation sidebar, stat cards (total/completed/pending/in-progress/overdue, completion rate), status/priority/category charts, recent tasks, and upcoming deadlines. |
| 2 | `tasks.png` | Desktop 1440 × 900 | All Tasks page: search box, status/priority/category filters, sort controls, task rows or cards with status/priority badges, and pagination controls. |
| 3 | `login.png` | Desktop 1440 × 900 | Public Login page: TaskFlow branding, email and password fields, sign-in button, and link to registration. No error toast or entered credentials. |
| 4 | `mobile.png` | Mobile ~390 × 844 | Any signed-in page with the responsive navigation drawer open, showing that the sidebar collapses and menu items remain reachable at a narrow width. |

## Optional additional captures

| Filename | What it shows |
| --- | --- |
| `landing.png` | Public landing page and call-to-action |
| `register.png` | Registration form with validation hints |
| `task-detail.png` | Task Details page with all stored fields |
| `create-task.png` | Create Task page or quick-create modal |
| `profile.png` | Profile/settings page (name, email, password change) |
| `dark-mode.png` | Dashboard or Tasks page in dark mode |

## Capture → README mapping

```markdown
![Dashboard](screenshots/dashboard.png)
![All tasks](screenshots/tasks.png)
![Login](screenshots/login.png)
![Mobile navigation](screenshots/mobile.png)
```

Keep filenames stable: the README links to these exact paths.
