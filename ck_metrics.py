#!/usr/bin/env python3
"""CK-like metrics extraction with one CSV and one HTML visual output."""

import argparse
import csv
import os
import subprocess
import sys
from datetime import datetime

import understand

DEFAULT_EXCLUDES = [
    "node_modules",
    "dist",
    "public/build",
    "ck_reports",
    "qmood_reports",
    ".scannerwork",
]


def is_excluded(path, patterns):
    lower = path.lower()
    return any(p.lower() in lower for p in patterns)


def metric_value(ent, name, default=0.0):
    try:
        value = ent.metric([name]).get(name)
    except Exception:
        return default
    if value is None:
        return default
    return float(value)


def export_csv(path, rows, header):
    with open(path, "w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=header, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def get_efferent_coupling(file_ent, file_map):
    targets = set()
    for ref in file_ent.refs("Use, Call, Import, Include", unique=True):
        target = ref.ent()
        if not target:
            continue
        parent = target.parent()
        if (
            parent
            and parent.longname() in file_map
            and parent.longname() != file_ent.longname()
        ):
            targets.add(parent.longname())
    return float(len(targets))


def get_afferent_coupling(file_ent, file_map):
    sources = set()
    for ent in file_ent.ents("Define, Declare"):
        for ref in ent.refs("Useby, Callby, Importby, Includeby", unique=True):
            source_ent = ref.ent()
            if not source_ent:
                continue
            parent = source_ent.parent()
            if (
                parent
                and parent.longname() in file_map
                and parent.longname() != file_ent.longname()
            ):
                sources.add(parent.longname())
    return float(len(sources))


def build_class_rows(db, excludes):
    rows = []
    classes = db.ents("Class, Struct, Interface")
    for cls in classes:
        parent = cls.parent()
        filepath = parent.longname() if parent else ""
        if filepath and is_excluded(filepath, excludes):
            continue

        wmc = metric_value(cls, "SumCyclomatic")
        dit = metric_value(cls, "MaxInheritanceTree")
        noc = metric_value(cls, "CountClassDerived")
        cbo = metric_value(cls, "CountClassCoupled")
        lcom = metric_value(cls, "PercentLackOfCohesion")

        method_count = metric_value(cls, "CountDeclMethod")
        count_output = metric_value(cls, "CountOutput")
        rfc = method_count + count_output

        risk = (wmc * 0.4) + (cbo * 0.25) + (rfc * 0.2) + (lcom * 0.15)

        rows.append(
            {
                "EntityKind": "Class",
                "Entity": cls.longname(),
                "File": os.path.basename(filepath) if filepath else "",
                "CK_Suite": "WMC,DIT,NOC,CBO,RFC,LCOM",
                "SumCyclomatic": wmc,
                "AvgCyclomatic": (wmc / max(1.0, method_count)),
                "FunctionCount": 0.0,
                "MethodCount": method_count,
                "ClassCount": 1.0,
                "ClassCoupled": cbo,
                "LackOfCohesion": lcom,
                "LackOfCohesionMod": 0.0,
                "MaxInheritanceTree": dit,
                "ClassDerived": noc,
                "CountOutput": count_output,
                "EfferentCoupling": 0.0,
                "AfferentCoupling": 0.0,
                "WMC": wmc,
                "DIT": dit,
                "NOC": noc,
                "CBO": cbo,
                "RFC": rfc,
                "LCOM": lcom,
                "CK_RISK_SCORE": risk,
                "ClassesInModule": 1.0,
            }
        )
    return rows


def build_module_rows(db, excludes):
    files = db.ents("File ~Unknown ~Unresolved")
    file_map = {
        f.longname(): f
        for f in files
        if f.longname() and not is_excluded(f.longname(), excludes)
    }

    rows = []
    for path, f_ent in file_map.items():
        sum_cyc = metric_value(f_ent, "SumCyclomatic")
        avg_cyc = metric_value(f_ent, "AvgCyclomatic")
        fn_count = metric_value(f_ent, "CountDeclFunction")
        method_count = metric_value(f_ent, "CountDeclMethod")
        class_count = metric_value(f_ent, "CountDeclClass")

        class_coupled = metric_value(f_ent, "CountClassCoupled")
        lcom = metric_value(f_ent, "PercentLackOfCohesion")
        lcom_mod = metric_value(f_ent, "PercentLackOfCohesionModified")
        dit = metric_value(f_ent, "MaxInheritanceTree")
        noc = metric_value(f_ent, "CountClassDerived")

        count_output = metric_value(f_ent, "CountOutput")
        ce = get_efferent_coupling(f_ent, file_map)
        ca = get_afferent_coupling(f_ent, file_map)

        wmc = sum_cyc if sum_cyc > 0 else (avg_cyc * max(1.0, fn_count + method_count))
        cbo = class_coupled + ce + ca
        rfc = fn_count + method_count + count_output

        if lcom <= 0 and lcom_mod > 0:
            lcom = lcom_mod

        risk = (wmc * 0.4) + (cbo * 0.25) + (rfc * 0.2) + (lcom * 0.15)

        rows.append(
            {
                "EntityKind": "Module",
                "Entity": os.path.basename(path),
                "File": os.path.basename(path),
                "CK_Suite": "WMC,DIT,NOC,CBO,RFC,LCOM",
                "SumCyclomatic": sum_cyc,
                "AvgCyclomatic": avg_cyc,
                "FunctionCount": fn_count,
                "MethodCount": method_count,
                "ClassCount": class_count,
                "ClassCoupled": class_coupled,
                "LackOfCohesion": lcom,
                "LackOfCohesionMod": lcom_mod,
                "MaxInheritanceTree": dit,
                "ClassDerived": noc,
                "CountOutput": count_output,
                "EfferentCoupling": ce,
                "AfferentCoupling": ca,
                "WMC": wmc,
                "DIT": dit,
                "NOC": noc,
                "CBO": cbo,
                "RFC": rfc,
                "LCOM": lcom,
                "CK_RISK_SCORE": risk,
                "ClassesInModule": class_count,
            }
        )

    return rows


def write_visual(path, rows, mode):
    sorted_rows = sorted(rows, key=lambda r: r["CK_RISK_SCORE"], reverse=True)
    top = sorted_rows[:20]

    avg_risk = sum(r["CK_RISK_SCORE"] for r in rows) / max(1, len(rows))
    max_wmc = max((r["WMC"] for r in rows), default=0.0)
    max_cbo = max((r["CBO"] for r in rows), default=0.0)
    avg_wmc = sum(r["WMC"] for r in rows) / max(1, len(rows))
    avg_dit = sum(r["DIT"] for r in rows) / max(1, len(rows))
    avg_noc = sum(r["NOC"] for r in rows) / max(1, len(rows))
    avg_cbo = sum(r["CBO"] for r in rows) / max(1, len(rows))
    avg_rfc = sum(r["RFC"] for r in rows) / max(1, len(rows))
    avg_lcom = sum(r["LCOM"] for r in rows) / max(1, len(rows))

    bars = []
    base = max((r["CK_RISK_SCORE"] for r in top), default=1.0)
    base = base if base > 0 else 1.0

    for row in top:
        width = (row["CK_RISK_SCORE"] / base) * 100.0
        bars.append(
            "<tr>"
            f"<td>{row['Entity']}</td>"
            f"<td>{row['WMC']:.2f}</td>"
            f"<td>{row['DIT']:.2f}</td>"
            f"<td>{row['NOC']:.2f}</td>"
            f"<td>{row['CBO']:.2f}</td>"
            f"<td>{row.get('AfferentCoupling', 0.0):.2f}</td>"
            f"<td>{row.get('EfferentCoupling', 0.0):.2f}</td>"
            f"<td>{row['RFC']:.2f}</td>"
            f"<td>{row['LCOM']:.2f}</td>"
            f"<td>{row['CK_RISK_SCORE']:.2f}</td>"
            f"<td><div class='bar'><span style='width:{width:.2f}%'></span></div></td>"
            "</tr>"
        )

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    html = f"""<!doctype html>
<html>
<head>
  <meta charset='utf-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1'>
  <title>CK-like Visual</title>
  <style>
    body {{ font-family: Helvetica, Arial, sans-serif; margin: 24px; color: #1f2937; }}
    h1 {{ margin-bottom: 6px; }}
    .meta {{ color: #6b7280; margin-bottom: 18px; }}
    .cards {{ display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 18px; }}
    .card {{ border: 1px solid #d1d5db; border-radius: 8px; padding: 10px 14px; min-width: 170px; }}
    .label {{ color: #6b7280; font-size: 12px; text-transform: uppercase; }}
    .value {{ font-size: 20px; font-weight: 700; margin-top: 3px; }}
    table {{ width: 100%; border-collapse: collapse; }}
    th, td {{ border-bottom: 1px solid #e5e7eb; text-align: left; padding: 8px; font-size: 14px; }}
    .bar {{ width: 100%; background: #fef3c7; border-radius: 999px; height: 10px; }}
    .bar span {{ display: block; height: 10px; background: #d97706; border-radius: 999px; }}
  </style>
</head>
<body>
  <h1>CK-like Metrics Visual</h1>
  <div class='meta'>Generated {now} · Mode: {mode}</div>
  <div class='cards'>
    <div class='card'><div class='label'>Entities</div><div class='value'>{len(rows)}</div></div>
    <div class='card'><div class='label'>Average Risk</div><div class='value'>{avg_risk:.2f}</div></div>
    <div class='card'><div class='label'>Avg WMC</div><div class='value'>{avg_wmc:.2f}</div></div>
    <div class='card'><div class='label'>Avg DIT</div><div class='value'>{avg_dit:.2f}</div></div>
    <div class='card'><div class='label'>Avg NOC</div><div class='value'>{avg_noc:.2f}</div></div>
    <div class='card'><div class='label'>Avg CBO</div><div class='value'>{avg_cbo:.2f}</div></div>
    <div class='card'><div class='label'>Avg RFC</div><div class='value'>{avg_rfc:.2f}</div></div>
    <div class='card'><div class='label'>Avg LCOM</div><div class='value'>{avg_lcom:.2f}</div></div>
    <div class='card'><div class='label'>Max WMC</div><div class='value'>{max_wmc:.2f}</div></div>
    <div class='card'><div class='label'>Max CBO</div><div class='value'>{max_cbo:.2f}</div></div>
  </div>
    <h2>Top Risk Entities</h2>
  <div style='overflow-x:auto'>
  <table>
        <thead><tr><th>Entity</th><th>WMC</th><th>DIT</th><th>NOC</th><th>CBO</th><th>Ca</th><th>Ce</th><th>RFC</th><th>LCOM</th><th>Risk</th><th>Relative</th></tr></thead>
    <tbody>
      {''.join(bars)}
    </tbody>
  </table>
  </div>
</body>
</html>
"""
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(html)


def find_und_database(directory):
    for name in os.listdir(directory):
        if name.endswith(".und") and os.path.isdir(os.path.join(directory, name)):
            return os.path.join(directory, name)
    return None


def maybe_analyze(db_path):
    cmd = [
        "/Applications/Understand.app/Contents/MacOS/und",
        "analyze",
        "-all",
        "-db",
        db_path,
    ]
    return subprocess.run(cmd, check=False).returncode


def main():
    parser = argparse.ArgumentParser(
        description="Generate CK-like metrics (one CSV + one HTML visual)."
    )
    parser.add_argument("--db", help="Path to .und database (auto-detect if omitted)")
    parser.add_argument(
        "--analyze",
        action="store_true",
        help="Run Understand analyze before extraction",
    )
    parser.add_argument("--output", default="./ck_reports", help="Output directory")
    parser.add_argument(
        "--exclude",
        action="append",
        default=list(DEFAULT_EXCLUDES),
        help="Exclude pattern (repeatable)",
    )
    args = parser.parse_args()

    db_path = args.db or find_und_database(os.getcwd())
    if not db_path:
        print("ERROR: No .und database found.")
        sys.exit(1)

    if args.analyze:
        print("[1/4] Running Understand analyze...")
        rc = maybe_analyze(db_path)
        if rc != 0:
            print("WARN: analyze exit code", rc)

    print("[2/4] Opening database...")
    db = understand.open(db_path)

    print("[3/4] Computing CK-like metrics...")
    rows = build_module_rows(db, args.exclude)
    mode = "module"

    if not rows:
        print("ERROR: no eligible entities found")
        db.close()
        sys.exit(1)

    os.makedirs(args.output, exist_ok=True)
    csv_path = os.path.join(args.output, "ck_metrics.csv")
    html_path = os.path.join(args.output, "ck_visual.html")

    print("[4/4] Writing outputs...")
    header = [
        "EntityKind",
        "Entity",
        "File",
        "CK_Suite",
        "SumCyclomatic",
        "AvgCyclomatic",
        "FunctionCount",
        "MethodCount",
        "ClassCount",
        "ClassCoupled",
        "LackOfCohesion",
        "LackOfCohesionMod",
        "MaxInheritanceTree",
        "ClassDerived",
        "CountOutput",
        "EfferentCoupling",
        "AfferentCoupling",
        "WMC",
        "DIT",
        "NOC",
        "CBO",
        "RFC",
        "LCOM",
        "CK_RISK_SCORE",
        "ClassesInModule",
    ]
    export_csv(csv_path, rows, header)
    write_visual(html_path, rows, mode)

    db.close()
    print("Done")
    print("  Mode:", mode)
    print("  CSV:", os.path.abspath(csv_path))
    print("  Visual:", os.path.abspath(html_path))


if __name__ == "__main__":
    main()
