from __future__ import annotations

import os


def _split_csv(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


FREE_TRIAL_CREDITS = 2
EXPORT_PRICE_KRW = 3000
BILLING_PACKAGES = {
    "starter-10": {"credits": 10, "amount_krw": 30000},
    "team-30": {"credits": 30, "amount_krw": 90000},
    "agency-100": {"credits": 100, "amount_krw": 300000},
}

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "saftysite_apps")
APP_BASE_URL = os.getenv("APP_BASE_URL", "http://127.0.0.1:3000")
TOSS_PAYMENTS_API_BASE_URL = os.getenv("TOSS_PAYMENTS_API_BASE_URL", "https://api.tosspayments.com").strip()
TOSS_PAYMENTS_SECRET_KEY = os.getenv("TOSS_PAYMENTS_SECRET_KEY", "").strip()

GOOGLE_MAIL_CLIENT_ID = os.getenv("GOOGLE_MAIL_CLIENT_ID", "").strip()
GOOGLE_MAIL_CLIENT_SECRET = os.getenv("GOOGLE_MAIL_CLIENT_SECRET", "").strip()
MAIL_ACCOUNT_TOKEN_SECRET = os.getenv(
    "MAIL_ACCOUNT_TOKEN_SECRET",
    GOOGLE_MAIL_CLIENT_SECRET or os.getenv("GOOGLE_APP_CLIENT_SECRET", "").strip(),
).strip()
GOOGLE_MAIL_ALLOWED_REDIRECT_URIS = _split_csv(
    os.getenv("GOOGLE_MAIL_ALLOWED_REDIRECT_URIS", "")
)

GOOGLE_APP_CLIENT_ID = os.getenv("GOOGLE_APP_CLIENT_ID", "").strip()
GOOGLE_APP_CLIENT_SECRET = os.getenv("GOOGLE_APP_CLIENT_SECRET", "").strip()
GOOGLE_APP_ALLOWED_REDIRECT_URIS = _split_csv(
    os.getenv("GOOGLE_APP_ALLOWED_REDIRECT_URIS", "")
)

NAVER_MAIL_CLIENT_ID = os.getenv("NAVER_MAIL_CLIENT_ID", "").strip()
NAVER_MAIL_CLIENT_SECRET = os.getenv("NAVER_MAIL_CLIENT_SECRET", "").strip()
NAVER_MAIL_ALLOWED_REDIRECT_URIS = _split_csv(
    os.getenv("NAVER_MAIL_ALLOWED_REDIRECT_URIS", "")
)

NAVER_WORKS_CLIENT_ID = os.getenv("NAVER_WORKS_CLIENT_ID", "").strip()
NAVER_WORKS_CLIENT_SECRET = os.getenv("NAVER_WORKS_CLIENT_SECRET", "").strip()
NAVER_WORKS_ALLOWED_REDIRECT_URIS = _split_csv(
    os.getenv("NAVER_WORKS_ALLOWED_REDIRECT_URIS", "")
)
