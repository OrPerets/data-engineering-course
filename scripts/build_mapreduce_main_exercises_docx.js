const fs = require("fs");
const path = require("path");
const {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  Math: DocxMath,
  MathFraction,
  MathRun,
  MathSubScript,
  MathSum,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  WidthType,
} = require("docx");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "exercises", "mapreduce_main_exercises.docx");
const CONTENT_WIDTH = 9026; // A4 width with 1 inch margins: 11906 - 2880

const border = { style: BorderStyle.SINGLE, size: 1, color: "C9D3DF" };
const borders = { top: border, bottom: border, left: border, right: border };

function tr(text, options = {}) {
  return new TextRun({ text, font: "Arial", size: options.size || 22, ...options });
}

function para(text, options = {}) {
  return new Paragraph({
    spacing: { before: options.before || 0, after: options.after ?? 120, line: 276 },
    alignment: options.alignment,
    children: [tr(text, options.run || {})],
  });
}

function codePara(text) {
  return new Paragraph({
    spacing: { before: 30, after: 80 },
    shading: { fill: "F4F7FA", type: ShadingType.CLEAR },
    border: {
      left: { style: BorderStyle.SINGLE, size: 12, color: "3E6C8F", space: 4 },
    },
    children: [new TextRun({ text, font: "Courier New", size: 20 })],
  });
}

function mr(text) {
  return new MathRun(text);
}

function msub(base, sub) {
  return new MathSubScript({ children: [mr(base)], subScript: [mr(sub)] });
}

function frac(numerator, denominator) {
  return new MathFraction({
    numerator: Array.isArray(numerator) ? numerator : [mr(numerator)],
    denominator: Array.isArray(denominator) ? denominator : [mr(denominator)],
  });
}

function equation(children, caption) {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 90, after: caption ? 30 : 120 },
      children: [new DocxMath({ children })],
    }),
    ...(caption
      ? [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [tr(caption, { italics: true, color: "52616F", size: 18 })],
          }),
        ]
      : []),
  ];
}

function heading(text, level = 1) {
  return new Paragraph({
    heading: level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
    spacing: { before: level === 1 ? 320 : 220, after: 120 },
    children: [tr(text, { bold: true, size: level === 1 ? 32 : level === 2 ? 27 : 24 })],
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { after: 60 },
    children: [tr(text)],
  });
}

function numbered(text) {
  return new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    spacing: { after: 60 },
    children: [tr(text)],
  });
}

function cell(text, width, header = false) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: header ? { fill: "DCEBF3", type: ShadingType.CLEAR } : undefined,
    margins: { top: 90, bottom: 90, left: 120, right: 120 },
    children: [
      new Paragraph({
        spacing: { after: 0 },
        children: [tr(String(text), { bold: header, size: 20 })],
      }),
    ],
  });
}

function table(headers, rows, widths) {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, widths[i], true)) }),
      ...rows.map((row) => new TableRow({ children: row.map((v, i) => cell(v, widths[i], false)) })),
    ],
  });
}

function kvTable(rows) {
  return table(["Stage", "Key", "Value / Action"], rows, [2100, 2500, CONTENT_WIDTH - 4600]);
}

function diagram(relativePath, width, height, caption) {
  const abs = path.join(ROOT, relativePath);
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 60 },
      children: [
        new ImageRun({
          type: "png",
          data: fs.readFileSync(abs),
          transformation: { width, height },
          altText: { title: caption, description: caption, name: path.basename(relativePath) },
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [tr(caption, { italics: true, color: "52616F", size: 19 })],
    }),
  ];
}

function phaseBlock(title, rows, flow) {
  return [
    heading(title, 3),
    kvTable(rows),
    para("Flow", { before: 120, run: { bold: true } }),
    ...flow.map(numbered),
  ];
}

