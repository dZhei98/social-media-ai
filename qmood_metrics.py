#!/usr/bin/env python3
"""QMOOD-like metrics extraction (one CSV + one HTML visual).

This script outputs the full QMOOD metric set:
Design properties:
- DSC, NOH, ANA, DAM, DCC, CAM, MOA, MFA, NOP, CIS, NOM
Quality attributes:
- Reusability, Flexibility, Understandability, Functionality,
  Extendibility, Effectiveness

For non-OO-heavy codebases, these are computed from module-level proxies.
"""

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


def minmax_normalize(rows, key):
    values = [r[key] for r in rows]
    lo = min(values)
    hi = max(values)
    if hi == lo:
        for row in rows:
            row[key + "_N"] = 0.0
        return
    span = hi - lo
    for row in rows:
        row[key + "_N"] = (row[key] - lo) / span


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


def build_rows(db, excludes):
    files = db.ents("File ~Unknown ~Unresolved")
    file_map = {
        f.longname(): f
        for f in files
        if f.longname() and not is_excluded(f.longname(), excludes)
    }

    rows = []
    for path, f_ent in file_map.items():
        file_name = os.path.basename(path)

        loc = metric_value(f_ent, "CountLineCode")
        fn_count = metric_value(f_ent, "CountDeclFunction")
        class_count = metric_value(f_ent, "CountDeclClass")
        method_count = metric_value(f_ent, "CountDeclMethod")
        method_all = metric_value(f_ent, "CountDeclMethodAll")
        public_methods = metric_value(f_ent, "CountDeclMethodPublic")
        private_methods = metric_value(f_ent, "CountDeclMethodPrivate")
        protected_methods = metric_value(f_ent, "CountDeclMethodProtected")

        sum_cyc = metric_value(f_ent, "SumCyclomatic")
        avg_cyc = metric_value(f_ent, "AvgCyclomatic")
        dit = metric_value(f_ent, "MaxInheritanceTree")
        lcom = metric_value(f_ent, "PercentLackOfCohesion")
        lcom_mod = metric_value(f_ent, "PercentLackOfCohesionModified")

        count_output = metric_value(f_ent, "CountOutput")
        count_input = metric_value(f_ent, "CountInput")
        class_coupled = metric_value(f_ent, "CountClassCoupled")
        class_var = metric_value(f_ent, "CountDeclClassVariable")
        inst_var = metric_value(f_ent, "CountDeclInstanceVariable")
        derived_count = metric_value(f_ent, "CountClassDerived")

        ce = get_efferent_coupling(f_ent, file_map)
        ca = get_afferent_coupling(f_ent, file_map)

        nom = method_count if method_count > 0 else fn_count
        nom = max(1.0, nom)
        complexity = sum_cyc if sum_cyc > 0 else avg_cyc

        # Canonical QMOOD design-property names (proxy-aware)
        dsc = class_count if class_count > 0 else (fn_count + method_count)
        noh = 1.0 if dit > 1.0 else 0.0
        ana = dit
        dam = (private_methods + protected_methods) / max(1.0, nom)
        dcc = class_coupled + ce + ca

        if lcom > 0:
            cam = max(0.0, 1.0 - (lcom / 100.0))
        elif lcom_mod > 0:
            cam = max(0.0, 1.0 - (lcom_mod / 100.0))
        else:
            cam = 1.0 / (1.0 + (complexity / nom))

        moa = class_var + inst_var

        inherited_methods = max(0.0, method_all - method_count)
        mfa = inherited_methods / max(1.0, method_all)

        nop = derived_count if derived_count > 0 else (dit * nom)
        cis = public_methods if public_methods > 0 else (count_input + count_output)

        rows.append(
            {
                "File": file_name,
                "Path": path,
                "LOC": loc,
                "Classes": class_count,
                "Functions": fn_count,
                "Methods": method_count,
                "MethodAll": method_all,
                "PublicMethods": public_methods,
                "PrivateMethods": private_methods,
                "ProtectedMethods": protected_methods,
                "CountInput": count_input,
                "CountOutput": count_output,
                "ClassCoupled": class_coupled,
                "ClassVariables": class_var,
                "InstanceVariables": inst_var,
                "DerivedCount": derived_count,
                "EfferentCoupling": ce,
                "AfferentCoupling": ca,
                "SumCyclomatic": sum_cyc,
                "AvgCyclomatic": avg_cyc,
                "LCOM_Modified": lcom_mod,
                "DSC": dsc,
                "NOH": noh,
                "ANA": ana,
                "DAM": dam,
                "DCC": dcc,
                "CAM": cam,
                "MOA": moa,
                "MFA": mfa,
                "NOP": nop,
                "CIS": cis,
                "NOM": nom,
            }
        )
    return rows


