from flask import Flask, render_template

app = Flask(__name__)

# =========================
#  ستون‌ها و ثابت‌ها
# =========================
MOD_COL, OPT_COL, SKU_COL, QTY_COL = "Module Name", "Option Name", "SKUs", "Qty"
COLUMNS = [MOD_COL, OPT_COL, SKU_COL, QTY_COL]

# =========================
#  داده‌های DropDown
# =========================
# Base models + Memory mapping
BASE_MODELS = [
    {
        "label": "PowerStore 1200T Base Dell Customer Racked",
        "sku": "[210-BCZJ]",
        "mem_text": "384GB Appliance DIMM (192GB Per Node)",
        "mem_sku": "[370-AEZP]",
    },
    {
        "label": "PowerStore 3200T Base Dell Customer Racked",
        "sku": "[210-BDBC]",
        "mem_text": "768GB Appliance DIMM (384GB Per Node)",
        "mem_sku": "[370-AEZQ]",
    },
    {
        "label": "PowerStore 5200T Base Dell Customer Racked",
        "sku": "[210-BDBX]",
        "mem_text": "1152GB Appliance DIMM (576GB Per Node)",
        "mem_sku": "[370-AEZR]",
    },
    {
        "label": "PowerStore 9200T Base Dell Customer Racked",
        "sku": "[210-BDCP]",
        "mem_text": "2560GB Appliance DIMM 1280GB Per Node",
        "mem_sku": "[370-AHFI]",
    },
]

# Drives dropdown
DRIVES = [
    {"label": "1.92TB NVMe SSD",               "sku": "[400-BGGI]"},
    {"label": "3.84TB NVMe SSD",               "sku": "[400-BGGM]"},
    {"label": "7.68TB NVMe SSD",               "sku": "[400-BGGP]"},
    {"label": "15.36TB NVMe SED", "sku": "[400-BGGK]"},  # اگر SKU دقیق‌تری داری جایگزین کن
]

# Optional SFPs
SFP_OPTIONS = [
    {"label": "10GBE Optical SFP Pair", "sku": "[407-BCGF]"},
    {"label": "25GBE Optical SFP Pair", "sku": "[407-BCGB]"},
]

# =========================
#  بلوک‌های کمکی برای Expansion
# =========================
def exp_services_block():
    """۴ خط Services/Deployment که بعد از Install Kit می‌آید."""
    return [
        {
            MOD_COL: "Dell Services: Hardware Support",
            OPT_COL: "Parts Only Warranty 36Months-ACDTS, 36 Month(s)",
            SKU_COL: "[709-BDLH]",
            QTY_COL: 1,
        },
        {
            MOD_COL: "Dell Services: Extended Service",
            OPT_COL: "ProSupport and Next Business Day Onsite Service-ACDTS, 36 Month(s)",
            SKU_COL: "[199-BJKM]",
            QTY_COL: 1,
        },
        {
            MOD_COL: "Dell Services:Deployment Services",
            OPT_COL: "Infrastructure Deployment Selected",
            SKU_COL: "[683-18894]",
            QTY_COL: 1,
        },
        {
            MOD_COL: "Dell Services:Deployment Services",
            OPT_COL: "No Field Deployment  Customer Install Required",
            SKU_COL: "[683-18894]",
            QTY_COL: 1,
        },
    ]


def exp_set_qty1():
    """ست QTY 1 برای Expansion."""
    return [
        {
            MOD_COL: "Config Kits",
            OPT_COL: "PowerStore ENS24 Exp Kit FLD QTY 1 (1200-9200)",
            SKU_COL: "[343-BBTM]",
            QTY_COL: 1,
        },
        {
            MOD_COL: "Install Kits",
            OPT_COL: "PowerStore NVMe EXP Install Kit",
            SKU_COL: "[343-BBTL]",
            QTY_COL: 1,
        },
    ] + exp_services_block()


def exp_set_qty23():
    """ست QTY 2-3 برای Expansion."""
    return [
        {
            MOD_COL: "Config Kits",
            OPT_COL: "PowerStore ENS24 Exp Kit FLD QTY 2-3 (1200-9200)",
            SKU_COL: "[343-BBTK]",
            QTY_COL: 1,
        },
        {
            MOD_COL: "Install Kits",
            OPT_COL: "PowerStore NVMe EXP Install Kit",
            SKU_COL: "[343-BBTL]",
            QTY_COL: 1,
        },
    ] + exp_services_block()


