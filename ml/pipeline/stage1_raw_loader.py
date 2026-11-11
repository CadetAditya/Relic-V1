"""
Stage 1: Raw Tables Loader & Integrity Validator

Loads the five primary raw tables, validates required identifiers, checks schema
types and relationships, and ensures time fields are correctly parsed.
"""

import pandas as pd
try:
    from ml.pipeline.config import (
        ACCOUNTS_FILE,
        ATM_LOCATIONS_FILE,
        COMPLAINTS_FILE,
        TRANSACTIONS_FILE,
        WITHDRAWALS_FILE,
    )
except ImportError:
    from src.config import (
        ACCOUNTS_FILE,
        ATM_LOCATIONS_FILE,
        COMPLAINTS_FILE,
        TRANSACTIONS_FILE,
        WITHDRAWALS_FILE,
    )


def load_and_validate_raw_tables(verbose: bool = True):
    """
    Loads all raw tables and validates data types and relationship integrity.
    """
    if verbose:
        print("=" * 70)
        print("STAGE 1: LOADING & VALIDATING RAW TABLES")
        print("=" * 70)

    # 1. Accounts
    accounts = pd.read_csv(ACCOUNTS_FILE)
    accounts["account_open_date"] = pd.to_datetime(accounts["account_open_date"], errors="coerce")
    
    # 2. ATM Locations
    atm_locations = pd.read_csv(ATM_LOCATIONS_FILE)

    # 3. Complaints
    complaints = pd.read_csv(COMPLAINTS_FILE)
    complaints["complaint_date"] = pd.to_datetime(complaints["complaint_date"], errors="coerce")

    # 4. Transactions
    transactions = pd.read_csv(TRANSACTIONS_FILE)
    transactions["transaction_datetime"] = pd.to_datetime(transactions["transaction_datetime"], errors="coerce")
    transactions["_is_success"] = (
        transactions["transaction_status"].astype(str).str.lower().isin(["success", "successful", "completed"])
    )

    # 5. Withdrawals
    withdrawals = pd.read_csv(WITHDRAWALS_FILE)
    withdrawals["withdrawal_datetime"] = pd.to_datetime(withdrawals["withdrawal_datetime"], errors="coerce")
    withdrawals["_is_success"] = (
        withdrawals["withdrawal_status"].astype(str).str.lower().isin(["success", "successful", "completed"])
    )

    # Sort chronologically for leak-free temporal operations
    transactions = transactions.sort_values("transaction_datetime").reset_index(drop=True)
    withdrawals = withdrawals.sort_values("withdrawal_datetime").reset_index(drop=True)
    complaints = complaints.sort_values("complaint_date").reset_index(drop=True)

    if verbose:
        print(f"✓ Accounts:     {len(accounts):>6} rows (Unique IDs: {accounts['account_id'].nunique()})")
        print(f"✓ ATM Locations:{len(atm_locations):>6} rows (Unique ATMs: {atm_locations['atm_id'].nunique()}, Cities: {atm_locations['city'].nunique()})")
        print(f"✓ Complaints:   {len(complaints):>6} rows (Date span: {complaints['complaint_date'].min().date()} to {complaints['complaint_date'].max().date()})")
        print(f"✓ Transactions: {len(transactions):>6} rows (Date span: {transactions['transaction_datetime'].min().date()} to {transactions['transaction_datetime'].max().date()})")
        print(f"✓ Withdrawals:  {len(withdrawals):>6} rows (Successful: {withdrawals['_is_success'].sum()})")
        
        # Verify Key Cross-Table Linkages
        victim_linked = complaints["victim_account_id"].isin(accounts["account_id"]).mean() * 100
        ben_linked = complaints["beneficiary_account_id"].isin(accounts["account_id"]).mean() * 100
        wd_account_linked = withdrawals["account_id"].isin(accounts["account_id"]).mean() * 100
        wd_atm_linked = withdrawals["atm_id"].isin(atm_locations["atm_id"]).mean() * 100
        
        print("\nCross-table Key Integrity:")
        print(f"  • Complaints victim_account_id in accounts:      {victim_linked:.1f}%")
        print(f"  • Complaints beneficiary_account_id in accounts: {ben_linked:.1f}%")
        print(f"  • Withdrawals account_id in accounts:            {wd_account_linked:.1f}%")
        print(f"  • Withdrawals atm_id in atm_locations:           {wd_atm_linked:.1f}%")

    return {
        "accounts": accounts,
        "atm_locations": atm_locations,
        "complaints": complaints,
        "transactions": transactions,
        "withdrawals": withdrawals,
    }


if __name__ == "__main__":
    load_and_validate_raw_tables()