def compute_qmood_attributes(rows):
    properties = [
        "DSC",
        "NOH",
        "ANA",
        "DAM",
        "DCC",
        "CAM",
        "MOA",
        "MFA",
        "NOP",
        "CIS",
        "NOM",
    ]
    for key in properties:
        minmax_normalize(rows, key)

    for row in rows:
        dsc = row["DSC_N"]
        noh = row["NOH_N"]
        ana = row["ANA_N"]
        dam = row["DAM_N"]
        dcc = row["DCC_N"]
        cam = row["CAM_N"]
        moa = row["MOA_N"]
        mfa = row["MFA_N"]
        nop = row["NOP_N"]
        cis = row["CIS_N"]
        nom = row["NOM_N"]

        row["Reusability"] = -0.25 * dcc + 0.25 * cam + 0.50 * cis + 0.50 * dsc
        row["Flexibility"] = 0.25 * dam - 0.25 * dcc + 0.50 * moa + 0.50 * nop
        row["Understandability"] = (
            -0.33 * ana
            + 0.33 * dam
            - 0.33 * dcc
            + 0.33 * cam
            - 0.33 * nop
            - 0.33 * nom
            - 0.33 * dsc
        )
        row["Functionality"] = (
            0.12 * cam + 0.22 * nop + 0.22 * cis + 0.22 * dsc + 0.22 * noh
        )
        row["Extendibility"] = 0.50 * ana - 0.50 * dcc + 0.50 * mfa + 0.50 * nop
        row["Effectiveness"] = (
            0.20 * ana + 0.20 * dam + 0.20 * moa + 0.20 * mfa + 0.20 * nop
        )
        row["QMOOD_SCORE"] = (
            row["Reusability"]
            + row["Flexibility"]
            + row["Understandability"]
            + row["Functionality"]
            + row["Extendibility"]
            + row["Effectiveness"]
        ) / 6.0