def expansion_block(bundle="1"):
    """
    یک Expansion بر اساس نوع باندل:
      - bundle="1"  → Enclosure + Drives + (QTY 1)
      - bundle="23" → Enclosure + Drives + (QTY 2-3)
    """
    rows = []

    # Enclosure
    rows.append(
        {
            MOD_COL: "Dell PowerStore 24x2.5 NVMe Expansion Enclosure",
            OPT_COL: "PowerStore NVMe Expansion 24x2.5 Customer Racked",
            SKU_COL: "[210-BDCY]",
            QTY_COL: 1,
        }
    )

    # Drives — DropDown استاندارد (پیش‌فرض 7.68 و QtyMax=24)
    rows.append(
        {
            MOD_COL: "Drives",
            OPT_COL: "7.68TB NVMe SSD",
            SKU_COL: "[400-BGGP]",
            QTY_COL: 24,
            "QtyMax": 24,  # محدوده 1..24 برای Expansion
        }
    )

    # Bundle
    if bundle == "1":
        rows += exp_set_qty1()
    else:
        rows += exp_set_qty23()

    return rows

# =========================
#  ردیف‌های Appliance اصلی (پیش‌فرض 9200T)
# =========================
DEFAULT_ROWS = [
    {
        MOD_COL: "Dell PowerStore",
        OPT_COL: BASE_MODELS[3]["label"],
        SKU_COL: BASE_MODELS[3]["sku"],
        QTY_COL: 1,
    },
    {
        MOD_COL: "Memory Capacity",
        OPT_COL: BASE_MODELS[3]["mem_text"],
        SKU_COL: BASE_MODELS[3]["mem_sku"],
        QTY_COL: 1,
    },

    # Drives اصلی Appliance (QtyMax=21)
    {MOD_COL: "Drives", OPT_COL: "7.68TB NVMe SSD", SKU_COL: "[400-BGGP]", QTY_COL: 21, "QtyMax": 21},

    {MOD_COL: "NVRAM Caching Device", OPT_COL: "PowerStore NVRAM FIPS QTY 2", SKU_COL: "[400-BOBK]", QTY_COL: 2},
    {MOD_COL: "Operating Environment", OPT_COL: "PowerStore Base SW", SKU_COL: "[528-BTZK]", QTY_COL: 1},
    {MOD_COL: "4 Port Mezz Cards", OPT_COL: "25GBE Optical 4 Port Card Pair (SFPs not included)", SKU_COL: "[406-BBOO]", QTY_COL: 1},
    {MOD_COL: "2 Port Mezz Card (Required for NVMe Expansion)", OPT_COL: "PowerStore 100GB MEZZ Pair (SPFs not included)", SKU_COL: "[406-BBSJ]", QTY_COL: 1},
    {MOD_COL: "Optional Appliance IO Module", OPT_COL: "32GB FC 4 Port IO Module Pair (SFPs included)", SKU_COL: "[565-BBJS]", QTY_COL: 2},

    # Optional SFPs (Dropdown)
    {MOD_COL: "Optional SFPs", OPT_COL: "10GBE Optical SFP Pair", SKU_COL: "[407-BCGF]", QTY_COL: 4},

    {MOD_COL: "Power Supply", OPT_COL: "Dual 2200W (200-240V) Power Supply, includes C19/C20 Power Cords", SKU_COL: "[450-AION]", QTY_COL: 1},
    {MOD_COL: "Install Kits", OPT_COL: "PowerStore Base Enclosure Install Kit", SKU_COL: "[343-BBTN]", QTY_COL: 1},
    {MOD_COL: "Dell Services: Hardware Support", OPT_COL: "Parts Only Warranty 36Months-ACDTS, 36 Month(s)", SKU_COL: "[709-BDLB]", QTY_COL: 1},
    {MOD_COL: "Dell Services: Extended Service", OPT_COL: "ProSupport and Next Business Day Onsite Service-ACDTS, 36 Month(s)", SKU_COL: "[199-BJKM]", QTY_COL: 1},
    {MOD_COL: "Storage Configuration", OPT_COL: "Clustered Storage", SKU_COL: "[800-BBQV]", QTY_COL: 1},
    {MOD_COL: "Dell Services:Deployment Services", OPT_COL: "Custom Installation Required with this order", SKU_COL: "[683-18894]", QTY_COL: 1},
]

# =========================
#  سه Expansion طبق الگو: 1 ، 2-3 ، 2-3
# =========================
DEFAULT_ROWS += expansion_block("1")   # DAE #1 → QTY 1
DEFAULT_ROWS += expansion_block("23")  # DAE #2 → QTY 2-3
DEFAULT_ROWS += expansion_block("23")  # DAE #3 → QTY 2-3

# =========================
#  Route
# =========================
@app.route("/")
def index():
    return render_template(
        "index.html",
        columns=COLUMNS,
        data=DEFAULT_ROWS,
        mod_col=MOD_COL, opt_col=OPT_COL, sku_col=SKU_COL, qty_col=QTY_COL,
        models=BASE_MODELS,       # Dropdown مدل پایه
        drive_options=DRIVES,     # Dropdown Drives
        sfp_options=SFP_OPTIONS,  # Dropdown SFPs
    )


if __name__ == "__main__":
    # روی پورت 5000 اجرا می‌شود
    app.run(host="0.0.0.0", port=5000, debug=True)