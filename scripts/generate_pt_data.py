#!/usr/bin/env python3
"""Generate the HVAC Pro saturation tables with CoolProp 8.0.0.

Mixture fractions are mole fractions from the official CoolProp mixture list.
Rows contain [temperature °C, bubble pressure bar(abs), dew pressure bar(abs)].
"""

from __future__ import annotations

import json
from pathlib import Path

import CoolProp
from CoolProp.CoolProp import PropsSI


if CoolProp.__version__ != "8.0.0":
    raise RuntimeError(f"CoolProp 8.0.0 required, found {CoolProp.__version__}")


FLUIDS = {
    "R32": ("R32", -50, 65),
    "R410A": ("R410A", -50, 65),
    "R134a": ("R134a", -40, 80),
    "R404A": ("R404A", -50, 55),
    "R407C": ("R407C", -40, 60),
    "R290": ("R290", -40, 70),
    "R600a": ("R600a", -30, 70),
    "R1234yf": ("R1234yf", -30, 80),
    "R22": ("R22", -50, 70),
    "R744": ("R744", -50, 25),
    # CoolProp 8.0.0 has a saturation-solver gap above 56 °C for this mixture;
    # stop before that gap instead of inventing or interpolating missing values.
    "R454B": ("HEOS::R32[0.829248]&R1234yf[0.170752]", -50, 56),
    "R454C": ("HEOS::R32[0.37515]&R1234yf[0.62485]", -50, 70),
    "R448A": ("HEOS::R32[0.431218]&R125[0.186914]&R1234yf[0.151319]&R134a[0.177587]&R1234ze(E)[0.0529617]", -50, 60),
    "R449A": ("HEOS::R32[0.407365]&R125[0.179481]&R1234yf[0.193481]&R134a[0.219673]", -50, 60),
}


def rounded(value: float) -> float:
    return round(value, 7)


def build_rows(fluid: str, minimum_c: float, maximum_c: float) -> list[list[float]]:
    rows: list[list[float]] = []
    count = round((maximum_c - minimum_c) * 2)
    for index in range(count + 1):
        temperature_c = minimum_c + index * 0.5
        temperature_k = temperature_c + 273.15
        bubble_bar_abs = PropsSI("P", "T", temperature_k, "Q", 0, fluid) / 100_000
        dew_bar_abs = PropsSI("P", "T", temperature_k, "Q", 1, fluid) / 100_000
        rows.append([temperature_c, rounded(bubble_bar_abs), rounded(dew_bar_abs)])
    return rows


data = {name: build_rows(fluid, minimum, maximum) for name, (fluid, minimum, maximum) in FLUIDS.items()}
target = Path(__file__).resolve().parents[1] / "domain" / "ptData.ts"
payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
target.write_text(
    "// Generated with CoolProp 8.0.0. Mixture compositions follow the official CoolProp mixture list.\n"
    "// Rows: [temperature °C, bubble pressure bar(abs), dew pressure bar(abs)].\n"
    f"export const PT_SATURATION_DATA = {payload} as const;\n\n"
    "export type RefrigerantId = keyof typeof PT_SATURATION_DATA;\n",
    encoding="utf-8",
)
print(target)