function exerciseFiltering() {
  return [
    heading("Exercise 1: Filtering Pattern - Count Errors by Service", 1),
    para("Problem definition", { run: { bold: true } }),
    para("A fleet of API services produces large request logs. The goal is to count only server-side errors, defined as rows with status code 500 or higher, grouped by service name. The important MapReduce design choice is to filter in the mapper so that successful requests are never sent through the shuffle."),
    ...equation(
      [
        msub("Err", "service"),
        mr(" = "),
        new MathSum({
          subScript: [mr("r in logs")],
          superScript: [mr("")],
          children: [mr("1["), msub("status", "r"), mr(" ≥ 500 ∧ "), msub("service", "r"), mr(" = service]")],
        }),
      ],
      "Filtering objective: count only records that satisfy the error condition for each service.",
    ),
    para("Input example", { run: { bold: true } }),
    table(
      ["ts", "service", "status", "latency_ms"],
      [
        ["10:00", "auth", "200", "35"],
        ["10:01", "auth", "500", "120"],
        ["10:02", "cart", "404", "22"],
        ["10:03", "cart", "500", "300"],
        ["10:04", "search", "200", "18"],
        ["10:05", "search", "500", "210"],
      ],
      [1800, 2400, 2200, CONTENT_WIDTH - 6400],
    ),
    para("Expected output", { before: 140, run: { bold: true } }),
    table(
      ["service", "error_count"],
      [["auth", "1"], ["cart", "1"], ["search", "1"]],
      [4500, CONTENT_WIDTH - 4500],
    ),
    ...phaseBlock(
      "Mapper, Reducer, and Flow",
      [
        ["Mapper", "service", "Emit (service, 1) only when status >= 500; emit nothing otherwise."],
        ["Shuffle", "service", "Group all emitted 1 values by service."],
        ["Reducer", "service", "Sum values and emit service<TAB>error_count."],
      ],
      [
        "Map reads each log row and applies the status filter locally.",
        "Only error records produce key/value pairs: (auth, 1), (cart, 1), and (search, 1).",
        "Shuffle groups keys such as auth -> [1] and cart -> [1].",
        "Reduce sums the values per service. A combiner is safe because count is associative and commutative.",
      ],
    ),
    ...diagram("diagrams/week7/week7_filtering_pattern_flow.png", 430, 334, "Filtering pattern: mapper-side filtering reduces shuffle volume."),
  ];
}

function exerciseInvertedIndex() {
  return [
    heading("Exercise 2: Inverted Index - Term to Document Postings", 1),
    para("Problem definition", { run: { bold: true } }),
    para("Given a document collection, build an inverted index that maps each term to the documents containing it and the term frequency in each document. This is the core MapReduce pattern behind search indexing: mappers scan documents independently, while reducers aggregate term/document counts."),
    ...equation(
      [
        mr("tf(t,d) = "),
        new MathSum({
          subScript: [mr("token in d")],
          superScript: [mr("")],
          children: [mr("1[token = t]")],
        }),
      ],
      "Term frequency: count how many times term t appears in document d.",
    ),
    para("Input example", { run: { bold: true } }),
    table(
      ["doc_id", "text"],
      [
        ["1", "data engineering is fun and practical"],
        ["2", "data pipelines need reliable data quality"],
        ["3", "mapreduce is practical for large scale data processing"],
        ["4", "quality matters in data engineering pipelines"],
      ],
      [1400, CONTENT_WIDTH - 1400],
    ),
    para("Expected output examples", { before: 140, run: { bold: true } }),
    table(
      ["term", "postings"],
      [
        ["data", "1:1,2:2,3:1,4:1"],
        ["engineering", "1:1,4:1"],
        ["pipelines", "2:1,4:1"],
        ["quality", "2:1,4:1"],
      ],
      [2500, CONTENT_WIDTH - 2500],
    ),
    ...phaseBlock(
      "Mapper, Reducer, and Flow",
      [
        ["Mapper", "(term, doc_id)", "For each token occurrence, emit ((term, doc_id), 1). Duplicates are kept."],
        ["Shuffle", "(term, doc_id)", "Group all occurrences of the same term inside the same document."],
        ["Reducer", "term", "Sum counts for each (term, doc_id), then format postings sorted by doc_id."],
      ],
      [
        "Map tokenizes each document using fixed rules: lowercase, whitespace split, no stemming, duplicates kept.",
        "For document 2, data appears twice, so the mapper emits ((data, 2), 1) twice.",
        "Shuffle produces groups such as (data, 2) -> [1, 1] and (quality, 4) -> [1].",
        "Reduce sums each group into term frequency and writes posting lists such as data<TAB>1:1,2:2,3:1,4:1.",
        "A combiner is useful for local summation, but it should not build final posting strings.",
      ],
    ),
    ...diagram("diagrams/week7/week7_inverted_index_flow.png", 500, 326, "Inverted index flow: token occurrences become grouped term-document counts."),
  ];
}

