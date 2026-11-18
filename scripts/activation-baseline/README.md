# Activation baseline

Activation, conversion and habit by sign-up cohort, read from Firestore (SMA-26). Re-run after each release to compare cohorts.

The script is **read-only**. It only calls `get()` and `listUsers()`. Run it with a service account that can only read, so a bug can't write either.

## Run it

1. In Google Cloud IAM for `smart-hisab-88aa8`, create a service account with only these roles:
   - `Cloud Datastore Viewer` (`roles/datastore.viewer`)
   - `Firebase Authentication Viewer` (`roles/firebaseauth.viewer`)
2. Download its JSON key outside the repo, or into this folder (`scripts/**/*.json` is git-ignored). Never paste the key in chat.
3. Add internal or test accounts to `exclude.txt`. HQ staff in `hq_users` are excluded automatically.
4. Run:

```sh
GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json npm run baseline -- --from 2026-09-29 --group week
```

| Option | Meaning |
| --- | --- |
| `--from` | First sign-up date to include (IST, inclusive). Leave it out for all users. |
| `--to` | Sign-up date to stop at (IST, exclusive). Leave it out for up to now. |
| `--group` | `week` (Monday start, IST) or `month`. Use `month` when weekly cohorts are small. |

Output goes to `out/` (git-ignored):

- `cohorts.csv` has one row per cohort.
- `users.csv` has one row per user, by user ID only (no names, emails or phones), for spot checks.

## Metric definitions

| Column | Definition |
| --- | --- |
| `cohort` | Sign-up week (Monday date) or month, in IST. |
| `users` | Users who signed up in the cohort, excluding internal and test accounts. |
| `project_24h_pct` | % of users with a project `createdAt` within 24 hours of sign-up. |
| `expense_24h_pct` | % of users with an expense `createdAt` within 24 hours of sign-up. |
| `trial_ended_users` | Users whose trial ended at least 14 days ago, so their conversion is known. |
| `paid_pct` | Of those, % with a `payment_history` doc (`status: 'paid'`) made before trial end + 14 days. Users who paid early count as paid. |
| `habit_users` | Users who signed up at least 30 days ago. |
| `habit_median_days` | Median number of distinct IST days with an expense logged in the first 30 days after sign-up. |
| `habit_3plus_days_pct` | % of `habit_users` who logged expenses on 3 or more days in their first 30 days. |
| `small_cohort` | `yes` when the cohort has fewer than 20 users. Read it with care, or group by month. |

**Sign-up time** is the Firebase Auth creation time. If that's missing it falls back to `subscriptions.trialStartDate`, then `users.createdAt`. `users.createdAt` comes from the phone's clock, so it's the last resort.

**Event times** use the server `createdAt` on projects, expenses and payments, never the dates users type in (`date`, `startDate`), which can be backdated.

## Known limits

- **Deleted data is gone.** Deleted expenses, projects and accounts aren't counted, so activation and habit are slightly undercounted.
- **Conversion needs time.** The trial is 3 months, plus 14 days of grace here. A cohort has `paid_pct` only once its trials have ended. v1.4.0 cohorts (from 2026-09-29) start reporting it in mid-January 2027. Until then, earlier cohorts are the conversion baseline.
- **The app version isn't stored per user.** A "v1.4.0 cohort" means signing up between the v1.4.0 release (2026-09-29) and the v1.5.0 release.
- **No onboarding drop-off.** These numbers can't show where users drop off during onboarding. In-app event tracking (v1.5.1) covers that.
