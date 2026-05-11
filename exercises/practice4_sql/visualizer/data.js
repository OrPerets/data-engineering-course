window.practice4VisualizerData = {
  steps: [
    {
      id: 1,
      label: "Sources",
      title: "Sources",
      script: "00_part_a_sources.sql",
      concept: "Raw tables",
      summary: "מקור -> עמודות -> מפתחות עסקיים.",
      maxNodeStep: 1,
      transformationSteps: [],
      lanes: [
        {
          title: "Source tables",
          note: "Operational schema before cleaning",
          nodeIds: [
            "sources.orders_src",
            "sources.order_items_src",
            "sources.customers_src",
            "sources.returns_src"
          ]
        }
      ]
    },
    {
      id: 2,
      label: "Staging",
      title: "Staging",
      script: "01_part_b_staging_area.sql + 03_part_d1_extract_to_staging.sql",
      concept: "Raw + views",
      summary: "טבלאות נחיתה ו-views נקיים.",
      maxNodeStep: 3,
      transformationSteps: [2, 3],
      lanes: [
        {
          title: "sources / TABLE",
          note: "source tables",
          nodeIds: [
            "sources.orders_src",
            "sources.order_items_src",
            "sources.customers_src",
            "sources.returns_src"
          ]
        },
        {
          title: "staging / TABLE",
          note: "raw landing tables",
          nodeIds: [
            "staging.orders_src",
            "staging.order_items_src",
            "staging.customers_src",
            "staging.returns_src"
          ]
        },
        {
          title: "staging / VIEW",
          note: "clean staging views",
          nodeIds: [
            "staging.v_orders_latest",
            "staging.v_order_items_latest",
            "staging.v_customers_latest",
            "staging.v_returns_agg"
          ]
        }
      ]
    },
    {
      id: 3,
      label: "Dims",
      title: "Dimensions",
      script: "02_part_c_dwh_model_and_etl_log.sql + 04_part_d2_load_dimensions.sql",
      concept: "Surrogate keys",
      summary: "ערכים קנוניים מקבלים מפתחות אנליטיים.",
      maxNodeStep: 4,
      transformationSteps: [4],
      lanes: [
        {
          title: "Clean view inputs",
          note: "Canonical staging outputs",
          nodeIds: [
            "staging.v_orders_latest",
            "staging.v_order_items_latest",
            "staging.v_customers_latest"
          ]
        },
        {
          title: "Dimension tables",
          note: "Keys and descriptive attributes",
          nodeIds: [
            "dwh.dim_date",
            "dwh.dim_channel",
            "dwh.dim_product",
            "dwh.dim_customer"
          ]
        }
      ]
    },
    {
      id: 4,
      label: "Fact",
      title: "Fact",
      script: "05_part_d3_load_fact_sales.sql",
      concept: "Grain + measures",
      summary: "`fact_sales`: joins, measures, MERGE.",
      maxNodeStep: 5,
      transformationSteps: [5],
      lanes: [
        {
          title: "Fact inputs",
          note: "Clean views and dimension keys",
          nodeIds: [
            "staging.v_orders_latest",
            "staging.v_order_items_latest",
            "staging.v_returns_agg",
            "dwh.dim_date",
            "dwh.dim_channel",
            "dwh.dim_product",
            "dwh.dim_customer"
          ]
        },
        {
          title: "Fact table",
          note: "Order-line grain and measures",
          nodeIds: ["dwh.fact_sales"]
        }
      ]
    },
    {
      id: 5,
      label: "Analytics",
      title: "Analytics",
      script: "06_part_e_analytics_queries.sql + 07_classroom_demo_queries.sql",
      concept: "Window KPIs",
      summary: "שאילתות קוראות מה-DWH ומחשבות KPIs.",
      maxNodeStep: 6,
      transformationSteps: [6],
      lanes: [
        {
          title: "DWH model",
          note: "Fact and dimensions consumed by analytics",
          nodeIds: [
            "dwh.fact_sales",
            "dwh.dim_date",
            "dwh.dim_customer",
            "dwh.dim_product",
            "dwh.dim_channel"
          ]
        },
        {
          title: "Analytics outputs",
          note: "Queries students can run and validate",
          nodeIds: [
            "analytics.daily_net_revenue",
            "analytics.fulfillment_rate",
            "analytics.monthly_segment_revenue",
            "analytics.top_products",
            "analytics.validation_checkpoint"
          ]
        }
      ]
    }
  ],

  layers: [
    { id: 1, label: "Sources", detail: "operational tables", kind: "source" },
    { id: 2, label: "Raw Staging", detail: "copy + run_id", kind: "staging" },
    { id: 3, label: "Cleaned Views", detail: "standardize + dedup", kind: "view" },
    { id: 4, label: "Dimensions", detail: "surrogate keys", kind: "dwh" },
    { id: 5, label: "Fact", detail: "order-line grain", kind: "fact" },
    { id: 6, label: "Analytics", detail: "window KPIs", kind: "analytics" }
  ],

  sampleTraces: [
    {
      id: "trace_customer",
      label: "7001 customer",
      marker: "ID",
      focusId: "customer_ref",
      step: 5,
      title: "Customer identity path"
    },
    {
      id: "trace_order_line",
      label: "7001 line",
      marker: "KEY",
      focusId: "order_line",
      step: 4,
      title: "Order-line grain path"
    },
    {
      id: "trace_return",
      label: "return -> net",
      marker: "LATE",
      focusId: "return_amount",
      step: 5,
      title: "Late return into net"
    }
  ],

  lineageFocuses: [
    {
      id: "customer_ref",
      label: "customer_ref",
      marker: "ID",
      aliases: ["customer_ref_std", "customer_key", "full_name", "segment", "region"],
      description: "Customer identity is standardized, linked to `dim_customer`, then used for monthly segment revenue and LAG comparison.",
      edgeIds: ["e1", "e4", "e6", "e9", "e14", "e15", "e21", "e23"],
      nodeIds: [
        "sources.orders_src",
        "sources.customers_src",
        "staging.orders_src",
        "staging.customers_src",
        "staging.v_orders_latest",
        "staging.v_customers_latest",
        "dwh.dim_customer",
        "dwh.fact_sales",
        "analytics.monthly_segment_revenue"
      ],
      path: [
        ["sources.orders_src.customer_ref", "standardize", "staging.v_orders_latest.customer_ref_std"],
        ["staging.v_customers_latest.customer_ref", "surrogate-key lookup", "dwh.dim_customer.customer_key"],
        ["dwh.fact_sales.customer_key", "group by segment", "Monthly segment revenue + LAG"]
      ]
    },
    {
      id: "product_id",
      label: "product_id",
      marker: "FK",
      aliases: ["product_key", "product_name", "category"],
      description: "The business product id survives cleaning, resolves `product_key`, and supports product revenue analytics.",
      edgeIds: ["e2", "e3", "e7", "e8", "e13", "e16", "e20", "e24"],
      nodeIds: [
        "sources.order_items_src",
        "staging.order_items_src",
        "staging.v_order_items_latest",
        "dwh.dim_product",
        "dwh.fact_sales",
        "analytics.top_products"
      ],
      path: [
        ["sources.order_items_src.product_id", "dedup line", "staging.v_order_items_latest.product_id"],
        ["staging.v_order_items_latest.product_id", "surrogate-key lookup", "dwh.dim_product.product_key"],
        ["dwh.fact_sales.product_key", "rank by revenue", "Top products with ROW_NUMBER"]
      ]
    },
    {
      id: "order_line",
      label: "order_id + line_id",
      marker: "KEY",
      aliases: ["order_id", "line_id"],
      description: "The order-line grain controls dedup, return matching, and idempotent MERGE into the fact.",
      edgeIds: ["e2", "e5", "e7", "e10", "e16", "e17"],
      nodeIds: [
        "sources.order_items_src",
        "sources.returns_src",
        "staging.order_items_src",
        "staging.returns_src",
        "staging.v_order_items_latest",
        "staging.v_returns_agg",
        "dwh.fact_sales"
      ],
      path: [
        ["order_id + line_id", "latest-row dedup", "one clean order line"],
        ["returns.order_id + line_id", "return aggregation", "v_returns_agg.return_amount"],
        ["order_id + line_id", "MERGE match", "fact_sales row"]
      ]
    },
    {
      id: "return_amount",
      label: "return_amount",
      marker: "LATE",
      aliases: ["return_id", "return_ts"],
      description: "Late returns are aggregated at the order-line grain and subtract from net revenue.",
      edgeIds: ["e5", "e10", "e17", "e22", "e23", "e24", "e25"],
      nodeIds: [
        "sources.returns_src",
        "staging.returns_src",
        "staging.v_returns_agg",
        "dwh.fact_sales",
        "analytics.daily_net_revenue",
        "analytics.monthly_segment_revenue",
        "analytics.top_products",
        "analytics.validation_checkpoint"
      ],
      path: [
        ["sources.returns_src.return_amount", "SUM by order line", "staging.v_returns_agg.return_amount"],
        ["v_returns_agg.return_amount", "left join to fact source", "fact_sales.return_amount"],
        ["fact_sales.return_amount", "subtract", "fact_sales.net_revenue"]
      ]
    },
    {
      id: "net_revenue",
      label: "net_revenue",
      marker: "Σ",
      aliases: ["gross_revenue", "discount_amount", "quantity", "unit_price", "monthly_net_revenue", "daily_net_revenue", "cumulative_net_revenue", "net_revenue_30d", "june_2025_net_revenue"],
      description: "`net_revenue = gross_revenue - discount_amount - return_amount`, then analytics aggregate it and apply window functions.",
      edgeIds: ["e16", "e17", "e22", "e23", "e24", "e25"],
      nodeIds: [
        "staging.v_order_items_latest",
        "staging.v_returns_agg",
        "dwh.fact_sales",
        "analytics.daily_net_revenue",
        "analytics.monthly_segment_revenue",
        "analytics.top_products",
        "analytics.validation_checkpoint"
      ],
      path: [
        ["quantity * unit_price", "calculate", "gross_revenue"],
        ["gross - discount - return", "calculate", "net_revenue"],
        ["SUM(net_revenue)", "aggregate then window", "Monthly segment revenue + LAG"]
      ]
    },
    {
      id: "date_key",
      label: "date_key",
      marker: "DATE",
      aliases: ["order_ts", "calendar_date", "year_month", "week_start"],
      description: "Order timestamps become date dimension keys and calendar attributes for time-based analytics.",
      edgeIds: ["e1", "e6", "e11", "e15", "e18", "e22", "e23", "e25", "erd1"],
      nodeIds: [
        "sources.orders_src",
        "staging.orders_src",
        "staging.v_orders_latest",
        "dwh.dim_date",
        "dwh.fact_sales",
        "analytics.daily_net_revenue",
        "analytics.monthly_segment_revenue",
        "analytics.validation_checkpoint"
      ],
      path: [
        ["sources.orders_src.order_ts", "copy", "staging.orders_src.order_ts"],
        ["staging.v_orders_latest.order_ts", "generate date rows", "dwh.dim_date.date_key"],
        ["dwh.dim_date.date_key", "surrogate-key lookup", "dwh.fact_sales.date_key"],
        ["dwh.fact_sales.date_key", "calendar join/filter", "date analytics"]
      ]
    },
    {
      id: "channel_name",
      label: "channel_name",
      marker: "CH",
      aliases: ["channel", "channel_key", "fulfillment_rate", "completed_orders", "total_orders"],
      description: "Raw channel values are standardized, resolved to `dim_channel`, and used in fulfillment analytics.",
      edgeIds: ["e1", "e6", "e12", "e15", "e19", "e26", "erd2"],
      nodeIds: [
        "sources.orders_src",
        "staging.orders_src",
        "staging.v_orders_latest",
        "dwh.dim_channel",
        "dwh.fact_sales",
        "analytics.fulfillment_rate"
      ],
      path: [
        ["sources.orders_src.channel", "standardize", "staging.v_orders_latest.channel_name"],
        ["staging.v_orders_latest.channel_name", "load distinct channels", "dwh.dim_channel.channel_key"],
        ["dwh.dim_channel.channel_key", "surrogate-key lookup", "dwh.fact_sales.channel_key"],
        ["staging.v_orders_latest.channel_name", "group completed/all orders", "Weekly fulfillment rank"]
      ]
    }
  ],

  nodes: [
    {
      id: "sources.orders_src",
      label: "orders_src",
      kind: "source",
      step: 1,
      position: { x: 0, y: 40 },
      purpose: "מקור ההזמנות ממערכת Order Management / POS.",
      columns: ["order_id", "customer_ref", "order_ts", "channel", "order_status"],
      technicalColumns: ["updated_at"],
      script: "00_part_a_sources.sql",
      note: "`customer_ref` ו-`channel` עדיין אינם קנוניים: למשל `orp`, `WEB`, `APP`, `Store`."
    },
    {
      id: "sources.order_items_src",
      label: "order_items_src",
      kind: "source",
      step: 1,
      position: { x: 0, y: 165 },
      purpose: "שורות ההזמנה התפעוליות ברמת מוצר בתוך הזמנה.",
      columns: ["order_id", "line_id", "product_id", "product_name", "category", "quantity", "unit_price", "discount_amount"],
      technicalColumns: ["updated_at"],
      script: "00_part_a_sources.sql",
      note: "השילוב `order_id + line_id` הופך בהמשך לגרעיניות של fact_sales; פרטי המוצר הבסיסיים מגיעים עם שורת ההזמנה."
    },
    {
      id: "sources.customers_src",
      label: "customers_src",
      kind: "source",
      step: 1,
      position: { x: 0, y: 415 },
      purpose: "נתוני לקוחות ממערכת CRM.",
      columns: ["customer_ref", "full_name", "segment", "region"],
      technicalColumns: ["updated_at"],
      script: "00_part_a_sources.sql",
      note: "אותו לקוח יכול להופיע בכמה גרסאות; למשל `user_ben_ruiz` מופיע עם segment שונה."
    },
    {
      id: "sources.returns_src",
      label: "returns_src",
      kind: "source",
      step: 1,
      position: { x: 0, y: 540 },
      purpose: "החזרות ממערכת Returns Service.",
      columns: ["return_id", "order_id", "line_id", "return_ts", "return_amount"],
      technicalColumns: ["ingested_at"],
      script: "00_part_a_sources.sql",
      note: "החזרות יכולות להגיע מאוחר ולכן הן משפיעות על fact קיים, לא יוצרות מכירה חדשה."
    },

    {
      id: "staging.orders_src",
      label: "staging.orders_src",
      kind: "staging",
      step: 2,
      position: { x: 270, y: 40 },
      purpose: "נחיתה גולמית של הזמנות עם run_id של ריצת ETL.",
      columns: ["order_id", "customer_ref", "order_ts", "channel", "order_status"],
      technicalColumns: ["run_id", "updated_at"],
      script: "01_part_b_staging_area.sql / 03_part_d1_extract_to_staging.sql",
      note: "הטבלה עדיין גולמית; run_id מספיק כדי לזהות את הריצה בלי להעמיס עמודות metadata."
    },
    {
      id: "staging.order_items_src",
      label: "staging.order_items_src",
      kind: "staging",
      step: 2,
      position: { x: 270, y: 165 },
      purpose: "נחיתה גולמית של שורות הזמנה.",
      columns: ["order_id", "line_id", "product_id", "product_name", "category", "quantity", "unit_price"],
      technicalColumns: ["discount_amount", "run_id", "updated_at"],
      script: "01_part_b_staging_area.sql / 03_part_d1_extract_to_staging.sql",
      note: "הריצה לדוגמה מבצעת `TRUNCATE` כדי שיהיה קל להריץ מחדש בכיתה."
    },
    {
      id: "staging.customers_src",
      label: "staging.customers_src",
      kind: "staging",
      step: 2,
      position: { x: 270, y: 415 },
      purpose: "נחיתה גולמית של נתוני CRM.",
      columns: ["customer_ref", "full_name", "segment", "region"],
      technicalColumns: ["run_id", "updated_at"],
      script: "01_part_b_staging_area.sql / 03_part_d1_extract_to_staging.sql",
      note: "כאן עדיין נשמרים כל ערכי המקור כדי שאפשר יהיה לבדוק מה השתנה."
    },
    {
      id: "staging.returns_src",
      label: "staging.returns_src",
      kind: "staging",
      step: 2,
      position: { x: 270, y: 540 },
      purpose: "נחיתה גולמית של החזרות.",
      columns: ["return_id", "order_id", "line_id", "return_ts", "return_amount"],
      technicalColumns: ["ingested_at", "run_id"],
      script: "01_part_b_staging_area.sql / 03_part_d1_extract_to_staging.sql",
      note: "`ingested_at` משמש כשדה זמן לזיהוי החזרות שנקלטו מאוחר."
    },

    {
      id: "staging.v_orders_latest",
      label: "v_orders_latest",
      kind: "view",
      step: 3,
      position: { x: 565, y: 70 },
      purpose: "View נקי שמחזיר את רשומת ההזמנה האחרונה לכל `order_id`.",
      columns: ["order_id", "customer_ref_std", "order_ts", "channel_name", "order_status"],
      technicalColumns: ["updated_at", "run_id"],
      script: "01_part_b_staging_area.sql",
      note: "כאן מתקננים `orp` ל-`user_orp`, ו-`WEB` / `APP` / `Store` לערוצים קנוניים."
    },
    {
      id: "staging.v_order_items_latest",
      label: "v_order_items_latest",
      kind: "view",
      step: 3,
      position: { x: 565, y: 195 },
      purpose: "View שמחזיר שורה אחת לכל `order_id + line_id`.",
      columns: ["order_id", "line_id", "product_id", "product_name", "category", "quantity", "unit_price", "discount_amount"],
      technicalColumns: ["updated_at", "run_id"],
      script: "01_part_b_staging_area.sql",
      note: "`COALESCE(discount_amount, 0)` מכין את המדד לחישוב revenue, וקטגוריית המוצר עוברת תקנון."
    },
    {
      id: "staging.v_customers_latest",
      label: "v_customers_latest",
      kind: "view",
      step: 3,
      position: { x: 565, y: 445 },
      purpose: "View לקוח קנוני נוכחי אחרי תקנון מזהה ו-dedup.",
      columns: ["customer_ref", "full_name", "segment", "region"],
      technicalColumns: ["run_id"],
      script: "01_part_b_staging_area.sql",
      note: "`standard`, `std`, `Premium` ו-`VIP` עוברים לערכי segment קנוניים."
    },
    {
      id: "staging.v_returns_agg",
      label: "v_returns_agg",
      kind: "view",
      step: 3,
      position: { x: 565, y: 570 },
      purpose: "View שמאגד החזרות לפי שורת הזמנה.",
      columns: ["order_id", "line_id", "return_amount"],
      technicalColumns: [],
      script: "01_part_b_staging_area.sql",
      note: "האיחוד לפי `order_id + line_id` מאפשר לעדכן את שורת ה-fact הנכונה."
    },

    {
      id: "dwh.dim_date",
      label: "dim_date",
      kind: "dwh",
      step: 4,
      position: { x: 855, y: 35 },
      erdPosition: { x: 455, y: 50 },
      purpose: "ממד תאריך לניתוחים לפי יום, חודש ושבוע.",
      columns: ["date_key", "calendar_date", "year_month", "week_start"],
      technicalColumns: [],
      script: "02_part_c_dwh_model_and_etl_log.sql / 04_part_d2_load_dimensions.sql",
      note: "`date_key` נשאר מספר ישיר כדי לאפשר סינון יעיל כמו `BETWEEN 20250601 AND 20250630`."
    },
    {
      id: "dwh.dim_channel",
      label: "dim_channel",
      kind: "dwh",
      step: 4,
      position: { x: 855, y: 175 },
      erdPosition: { x: 120, y: 230 },
      purpose: "ממד ערוצי מכירה קנוניים.",
      columns: ["channel_key", "channel_name"],
      technicalColumns: [],
      script: "02_part_c_dwh_model_and_etl_log.sql / 04_part_d2_load_dimensions.sql",
      note: "ערוצים גולמיים מתכנסים לערכים כמו `web`, `mobile_app`, `store`."
    },
    {
      id: "dwh.dim_product",
      label: "dim_product",
      kind: "dwh",
      step: 4,
      position: { x: 855, y: 315 },
      erdPosition: { x: 790, y: 230 },
      purpose: "ממד מוצר קנוני עם surrogate key.",
      columns: ["product_key", "product_id", "product_name", "category"],
      technicalColumns: [],
      script: "02_part_c_dwh_model_and_etl_log.sql / 04_part_d2_load_dimensions.sql",
      note: "`product_key` הוא המפתח האנליטי; `product_id` נשאר מזהה עסקי שמגיע משורת ההזמנה."
    },
    {
      id: "dwh.dim_customer",
      label: "dim_customer",
      kind: "dwh",
      step: 4,
      position: { x: 855, y: 455 },
      erdPosition: { x: 455, y: 415 },
      purpose: "ממד לקוח נוכחי וקנוני אחרי תקנון ו-latest-row dedup.",
      columns: ["customer_key", "customer_ref", "full_name", "segment", "region"],
      technicalColumns: [],
      script: "02_part_c_dwh_model_and_etl_log.sql / 04_part_d2_load_dimensions.sql",
      note: "זה אינו SCD2 בגרסה הנוכחית; `customer_ref` ייחודי ומייצג את הלקוח הקנוני."
    },
    {
      id: "dwh.fact_sales",
      label: "fact_sales",
      kind: "fact",
      step: 5,
      position: { x: 1160, y: 280 },
      erdPosition: { x: 455, y: 235 },
      purpose: "טבלת fact למכירות ברמת שורת הזמנה.",
      columns: ["order_id", "line_id", "date_key", "product_key", "customer_key", "channel_key"],
      technicalColumns: ["gross_revenue", "discount_amount", "return_amount", "net_revenue"],
      script: "02_part_c_dwh_model_and_etl_log.sql / 05_part_d3_load_fact_sales.sql",
      note: "הגרעיניות היא `order_id + line_id`; `MERGE` מאפשר rerun בלי לשכפל שורות."
    },
    {
      id: "analytics.daily_net_revenue",
      label: "Daily net revenue + cumulative",
      kind: "analytics",
      step: 6,
      position: { x: 1460, y: 90 },
      purpose: "KPI יומי לפי אזור וקטגוריית מוצר עם סכום מצטבר.",
      columns: ["calendar_date", "region", "category", "daily_net_revenue"],
      technicalColumns: ["cumulative_net_revenue"],
      script: "06_part_e_analytics_queries.sql",
      note: "השאילתה מצטרפת ל-dimensions כדי לקבל שמות ותיאורים עסקיים."
    },
    {
      id: "analytics.fulfillment_rate",
      label: "Weekly fulfillment rate + rank",
      kind: "analytics",
      step: 6,
      position: { x: 1460, y: 220 },
      purpose: "שיעור הזמנות completed מתוך כל ההזמנות האחרונות לאחר dedup, כולל דירוג שבועי.",
      columns: ["week_start", "channel_name", "fulfillment_rate"],
      technicalColumns: ["completed_orders", "total_orders", "weekly_channel_rank"],
      script: "06_part_e_analytics_queries.sql",
      note: "דוגמה לכך שלא כל KPI חייב לקרוא רק מה-fact; כאן ההגדרה מתבססת על latest orders."
    },
    {
      id: "analytics.monthly_segment_revenue",
      label: "Monthly segment revenue + LAG",
      kind: "analytics",
      step: 6,
      position: { x: 1460, y: 350 },
      purpose: "Revenue חודשי לפי סגמנט לקוח קנוני, כולל השוואה לחודש קודם.",
      columns: ["year_month", "segment", "monthly_net_revenue"],
      technicalColumns: ["previous_month_net_revenue", "month_over_month_change"],
      script: "06_part_e_analytics_queries.sql",
      note: "הסגמנט מגיע מ-`dim_customer`, אחרי תקנון מזהים, ערכים ו-dedup."
    },
    {
      id: "analytics.top_products",
      label: "Top products with ROW_NUMBER",
      kind: "analytics",
      step: 6,
      position: { x: 1460, y: 480 },
      purpose: "חמשת המוצרים המובילים לפי net revenue בחלון הנתונים הזמין, עם דירוג ROW_NUMBER.",
      columns: ["product_id", "product_name", "category", "net_revenue_30d"],
      technicalColumns: ["product_rank"],
      script: "06_part_e_analytics_queries.sql",
      note: "ה-anchor משתמש בתאריך המקסימלי ב-DWH כדי שהדוגמה תחזיר תוצאות גם אחרי 2025."
    },
    {
      id: "analytics.validation_checkpoint",
      label: "June 2025 checkpoint",
      kind: "analytics",
      step: 6,
      position: { x: 1460, y: 610 },
      purpose: "בדיקת תקינות קטנה לתרגול.",
      columns: ["june_2025_net_revenue"],
      technicalColumns: ["date_key BETWEEN 20250601 AND 20250630"],
      script: "06_part_e_analytics_queries.sql / 07_classroom_demo_queries.sql",
      note: "הבדיקה מדגישה סינון ידידותי ל-partition pruning באמצעות `date_key`."
    }
  ],

  edges: [
    ["sources.orders_src", "staging.orders_src", 2, "Extract orders into raw staging with compact run_id."],
    ["sources.order_items_src", "staging.order_items_src", 2, "Extract order lines into raw staging."],
    ["sources.order_items_src", "staging.order_items_src", 2, "Product attributes travel with the order-line source."],
    ["sources.customers_src", "staging.customers_src", 2, "Extract CRM customer rows."],
    ["sources.returns_src", "staging.returns_src", 2, "Extract append-like returns rows."],
    ["staging.orders_src", "staging.v_orders_latest", 3, "Normalize customer_ref/channel and keep latest order row."],
    ["staging.order_items_src", "staging.v_order_items_latest", 3, "Keep one latest row per order line."],
    ["staging.order_items_src", "staging.v_order_items_latest", 3, "Normalize category on order lines."],
    ["staging.customers_src", "staging.v_customers_latest", 3, "Normalize customer_ref/segment/region and keep current row."],
    ["staging.returns_src", "staging.v_returns_agg", 3, "Aggregate late returns by order line."],
    ["staging.v_orders_latest", "dwh.dim_date", 4, "Generate date rows from order dates."],
    ["staging.v_orders_latest", "dwh.dim_channel", 4, "Load canonical channels."],
    ["staging.v_order_items_latest", "dwh.dim_product", 4, "Load canonical product dimension from order-line product attributes."],
    ["staging.v_customers_latest", "dwh.dim_customer", 4, "Load current canonical customer dimension."],
    ["staging.v_orders_latest", "dwh.fact_sales", 5, "Provide order date, customer_ref, channel and status."],
    ["staging.v_order_items_latest", "dwh.fact_sales", 5, "Provide product, quantity, price and discount at order-line grain."],
    ["staging.v_returns_agg", "dwh.fact_sales", 5, "Apply late return amount to the matching order line."],
    ["dwh.dim_date", "dwh.fact_sales", 5, "Resolve date_key."],
    ["dwh.dim_channel", "dwh.fact_sales", 5, "Resolve channel_key."],
    ["dwh.dim_product", "dwh.fact_sales", 5, "Resolve product_key."],
    ["dwh.dim_customer", "dwh.fact_sales", 5, "Resolve customer_key."],
    ["dwh.fact_sales", "analytics.daily_net_revenue", 6, "Aggregate net revenue by day, region and category."],
    ["dwh.fact_sales", "analytics.monthly_segment_revenue", 6, "Aggregate net revenue by month and canonical customer segment."],
    ["dwh.fact_sales", "analytics.top_products", 6, "Rank products by net revenue."],
    ["dwh.fact_sales", "analytics.validation_checkpoint", 6, "Validate June 2025 revenue with date_key filter."],
    ["staging.v_orders_latest", "analytics.fulfillment_rate", 6, "Calculate completed / all deduped latest orders."]
  ].map(([source, target, step, meaning], index) => ({
    id: `e${index + 1}`,
    source,
    target,
    step,
    meaning
  })),

  erdEdges: [
    ["dwh.fact_sales", "dwh.dim_date", "date_key -> date_key"],
    ["dwh.fact_sales", "dwh.dim_channel", "channel_key -> channel_key"],
    ["dwh.fact_sales", "dwh.dim_product", "product_key -> product_key"],
    ["dwh.fact_sales", "dwh.dim_customer", "customer_key -> customer_key"]
  ].map(([source, target, meaning], index) => ({
    id: `erd${index + 1}`,
    source,
    target,
    step: 5,
    meaning
  })),

  transformations: [
    {
      id: "t_extract_metadata",
      step: 2,
      edgeIds: ["e1", "e2", "e3", "e4", "e5"],
      title: "Extract -> raw staging with run_id",
      shortTitle: "Raw copy + run_id",
      source: "sources.*",
      target: "staging.*",
      type: "COPY",
      fieldChips: ["source columns", "run_id"],
      visualRules: [
        ["business fields", "copied unchanged"],
        ["ETL run", "run_id"]
      ],
      sqlBox: [
        "INSERT INTO staging.orders_src (...)",
        "SELECT ..., run_id",
        "FROM sources.orders_src;"
      ],
      inputs: ["source columns", "clock_timestamp()", "practice4_run_context.run_id"],
      outputs: ["same business columns", "run_id"],
      rule: "Business fields are copied unchanged; ETL adds only run_id so students can still identify the run.",
      sql: "03_part_d1_extract_to_staging.sql",
      example: "`sources.orders_src.customer_ref = 'orp'` remains raw in `staging.orders_src.customer_ref`, with a new `run_id`."
    },
    {
      id: "t_orders_latest",
      step: 3,
      edgeIds: ["e6"],
      title: "Normalize orders and keep latest row",
      shortTitle: "Clean orders",
      source: "staging.orders_src",
      target: "staging.v_orders_latest",
      type: "CLEAN",
      fieldChips: ["customer_ref", "channel", "order_status", "rn = 1"],
      visualRules: [
        ["orp", "user_orp"],
        ["WEB / APP / Store", "web / mobile_app / store"],
        ["ROW_NUMBER()", "latest order"]
      ],
      sqlBox: [
        "CASE customer_ref",
        "  WHEN 'orp' THEN 'user_orp'",
        "ROW_NUMBER() OVER (PARTITION BY order_id)"
      ],
      inputs: ["order_id", "customer_ref", "channel", "order_status", "updated_at"],
      outputs: ["order_id", "customer_ref_std", "channel_name", "order_status", "rn = 1"],
      rule: "Map known customer identifiers with simple `CASE`, map channels to canonical names, then choose latest row per `order_id` using `ROW_NUMBER()`.",
      sql: "01_part_b_staging_area.sql",
      example: "`orp` -> `user_orp`; `APP` and `mobile_app` -> `mobile_app`; latest `7002` row becomes `refunded`."
    },
    {
      id: "t_order_items_latest",
      step: 3,
      edgeIds: ["e7"],
      title: "Prepare order-line grain",
      shortTitle: "One row per order line",
      source: "staging.order_items_src",
      target: "staging.v_order_items_latest",
      type: "DEDUP",
      fieldChips: ["order_id", "line_id", "discount_amount", "rn = 1"],
      visualRules: [
        ["order_id + line_id", "one latest row"],
        ["NULL discount", "0"]
      ],
      sqlBox: [
        "PARTITION BY order_id, line_id",
        "ORDER BY updated_at DESC",
        "COALESCE(discount_amount, 0)"
      ],
      inputs: ["order_id", "line_id", "product_id", "product_name", "category", "quantity", "unit_price", "discount_amount"],
      outputs: ["one row per order_id + line_id", "product_name", "category", "discount_amount"],
      rule: "Keep the latest row per order line, normalize category, and replace missing `discount_amount` with `0`.",
      sql: "01_part_b_staging_area.sql",
      example: "`COALESCE(discount_amount, 0)` makes revenue calculations deterministic."
    },
    {
      id: "t_order_line_product_category",
      step: 3,
      edgeIds: ["e8"],
      title: "Canonicalize order-line product categories",
      shortTitle: "Clean categories",
      source: "staging.order_items_src",
      target: "staging.v_order_items_latest",
      type: "CLEAN",
      fieldChips: ["product_id", "product_name", "category", "rn = 1"],
      visualRules: [
        ["Electronics", "electronics"],
        ["home kitchen", "home_kitchen"],
        ["ROW_NUMBER()", "latest order line"]
      ],
      sqlBox: [
        "CASE lower(trim(category))",
        "  WHEN 'home kitchen' THEN 'home_kitchen'",
        "END"
      ],
      inputs: ["product_id", "product_name", "category", "updated_at"],
      outputs: ["product_id", "product_name", "category"],
      rule: "Map variant category spellings to canonical values while keeping the latest order-line row.",
      sql: "01_part_b_staging_area.sql",
      example: "`Electronics` and `electronics` -> `electronics`; `home kitchen` -> `home_kitchen`."
    },
    {
      id: "t_customers_latest",
      step: 3,
      edgeIds: ["e9"],
      title: "Build current canonical customer row",
      shortTitle: "Current customer row",
      source: "staging.customers_src",
      target: "staging.v_customers_latest",
      type: "CLEAN",
      fieldChips: ["customer_ref", "segment", "region", "rn = 1"],
      visualRules: [
        ["ben-ruiz", "user_ben_ruiz"],
        ["standard / Premium", "standard / premium"],
        ["JERUSALEM", "jerusalem"]
      ],
      sqlBox: [
        "PARTITION BY customer_ref_std",
        "ORDER BY updated_at DESC",
        "WHERE rn = 1"
      ],
      inputs: ["customer_ref", "full_name", "segment", "region", "updated_at"],
      outputs: ["customer_ref", "full_name", "segment", "region"],
      rule: "Normalize customer refs, segment and region values, then keep the latest current row per canonical customer.",
      sql: "01_part_b_staging_area.sql",
      example: "`ben-ruiz` in orders joins to `user_ben_ruiz`; latest CRM row changes segment from `standard` to `premium`."
    },
    {
      id: "t_returns_agg",
      step: 3,
      edgeIds: ["e10"],
      title: "Aggregate late returns by order line",
      shortTitle: "Returns by order line",
      source: "staging.returns_src",
      target: "staging.v_returns_agg",
      type: "AGG",
      fieldChips: ["order_id", "line_id", "SUM(return_amount)"],
      visualRules: [
        ["returns rows", "grouped by order_id + line_id"],
        ["late arrival", "updates matching fact row"]
      ],
      sqlBox: [
        "SELECT order_id, line_id,",
        "       SUM(return_amount)",
        "GROUP BY order_id, line_id"
      ],
      inputs: ["order_id", "line_id", "return_amount", "return_ts", "ingested_at"],
      outputs: ["order_id", "line_id", "SUM(return_amount)"],
      rule: "Group returns by the same grain as the fact table: `order_id + line_id`.",
      sql: "01_part_b_staging_area.sql",
      example: "Multiple returns for the same order line would collapse into one `return_amount` for the fact update."
    },
    {
      id: "t_dim_date",
      step: 4,
      edgeIds: ["e11"],
      title: "Generate calendar dimension",
      shortTitle: "Date keys",
      source: "staging.v_orders_latest.order_ts",
      target: "dwh.dim_date",
      type: "MAP",
      fieldChips: ["order_ts", "date_key", "year_month", "week_start"],
      visualRules: [
        ["2025-06-01", "20250601"],
        ["order date range", "calendar rows"]
      ],
      sqlBox: [
        "to_char(calendar_date, 'YYYYMMDD')::int",
        "generate_series(MIN(order_ts), MAX(order_ts))"
      ],
      inputs: ["order_ts"],
      outputs: ["date_key", "calendar_date", "year_month", "week_start"],
      rule: "Use the available order-date range and derive only the date fields needed for the exercise.",
      sql: "04_part_d2_load_dimensions.sql",
      example: "`2025-06-01` -> `date_key = 20250601`, `year_month = '2025-06'`."
    },
    {
      id: "t_dim_channel",
      step: 4,
      edgeIds: ["e12"],
      title: "Load channel dimension",
      shortTitle: "Channel keys",
      source: "staging.v_orders_latest.channel_name",
      target: "dwh.dim_channel",
      type: "MAP",
      fieldChips: ["channel_name", "channel_key"],
      visualRules: [
        ["mobile_app", "channel row"],
        ["distinct channels", "surrogate keys"]
      ],
      sqlBox: [
        "SELECT DISTINCT channel_name",
        "ON CONFLICT (channel_name) DO NOTHING"
      ],
      inputs: ["channel_name"],
      outputs: ["channel_key", "channel_name"],
      rule: "Load distinct canonical channels and generate surrogate keys.",
      sql: "04_part_d2_load_dimensions.sql",
      example: "`mobile_app` -> label `Mobile App`."
    },
    {
      id: "t_dim_product",
      step: 4,
      edgeIds: ["e13"],
      title: "Load product dimension",
      shortTitle: "Product keys",
      source: "staging.v_order_items_latest",
      target: "dwh.dim_product",
      type: "MAP",
      fieldChips: ["product_id", "product_key", "category"],
      visualRules: [
        ["product_id", "product_key"],
        ["empty category", "unknown"]
      ],
      sqlBox: [
        "INSERT INTO dwh.dim_product (...)",
        "SELECT product_id, product_name, category",
        "ON CONFLICT (product_id) DO UPDATE"
      ],
      inputs: ["product_id", "product_name", "category", "updated_at"],
      outputs: ["product_key", "product_id", "product_name", "category"],
      rule: "Use distinct product values from order lines, keep the business `product_id`, generate a surrogate `product_key`, and fill unknown names/categories when needed.",
      sql: "04_part_d2_load_dimensions.sql",
      example: "`product_id = 501` receives a `product_key` and category `electronics`."
    },
    {
      id: "t_dim_customer",
      step: 4,
      edgeIds: ["e14"],
      title: "Load current customer dimension",
      shortTitle: "Customer keys",
      source: "staging.v_customers_latest",
      target: "dwh.dim_customer",
      type: "MAP",
      fieldChips: ["customer_ref", "customer_key", "segment", "region"],
      visualRules: [
        ["customer_ref", "customer_key"],
        ["ON CONFLICT customer_ref", "update current row"]
      ],
      sqlBox: [
        "INSERT INTO dwh.dim_customer (...)",
        "SELECT customer_ref, segment, region",
        "ON CONFLICT (customer_ref) DO UPDATE"
      ],
      inputs: ["customer_ref", "full_name", "segment", "region"],
      outputs: ["customer_key", "customer_ref", "full_name", "segment", "region"],
      rule: "Load one current row per canonical `customer_ref`; update the row on rerun using `ON CONFLICT (customer_ref)`.",
      sql: "04_part_d2_load_dimensions.sql",
      example: "`user_ben_ruiz` is stored once with current segment `premium`."
    },
    {
      id: "t_fact_joins",
      step: 5,
      edgeIds: ["e15", "e16", "e17", "e18", "e19", "e20", "e21", "erd1", "erd2", "erd3", "erd4"],
      title: "Combine clean views with dimension keys",
      shortTitle: "Resolve surrogate keys",
      source: "staging.v_* + dwh.dim_*",
      target: "dwh.fact_sales",
      type: "JOIN",
      fieldChips: ["date_key", "product_key", "customer_key", "channel_key"],
      visualRules: [
        ["customer_ref_std", "customer_key"],
        ["product_id", "product_key"],
        ["channel_name", "channel_key"],
        ["order_ts::date", "date_key"]
      ],
      sqlBox: [
        "JOIN dim_customer c ON c.customer_ref = o.customer_ref_std",
        "JOIN dim_product p ON p.product_id = oi.product_id",
        "JOIN dim_date d ON d.calendar_date = o.order_ts::date"
      ],
      inputs: ["order_id", "line_id", "order_ts", "customer_ref_std", "channel_name", "product_id"],
      outputs: ["date_key", "product_key", "customer_key", "channel_key", "order_id", "line_id"],
      rule: "Join clean order lines to date, product, customer and channel dimensions, resolving business identifiers into surrogate keys.",
      sql: "05_part_d3_load_fact_sales.sql",
      example: "`o.customer_ref_std = c.customer_ref`; `oi.product_id = p.product_id`; `d.calendar_date = o.order_ts::date`."
    },
    {
      id: "t_fact_measures",
      step: 5,
      edgeIds: ["e16", "e17"],
      title: "Calculate fact measures",
      shortTitle: "Revenue formulas",
      source: "staging.v_order_items_latest + staging.v_returns_agg",
      target: "dwh.fact_sales",
      type: "CALC",
      fieldChips: ["quantity", "unit_price", "return_amount", "net_revenue"],
      visualRules: [
        ["quantity * unit_price", "gross_revenue"],
        ["gross - discount - return", "net_revenue"]
      ],
      sqlBox: [
        "gross_revenue = quantity * unit_price",
        "net_revenue = gross_revenue",
        "  - discount_amount - return_amount"
      ],
      inputs: ["quantity", "unit_price", "discount_amount", "return_amount"],
      outputs: ["gross_revenue", "discount_amount", "return_amount", "net_revenue"],
      rule: "`gross_revenue = quantity * unit_price`; `net_revenue = gross_revenue - discount_amount - return_amount`.",
      sql: "05_part_d3_load_fact_sales.sql",
      example: "Order 7001 line 2: `2 * 30 - 0 - 30 = 30 net revenue`."
    },
    {
      id: "t_fact_merge",
      step: 5,
      edgeIds: ["e15", "e16", "e17"],
      title: "Idempotent MERGE into fact_sales",
      shortTitle: "MERGE fact rows",
      source: "practice4_fact_sales_src",
      target: "dwh.fact_sales",
      type: "MERGE",
      fieldChips: ["order_id", "line_id", "MATCHED", "NOT MATCHED"],
      visualRules: [
        ["order_id + line_id", "match target row"],
        ["late return rerun", "update existing fact"]
      ],
      sqlBox: [
        "MERGE INTO dwh.fact_sales target",
        "ON target.order_id = src.order_id",
        "AND target.line_id = src.line_id"
      ],
      inputs: ["order_id", "line_id", "calculated measures"],
      outputs: ["insert new fact row", "update existing fact row"],
      rule: "Match on `order_id + line_id`; update existing rows so reruns and late returns do not duplicate facts.",
      sql: "05_part_d3_load_fact_sales.sql",
      example: "A late return updates `return_amount` and `net_revenue` for the existing order line."
    },
    {
      id: "t_analytics_daily",
      step: 6,
      edgeIds: ["e22"],
      title: "Daily revenue window KPI",
      shortTitle: "Daily cumulative",
      source: "dwh.fact_sales + dimensions",
      target: "Daily net revenue + cumulative",
      type: "WINDOW",
      fieldChips: ["net_revenue", "calendar_date", "region", "category", "OVER"],
      visualRules: [
        ["SUM(net_revenue)", "daily_net_revenue"],
        ["SUM(...) OVER", "cumulative_net_revenue"]
      ],
      sqlBox: [
        "WITH daily_revenue AS (...)",
        "SUM(daily_net_revenue) OVER (",
        "  PARTITION BY region, category ORDER BY calendar_date)"
      ],
      inputs: ["net_revenue", "calendar_date", "region", "category"],
      outputs: ["daily_net_revenue", "cumulative_net_revenue"],
      rule: "First aggregate by day, region and category, then use a window `SUM(...) OVER` for the cumulative total.",
      sql: "06_part_e_analytics_queries.sql",
      example: "Students can see why analytics should use canonical dimensions instead of source text fields."
    },
    {
      id: "t_analytics_fulfillment",
      step: 6,
      edgeIds: ["e26"],
      title: "Weekly fulfillment rank",
      shortTitle: "Fulfillment rank",
      source: "staging.v_orders_latest",
      target: "Weekly fulfillment rate + rank",
      type: "WINDOW",
      fieldChips: ["order_status", "week_start", "channel_name", "fulfillment_rate", "RANK"],
      visualRules: [
        ["completed orders / all orders", "fulfillment_rate"],
        ["RANK() OVER", "weekly_channel_rank"]
      ],
      sqlBox: [
        "WITH weekly_fulfillment AS (...)",
        "RANK() OVER (",
        "  PARTITION BY week_start ORDER BY fulfillment_rate DESC)"
      ],
      inputs: ["order_status", "order_ts", "channel_name"],
      outputs: ["fulfillment_rate", "completed_orders", "total_orders", "weekly_channel_rank"],
      rule: "`completed orders / all deduped latest orders`, grouped by week and channel, then ranked with `RANK() OVER`.",
      sql: "06_part_e_analytics_queries.sql",
      example: "This KPI reads from latest orders because its definition includes cancelled/refunded order state."
    },
    {
      id: "t_analytics_monthly_segment",
      step: 6,
      edgeIds: ["e23"],
      title: "Monthly segment revenue with LAG",
      shortTitle: "Monthly LAG",
      source: "dwh.fact_sales + dim_date + dim_customer",
      target: "Monthly segment revenue + MoM",
      type: "WINDOW",
      fieldChips: ["year_month", "segment", "monthly_net_revenue", "LAG"],
      visualRules: [
        ["SUM(net_revenue)", "monthly_net_revenue"],
        ["LAG(...) OVER", "previous month"]
      ],
      sqlBox: [
        "WITH monthly_segment_revenue AS (...)",
        "LAG(monthly_net_revenue) OVER (",
        "  PARTITION BY segment ORDER BY year_month)"
      ],
      inputs: ["net_revenue", "year_month", "customer_key"],
      outputs: ["segment", "monthly_net_revenue", "previous_month_net_revenue", "month_over_month_change"],
      rule: "Aggregate monthly revenue by segment, then use `LAG` to compare each month to the previous month.",
      sql: "06_part_e_analytics_queries.sql",
      example: "`dim_customer.segment` labels the monthly revenue result."
    },
    {
      id: "t_analytics_top_products",
      step: 6,
      edgeIds: ["e24"],
      title: "Top products with ROW_NUMBER",
      shortTitle: "Top-N products",
      source: "dwh.fact_sales + dim_product",
      target: "Top products with ROW_NUMBER",
      type: "WINDOW",
      fieldChips: ["product_id", "product_name", "category", "net_revenue_30d", "ROW_NUMBER"],
      visualRules: [
        ["SUM(net_revenue)", "net_revenue_30d"],
        ["ROW_NUMBER() OVER", "product_rank"]
      ],
      sqlBox: [
        "WITH product_revenue_30d AS (...)",
        "ROW_NUMBER() OVER (ORDER BY net_revenue_30d DESC)",
        "WHERE product_rank <= 5"
      ],
      inputs: ["net_revenue", "product_key"],
      outputs: ["product_rank", "product_id", "product_name", "net_revenue_30d"],
      rule: "Aggregate product revenue for the 30-day window, then use `ROW_NUMBER` to select the top five products.",
      sql: "06_part_e_analytics_queries.sql",
      example: "`product_key` resolves back to `product_id` and `product_name` for the report."
    },
    {
      id: "t_analytics_checkpoint",
      step: 6,
      edgeIds: ["e25"],
      title: "June 2025 validation checkpoint",
      shortTitle: "June checkpoint",
      source: "dwh.fact_sales",
      target: "June 2025 checkpoint",
      type: "AGG",
      fieldChips: ["date_key", "net_revenue", "BETWEEN 20250601 AND 20250630"],
      visualRules: [
        ["date_key range", "June 2025"],
        ["SUM(net_revenue)", "june_2025_net_revenue"]
      ],
      sqlBox: [
        "SELECT SUM(net_revenue)",
        "FROM dwh.fact_sales",
        "WHERE date_key BETWEEN 20250601 AND 20250630"
      ],
      inputs: ["date_key", "net_revenue"],
      outputs: ["june_2025_net_revenue"],
      rule: "Keep the direct `date_key` filter so the example remains partition-pruning friendly.",
      sql: "06_part_e_analytics_queries.sql",
      example: "`date_key BETWEEN 20250601 AND 20250630` avoids casting the fact column."
    }
  ]
};