def write_visual(path, rows):
    sorted_rows = sorted(rows, key=lambda r: r["QMOOD_SCORE"], reverse=True)
    top = sorted_rows[:20]

    avg_score = sum(r["QMOOD_SCORE"] for r in rows) / max(1, len(rows))
    total_loc = int(sum(r["LOC"] for r in rows))
    total_classes = int(sum(r["Classes"] for r in rows))

    bars = []
    for row in top:
        width = max(2.0, min(100.0, (row["QMOOD_SCORE"] + 1.0) * 50.0))
        bars.append(
            "<tr>"
            f"<td>{row['File']}</td>"
            f"<td>{row['QMOOD_SCORE']:.4f}</td>"
            f"<td>{row['Reusability']:.4f}</td>"
            f"<td>{row['Flexibility']:.4f}</td>"
            f"<td>{row['Understandability']:.4f}</td>"
            f"<td>{row['Functionality']:.4f}</td>"
            f"<td>{row['Extendibility']:.4f}</td>"
            f"<td>{row['Effectiveness']:.4f}</td>"
            f"<td>{row['DSC']:.2f}</td>"
            f"<td>{row['DCC']:.2f}</td>"
            f"<td>{row['CAM']:.4f}</td>"
            f"<td>{row['NOM']:.2f}</td>"
            f"<td><div class='bar'><span style='width:{width:.2f}%'></span></div></td>"
            "</tr>"
        )

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    html = f"""<!doctype html>
<html>
<head>
  <meta charset='utf-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1'>
  <title>QMOOD Visual</title>
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
    .bar {{ width: 100%; background: #eef2ff; border-radius: 999px; height: 10px; }}
    .bar span {{ display: block; height: 10px; background: #2563eb; border-radius: 999px; }}
  </style>
</head>
<body>
  <h1>QMOOD Metrics Visual</h1>
  <div class='meta'>Generated {now}</div>
  <div class='cards'>
    <div class='card'><div class='label'>Modules</div><div class='value'>{len(rows)}</div></div>
    <div class='card'><div class='label'>Average QMOOD</div><div class='value'>{avg_score:.4f}</div></div>
    <div class='card'><div class='label'>Total LOC</div><div class='value'>{total_loc}</div></div>
    <div class='card'><div class='label'>Total Classes</div><div class='value'>{total_classes}</div></div>
  </div>
  <h2>Top Modules by QMOOD Score</h2>
  <div style='overflow-x:auto'>
  <table>
    <thead><tr><th>Module</th><th>Score</th><th>Reusability</th><th>Flexibility</th><th>Understandability</th><th>Functionality</th><th>Extendibility</th><th>Effectiveness</th><th>DSC</th><th>DCC</th><th>CAM</th><th>NOM</th><th>Relative</th></tr></thead>
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
        description="Generate full QMOOD metric set (one CSV + one HTML visual)."
    )
    parser.add_argument("--db", help="Path to .und database (auto-detect if omitted)")
    parser.add_argument(
        "--analyze",
        action="store_true",
        help="Run Understand analyze before extraction",
    )
    parser.add_argument("--output", default="./qmood_reports", help="Output directory")
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

    print("[3/4] Computing QMOOD metrics...")
    rows = build_rows(db, args.exclude)
    if not rows:
        print("ERROR: no files found after exclusions")
        db.close()
        sys.exit(1)
    compute_qmood_attributes(rows)

    os.makedirs(args.output, exist_ok=True)
    csv_path = os.path.join(args.output, "qmood_metrics.csv")
    html_path = os.path.join(args.output, "qmood_visual.html")

    print("[4/4] Writing outputs...")
    header = [
        "File",
        "Path",
        "LOC",
        "Classes",
        "Functions",
        "Methods",
        "MethodAll",
        "PublicMethods",
        "PrivateMethods",
        "ProtectedMethods",
        "CountInput",
        "CountOutput",
        "ClassCoupled",
        "ClassVariables",
        "InstanceVariables",
        "DerivedCount",
        "EfferentCoupling",
        "AfferentCoupling",
        "SumCyclomatic",
        "AvgCyclomatic",
        "LCOM_Modified",
        "DSC",
        "NOH",
        "ANA",
        "DAM",
        "DCC",
        "CAM",
        "MOA",
        "MFA",
        "NOP",
        "CIS",
        "NOM",
        "DSC_N",
        "NOH_N",
        "ANA_N",
        "DAM_N",
        "DCC_N",
        "CAM_N",
        "MOA_N",
        "MFA_N",
        "NOP_N",
        "CIS_N",
        "NOM_N",
        "Reusability",
        "Flexibility",
        "Understandability",
        "Functionality",
        "Extendibility",
        "Effectiveness",
        "QMOOD_SCORE",
    ]
    export_csv(csv_path, rows, header)
    write_visual(html_path, rows)

    db.close()
    print("Done")
    print("  CSV:", os.path.abspath(csv_path))
    print("  Visual:", os.path.abspath(html_path))


if __name__ == "__main__":
    main()