function exerciseMatrixVector() {
  return [
    heading("Exercise 3: Matrix-Vector Multiplication - Two-Phase Job", 1),
    para("Problem definition", { run: { bold: true } }),
    para("A sparse feature matrix A contains feature values A[i,j] for row i and column j, and a vector v contains weights v[j]. The goal is to compute y[i] = sum_j A[i,j] * v[j]. The MapReduce solution needs two logical phases because the join is by column j, while the final sum is by row i."),
    ...equation(
      [
        msub("y", "i"),
        mr(" = "),
        new MathSum({
          subScript: [mr("j")],
          superScript: [mr("")],
          children: [msub("A", "i,j"), mr(" · "), msub("v", "j")],
        }),
      ],
      "Matrix-vector objective: each output row is the sum of feature values multiplied by vector weights.",
    ),
    para("Input example: sparse matrix A", { run: { bold: true } }),
    table(
      ["i", "j", "A[i,j]"],
      [["1", "1", "2"], ["1", "3", "1"], ["2", "1", "4"], ["2", "2", "5"], ["3", "3", "3"]],
      [2200, 2200, CONTENT_WIDTH - 4400],
    ),
    para("Input example: vector v", { before: 140, run: { bold: true } }),
    table(["j", "v[j]"], [["1", "10"], ["2", "1"], ["3", "2"]], [4500, CONTENT_WIDTH - 4500]),
    para("Expected output", { before: 140, run: { bold: true } }),
    table(["i", "y[i]"], [["1", "22"], ["2", "45"], ["3", "6"]], [4500, CONTENT_WIDTH - 4500]),
    ...phaseBlock(
      "Phase 1: Join Matrix Entries with Vector Values",
      [
        ["Mapper", "j", "Matrix record -> (j, (A, i, A[i,j])); vector record -> (j, (V, v[j]))."],
        ["Shuffle", "j", "Group matrix entries and the matching vector value by the same column index."],
        ["Reducer", "i", "For each matrix entry at column j, emit (i, A[i,j] * v[j])."],
      ],
      [
        "For j = 1, shuffle groups [(A, 1, 2), (A, 2, 4), (V, 10)].",
        "The reducer multiplies 2*10 and 4*10, emitting (1, 20) and (2, 40).",
      ],
    ),
    ...equation(
      [msub("p", "i,j"), mr(" = "), msub("A", "i,j"), mr(" · "), msub("v", "j")],
      "Phase 1 emits partial products p_i,j keyed by row i.",
    ),
    ...phaseBlock(
      "Phase 2: Sum Partial Products by Row",
      [
        ["Mapper", "i", "Identity mapper passes (i, partial_product)."],
        ["Shuffle", "i", "Group all partial products for the same output row."],
        ["Reducer", "i", "Sum partials to emit final y[i]."],
      ],
      [
        "Shuffle groups row 1 -> [20, 2], row 2 -> [40, 5], and row 3 -> [6].",
        "Reducers emit y[1] = 22, y[2] = 45, and y[3] = 6.",
        "A combiner is not useful in phase 1, but it is safe in phase 2 because summation is associative and commutative.",
      ],
    ),
    ...equation(
      [
        msub("y", "1"),
        mr(" = 2 · 10 + 1 · 2 = 22;  "),
        msub("y", "2"),
        mr(" = 4 · 10 + 5 · 1 = 45;  "),
        msub("y", "3"),
        mr(" = 3 · 2 = 6"),
      ],
      "Numeric check for the sample matrix and vector.",
    ),
    ...diagram("diagrams/week7/week7_matrix_vector_two_phase.png", 410, 480, "Matrix-vector multiplication: first join by j, then aggregate by i."),
  ];
}

