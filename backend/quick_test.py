#!/usr/bin/env python3
"""
Quick test to verify the date ranges are working correctly
"""

from datetime import datetime, timedelta

# Test the date calculations
current_date = datetime(2024, 9, 28)
start_date = datetime(2024, 9, 22, 0, 0, 0)
end_date = datetime(2024, 9, 28, 23, 59, 59, 999999)

print("Date Range Test:")
print(f"Current Date: {current_date}")
print(f"Start Date (7 days ago): {start_date}")
print(f"End Date: {end_date}")
print(f"Date Range: {(end_date - start_date).days + 1} days")

# Generate the expected date range for charts
print("\nExpected Chart Dates:")
for i in range(7):
    chart_date = start_date + timedelta(days=i)
    date_str = chart_date.strftime('%Y-%m-%d')
    print(f"Day {i+1}: {date_str}")

print("\nSample order date range (last 30 days):")
for days_ago in [0, 5, 10, 15, 20, 25, 30]:
    order_date = current_date - timedelta(days=days_ago)
    print(f"{days_ago} days ago: {order_date.strftime('%Y-%m-%d')}")
