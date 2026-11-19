# HQ release notes

The version in use is shown at the bottom of the sidebar. Newest release first.

## 1.2.0 (19 Nov 2026)

### New

- **Download a user's report as Excel** (SMA-46, SMA-47). Admin and sales only. In the user panel, or the download icon on each row of the Users table. The file covers all entries till the download date:
  - **Summary:** one row per project with quotation, received from client, spent, paid out, still to pay and **cash in hand** (red with a minus sign when negative). Two extra columns show what was received and paid out in the last 7 days. Totals are formulas over the other two sheets.
  - **Expenses:** every expense with its date, category, vendor or labourer, amount, paid, last paid on, to be paid and status (Paid, Part paid, Unpaid). Possible duplicates (same project, payee, amount and date) are flagged.
  - **Income:** every client payment with its date.
- **Copy WhatsApp message.** In the user panel, next to Download report. Copies a short per-project summary to paste into WhatsApp.

### Fixed

- The sidebar and header stay in place, and only the page content scrolls.
- The Dashboard no longer scrolls into empty white space below the page.

### Known issues

- When an expense has both an advance and later payments, the report counts only the payments (the app's People tab rule). The app's project screen adds the advance too, so its Paid till now and Cash balance can differ from the report.

## 1.0.0 (19 Nov 2026)

First versioned release. Everything HQ had at that point:

- **Sign-in:** Google accounts on the HQ whitelist only, with admin, sales and support roles.
- **Dashboard:** total, new, trial and paid users, signups per day, trials ending soon, and Active, 2-day and 1-day user counts.
- **Users:** every app user, 25 per page, with subscription and CRM stage. Filters for Active, 2-day, 1-day, Inactive, Not activated and Trial ending. Admins can delete users.
- **User panel:** details, activity log, stage, owner, tags, follow-up date and notes, with Log a contact and a My follow-ups filter.
- **Activity:** a live feed of what all users do in the app.
- Hosted on Firebase Hosting.
