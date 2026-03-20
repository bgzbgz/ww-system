import os
import pytest
import openpyxl

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")
os.makedirs(FIXTURES_DIR, exist_ok=True)

def make_valid_xlsx():
    path = os.path.join(FIXTURES_DIR, "valid.xlsx")
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(["Full Name", "Email", "Company", "Position"])
    ws.append(["María García", "m.garcia@banco.com", "Banco Agrícola", "Director"])
    ws.append(["Carlos López", "c.lopez@siman.com", "Almacenes Siman", "CEO"])
    ws.append(["Ana Rodríguez", "", "Applaudo", ""])  # missing email
    wb.save(path)
    return path

def make_missing_col_xlsx():
    path = os.path.join(FIXTURES_DIR, "missing_col.xlsx")
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(["Nombre", "Correo", "Empresa"])  # wrong column names
    ws.append(["María García", "m.garcia@banco.com", "Banco Agrícola"])
    wb.save(path)
    return path

# Generate fixtures at collection time
make_valid_xlsx()
make_missing_col_xlsx()
