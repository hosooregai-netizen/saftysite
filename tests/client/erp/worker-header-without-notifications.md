# ERP Proof: Worker Header Without Notifications

## Expected Behavior

- worker pages still render the shared header with menu, account, and logout actions
- the header no longer renders the notification bell or polls notification endpoints
- worker schedule edits continue to save without notification memo fan-out

## Manual Check

- sign in as a worker and open the site list or site hub
- confirm the header renders without a notification bell while menu and logout still work
- edit a worker-visible schedule and confirm the save succeeds normally
