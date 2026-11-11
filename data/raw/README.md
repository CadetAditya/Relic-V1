# RELIC Synthetic Raw Tables

All rows in this package are synthetic and do not represent real people, bank accounts, transactions, ATMs, or complaints.

## Raw tables included
1. complaints.csv — complaint records matching the schema supplied in Raw tables.pdf.
2. accounts.csv — privacy-preserving account identifiers and account attributes.
3. transactions.csv — sender/receiver transaction history with direction, amount, timestamp, status, and balance fields.
4. withdrawals.csv — withdrawal history linked to account, ATM, amount, time, status, and fraud_linked flag.
5. atm_locations.csv — ATM coordinates and location metadata.

## Patterns intentionally included for ML prototyping
- Accounts have stable preferred ATMs within their registered city.
- Successful withdrawals tend to occur during account-specific habitual hours.
- Fraud-linked/mule-like accounts have more inbound credits and higher transaction amounts.
- In synthetic fraud episodes, a successful incoming credit is followed by a successful withdrawal after a short delay.
- The withdrawal is more likely to occur at one of the account's preferred ATMs.
- Complaints often arrive shortly after suspicious transfers.
- Each account has multiple historical transactions and withdrawals so derived features can be computed from prior history.

## Important safeguards
- These patterns are deliberately synthetic and simplified; they are not evidence of real criminal behaviour.
- The raw tables do not contain derived model features. Build those from events strictly before each prediction timestamp.
- Do not use future withdrawals, future transactions, complaint outcomes unavailable at prediction time, or the target ATM as input features.
- For supervised ATM prediction, construct one prediction event per eligible complaint/account at time T, then label the actual next successful withdrawal after T. Generate candidate ATM rows and split by prediction timestamp, keeping each prediction event entirely in one split.
- `fraud_linked` and `is_fraud_confirmed` are historical labels for prototyping only; avoid using labels that would not have been known at prediction time.
- Real deployment requires authorized and representative data, privacy/legal review, and independent evaluation.
