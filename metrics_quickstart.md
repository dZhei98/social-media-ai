Metrics Quickstart

What these scripts do

- qmood_metrics.py: Computes full QMOOD-style metric set (design properties + quality attributes) and writes one CSV plus one HTML visual.
- ck_metrics.py: Computes full CK-style metric set (WMC, DIT, NOC, CBO, RFC, LCOM) and writes one CSV plus one HTML visual.

Run
cd /Users/joshua/Documents/18980/social-media-ai
/Applications/Understand.app/Contents/MacOS/upython qmood_metrics.py --db social-media-ai.und --output qmood_reports
/Applications/Understand.app/Contents/MacOS/upython ck_metrics.py --db social-media-ai.und --output ck_reports

Outputs

- qmood_reports/qmood_metrics.csv
- qmood_reports/qmood_visual.html
- ck_reports/ck_metrics.csv
- ck_reports/ck_visual.html

Display visuals
open qmood_reports/qmood_visual.html
open ck_reports/ck_visual.html