function exercisePageRank() {
  return [
    heading("Exercise 4: PageRank - One Iteration with Damping", 1),
    para("Problem definition", { run: { bold: true } }),
    para("An internal wiki is represented as a directed graph. Each page starts with equal rank, and one PageRank iteration redistributes rank through outgoing links while applying damping. Dangling pages with no outgoing links must be handled explicitly so that rank mass is not lost."),
    ...equation(
      [
        msub("PR", "1"),
        mr("(p) = "),
        frac("1 - d", "N"),
        mr(" + d · ("),
        msub("S", "in"),
        mr("(p) + "),
        frac("D", "N"),
        mr(")"),
      ],
      "PageRank update with damping; D is total dangling mass and S_in(p) is incoming contribution mass.",
    ),
    para("Input example", { run: { bold: true } }),
    table(
      ["from_page", "to_page"],
      [["A", "B"], ["A", "C"], ["B", "C"], ["C", "A"]],
      [4500, CONTENT_WIDTH - 4500],
    ),
    para("Pages: A, B, C, D. Page D is dangling. Initial PR0 = 0.25 for each page; N = 4; damping d = 0.85."),
    para("Expected output after one iteration", { before: 140, run: { bold: true } }),
    table(
      ["page", "PR1"],
      [["A", "0.3031"], ["B", "0.1969"], ["C", "0.4094"], ["D", "0.0906"]],
      [4500, CONTENT_WIDTH - 4500],
    ),
    ...phaseBlock(
      "Mapper, Reducer, and Flow",
      [
        ["Mapper", "to_page", "For each outlink, emit (to_page, rank/out_degree). Also emit (page, adjacency_list)."],
        ["Dangling handling", "global mass", "For a dangling page, preserve its empty adjacency list and add its rank to dangling_mass."],
        ["Shuffle", "page", "Group incoming contributions and the page adjacency list."],
        ["Reducer", "page", "Sum incoming contributions, add dangling_mass/N, apply damping, and emit the updated rank."],
      ],
      [
        "Page A emits (B, 0.125), (C, 0.125), and (A, [B, C]).",
        "Page D emits (D, []) and contributes 0.25 to dangling mass.",
        "Reducer C receives 0.125 from A, 0.25 from B, and adjacency list [A].",
        "With dangling share 0.25/4 = 0.0625 and base term (1-0.85)/4 = 0.0375, C becomes 0.0375 + 0.85*(0.375 + 0.0625) = 0.4094.",
        "A combiner can sum numeric contributions, but it must pass adjacency lists through unchanged.",
      ],
    ),
    ...equation(
      [
        msub("PR", "1"),
        mr("(C) = "),
        frac("1 - 0.85", "4"),
        mr(" + 0.85 · (0.375 + "),
        frac("0.25", "4"),
        mr(") = 0.4094"),
      ],
      "Numeric substitution for page C.",
    ),
    ...diagram("diagrams/week7/week7_pagerank_iteration_flow.png", 455, 422, "PageRank iteration: contributions, dangling mass, and adjacency preservation."),
  ];
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 }, paragraph: { spacing: { line: 276 } } } },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: "17324D" },
        paragraph: { spacing: { before: 320, after: 120 }, outlineLevel: 0 },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 27, bold: true, font: "Arial", color: "234C6B" },
        paragraph: { spacing: { before: 220, after: 120 }, outlineLevel: 1 },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: "2B5C7E" },
        paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
      {
        reference: "numbers",
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: "%1.",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "A8B7C7", space: 1 } },
              children: [tr("MapReduce Exercises", { size: 18, color: "52616F" })],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [tr("Page ", { size: 18, color: "52616F" }), new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 18, color: "52616F" })],
            }),
          ],
        }),
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 120 },
          children: [tr("MapReduce: Four Worked Exercises", { bold: true, size: 40, color: "17324D" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 260 },
          children: [tr("Problem definitions, input/output examples, mapper-reducer steps, and visual flow diagrams", { size: 22, color: "52616F" })],
        }),
        para("This handout consolidates four core MapReduce exercises from the course exercise bank and the Week 7 MapReduce deck. Each exercise is written as a worked solution: first the problem and concrete data, then the expected output, then the mapper, shuffle, reducer, and flow decisions that make the solution correct."),
        heading("Contents", 1),
        new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }),
        heading("Exercise Set", 1),
        ...equation(
          [mr("Map: ("), msub("k", "1"), mr(", "), msub("v", "1"), mr(") → [("), msub("k", "2"), mr(", "), msub("v", "2"), mr(")]")],
          "Map stage: transform input records into intermediate key/value pairs.",
        ),
        ...equation(
          [mr("Reduce: ("), msub("k", "2"), mr(", ["), msub("v", "2"), mr("]) → [("), msub("k", "3"), mr(", "), msub("v", "3"), mr(")]")],
          "Reduce stage: aggregate all values for each intermediate key.",
        ),
        ...equation(
          [msub("C", "shuffle"), mr(" = E · s")],
          "Shuffle cost model: emitted pair count times average serialized pair size.",
        ),
        bullet("Filtering pattern: count service errors while reducing shuffle traffic."),
        bullet("Inverted index: build term-to-document posting lists."),
        bullet("Matrix-vector multiplication: compute y = A v using two MapReduce phases."),
        bullet("PageRank: run one graph-ranking iteration with damping and dangling-node handling."),
        ...exerciseFiltering(),
        ...exerciseInvertedIndex(),
        ...exerciseMatrixVector(),
        ...exercisePageRank(),
        heading("Source Alignment", 1),
        para("The structure mirrors the four canonical examples in build/07-map-reduce.pptx and uses the richer step-by-step examples from exercises/mapreduce_filtering_pattern_practice.md, exercises/mapreduce_inverted_index_practice.md, exercises/mapreduce_matrix_vector_multiplication_practice.md, and exercises/mapreduce_pagerank_practice.md."),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(OUT, buffer);
  console.log(OUT);
});
