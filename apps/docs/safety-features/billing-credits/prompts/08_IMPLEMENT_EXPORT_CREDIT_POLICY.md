# 08_IMPLEMENT_EXPORT_CREDIT_POLICY

```text
보고서별 최초 final export 성공 시 1 credit만 차감하고 후속 PDF/HWPX 출력은 추가 차감하지 않게 하라.

대상:
- apps/api/app/main.py
- apps/api/app/services/credits.py
- apps/api/app/models.py

요구사항:
1. final_export_consumed=false인 첫 export에서만 credit 차감.
2. ReportExport.first_charge_applied 정확히 기록.
3. balance 부족 시 export 실패.
4. 같은 report 재출력은 추가 차감하지 않음.
```
