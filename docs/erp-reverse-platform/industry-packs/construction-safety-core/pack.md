# Industry Pack: Construction Safety Core

Industry Pack ID: `construction-safety-core`

## Purpose

Provide the construction-safety flavored policy, vocabulary, and compliance layer on top of the
starter reusable ERP modules.

## Base Modules

- `operations-dashboard.queue-overview`
- `operations-dashboard.analytics`
- `work-item.index-and-filter`
- `work-item.create-dialog`
- `periodic-report.source-sync`
- `document-output.export-and-reuse`
- `asset-review.photo-workbench`

## Policy Overrides

- `dashboard.queueDefinitions`
- `dashboard.exportColumns`
- `periodicReport.sourcePriority`
- `asset.reviewFlags`
- `document.approvalStampRules`

## Vocabulary Overrides

- `work item` -> `기술지도 보고서`
- `periodic report` -> `분기 보고서`
- `asset review` -> `사진 관리`

## Compliance Rules

- quarterly report output must preserve construction-safety section ordering
- photo review keeps site/round context because downstream reports reuse the same assets
- dashboard export columns favor operational queue summaries over raw transactional detail

## Default Tenant Config

- `dashboard.defaultLandingSection`
- `periodicReport.defaultTemplate`
- `document.exportBranding`
- `photoReview.defaultFilter`

