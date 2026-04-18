# Admin Proof: Notifications Removal

## Expected Behavior

- admin schedule updates still save successfully from `/admin?section=schedules`
- the admin app no longer depends on `/api/notifications` routes for this flow
- schedule edits do not append local notification memo side effects

## Manual Check

- open the admin schedules section and edit a schedule
- confirm the save completes and the schedule state refreshes normally
- confirm no notification bell or `/api/notifications*` traffic is required for the edited flow
