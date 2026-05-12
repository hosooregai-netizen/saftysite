# Public Share Audit

## Weekly audit

- active share count
- expired but not revoked count
- anyone_with_link count
- editor role public share count
- shares pointing to deleted/trashed item
- invalid access attempts
- outside root access attempts

## Risk flags

| Flag | Severity |
|---|---|
| expired share still accessible | P0 |
| revoked share still accessible | P0 |
| outside root access allowed | P0 |
| public editor enabled unexpectedly | P1 |
| deleted item still shared | P1 |

## Remediation

- revoke risky shares
- notify owner
- log incident if data exposure possible
- update webhard known issue
