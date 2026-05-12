# 적용 순서

## 통합 적용

가장 간단한 방식이다.

```bash
unzip service_improvements_01_to_15_apply_overlay.zip
bash scripts/service-improvements/run-final-qa.sh
```

## 개별 적용

문제가 생겼을 때는 아래 순서로 개별 overlay를 적용한다.

```bash
unzip service_improvement_01_source_recovery_clean_build_overlay.zip
unzip service_improvement_02_mailbox_state_consistency_overlay.zip
unzip service_improvement_03_mailbox_threepane_compose_overlay.zip
unzip service_improvement_04_gmail_send_sync_overlay.zip
unzip service_improvement_05_mailbox_sync_reconnect_overlay.zip
unzip service_improvement_06_webhard_permission_public_share_overlay.zip
unzip service_improvement_07_webhard_share_dialog_badges_overlay.zip
unzip service_improvement_08_report_billing_auth_gate_overlay.zip
unzip service_improvement_09_photo_album_grid_filters_overlay.zip
unzip service_improvement_10_headquarters_sites_directory_ui_overlay.zip
unzip service_improvement_11_report_guided_upload_review_overlay.zip
unzip service_improvement_12_report_review_export_ux_overlay.zip
unzip service_improvement_13_report_list_status_filters_overlay.zip
unzip service_improvement_14_account_settings_guest_billing_overlay.zip
unzip service_improvement_15_final_build_route_smoke_qa_overlay.zip
```

## 적용 후 검증

```bash
rm -rf apps/web/.next
cd apps/web
npm run build

cd ../api
python -m compileall app
```
