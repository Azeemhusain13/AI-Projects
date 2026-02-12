# excel_handler.py

import pandas as pd


def get_suppliers(brand):

    df = pd.read_excel("suppliers.xlsx")

    row = df[df["Brand"] == brand]

    if row.empty:
        return []

    suppliers = row.iloc[0, 1:].dropna().tolist()

    return suppliers
