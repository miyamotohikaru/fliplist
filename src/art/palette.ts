// 色。ファミコンの実機が出せた色域と、当時のカセット外装の樹脂色に寄せてある。

/** 版面（紙）の色。真っ白にするとドット絵が浮かないので、少し温かい生成りにする。 */
export const PAPER = {
  base: "#efeadc",
  deep: "#e5dfcd",
  rule: "#c8c0aa",
  ruleFaint: "#dcd5c1",
  ink: "#1b1a17",
  inkSoft: "#5c574c",
  accent: "#2b4ea2", // カタログの見出しに使う青
  accentWarm: "#d8452f",
  highlight: "#f6c945",
  shadow: "#00000026",
};

/** NES が出せた色から、絵に使いやすいものを抜き出したもの。 */
export const NES = {
  black: "#0d0b0e",
  dark: "#1c1a25",
  gray1: "#3d3d46",
  gray2: "#6b6b74",
  gray3: "#a5a5ad",
  gray4: "#d6d6da",
  white: "#fcfcfc",
  navy: "#1b2a6b",
  blue: "#2038ec",
  blueLt: "#3cbcfc",
  cyan: "#00b7bf",
  cyanLt: "#a8f0f8",
  teal: "#007864",
  green: "#008a2e",
  greenLt: "#4cdc48",
  lime: "#b8f818",
  olive: "#5c6b1c",
  yellow: "#f8d818",
  gold: "#e0a018",
  orange: "#e45c10",
  brown: "#8a5320",
  brownDk: "#503216",
  red: "#d82800",
  redDk: "#901000",
  maroon: "#6b0f1a",
  pink: "#f878b8",
  pinkLt: "#fcc2d8",
  magenta: "#b53190",
  purple: "#6844a8",
  violet: "#9c6cf0",
  cream: "#f6e9c8",
  skin: "#fcbc90",
};

export type ShellColors = {
  /** 前面のプラスチック */
  face: string;
  /** 上面のあたる光 */
  light: string;
  /** いちばん明るいエッジ */
  lightest: string;
  /** 下面と側面の陰 */
  dark: string;
  /** 輪郭の1px */
  edge: string;
  /** 外装に直接刻まれた文字（型番など） */
  emboss: string;
  /** ラベル凹部の落ち影 */
  recess: string;
};

/**
 * 外装色。実機の樹脂色に倣って、彩度が高く明度差が小さい。
 * face を基準に light/dark を作らず一つずつ指定しているのは、
 * 機械的に生成すると全部同じ質感に見えてしまうため。
 */
export const SHELLS: Record<string, ShellColors> = {
  // 黒は面の階調が暗いほうに詰まって、形が読めない板になりやすい。
  // 実測（tools/measure.mjs）で16色中いちばん階調幅が狭かったので、
  // 黒に見える範囲を保ったまま、面と当たりだけを持ち上げてある。
  black: {
    face: "#302c39",
    light: "#4b4759",
    lightest: "#6a6579",
    dark: "#17151d",
    edge: "#08070a",
    emboss: "#6b6679",
    recess: "#0e0d11",
  },
  // 生成りの紙の上に置くので、明るい外装ほど輪郭を強く取らないと形が溶ける。
  white: {
    // 紙(#efeadc)より明るくないと「白いカセット」に見えず輪郭線の絵になる
    face: "#f3f0e5",
    light: "#fbf9f2",
    lightest: "#fffefb",
    dark: "#d2ccb8",
    edge: "#4e4a3d",
    emboss: "#b0aa96",
    recess: "#bab4a0",
  },
  cream: {
    face: "#e8d6a4",
    light: "#f4e7c1",
    lightest: "#fdf5da",
    dark: "#c2ac76",
    edge: "#5c4a24",
    emboss: "#9c8a58",
    recess: "#a89561",
  },
  red: {
    face: "#c22e26",
    light: "#dd4a3a",
    lightest: "#ef6a55",
    dark: "#8f1b18",
    edge: "#5c0f0e",
    emboss: "#e06a58",
    recess: "#6d1211",
  },
  maroon: {
    face: "#8c2434",
    light: "#a63a48",
    lightest: "#c15461",
    dark: "#611420",
    edge: "#3b0a12",
    emboss: "#b05663",
    recess: "#4a0e17",
  },
  orange: {
    face: "#dd7a22",
    light: "#ee9640",
    lightest: "#f9b062",
    dark: "#a85512",
    edge: "#70360a",
    emboss: "#f3ab63",
    recess: "#82400c",
  },
  yellow: {
    face: "#e3b93a",
    light: "#f2d05a",
    lightest: "#fbe382",
    dark: "#b28c22",
    edge: "#7b5f12",
    emboss: "#f7dd7c",
    recess: "#8f7018",
  },
  lime: {
    face: "#a8c62e",
    light: "#c1dc4c",
    lightest: "#d8ec74",
    dark: "#7e991c",
    edge: "#52660f",
    emboss: "#d2e86e",
    recess: "#607414",
  },
  green: {
    face: "#2f8a48",
    light: "#46a35d",
    lightest: "#63bd78",
    dark: "#1d6432",
    edge: "#0e3f1e",
    emboss: "#69c07d",
    recess: "#144e26",
  },
  skyblue: {
    face: "#5aa8d8",
    light: "#7ac2ea",
    lightest: "#9dd8f5",
    dark: "#3d80ab",
    edge: "#24557a",
    emboss: "#a4dbf6",
    recess: "#2c6288",
  },
  navy: {
    face: "#2b3f7a",
    light: "#3f5695",
    lightest: "#5870b0",
    dark: "#1c2b57",
    edge: "#0e1734",
    emboss: "#5f77b6",
    recess: "#141f42",
  },
  purple: {
    face: "#6a4a9c",
    light: "#8462b6",
    lightest: "#9d7ecd",
    dark: "#4c3373",
    edge: "#2c1b47",
    emboss: "#a184d1",
    recess: "#37244f",
  },
  pink: {
    face: "#dd7fa4",
    light: "#ec9bb9",
    lightest: "#f7b8cf",
    dark: "#b25c7f",
    edge: "#7c3a55",
    emboss: "#f6bcd1",
    recess: "#8c4462",
  },
  brown: {
    face: "#8a5f37",
    light: "#a3764a",
    lightest: "#bd9163",
    dark: "#644022",
    edge: "#3d2611",
    emboss: "#c0956a",
    recess: "#4a2e17",
  },
  gray: {
    face: "#9a9a96",
    light: "#b4b4af",
    lightest: "#cdcdc8",
    dark: "#75756f",
    edge: "#4c4c47",
    emboss: "#c9c9c4",
    recess: "#5b5b56",
  },
  slate: {
    face: "#4d5a66",
    light: "#65727f",
    lightest: "#7f8c99",
    dark: "#36404a",
    edge: "#1d242b",
    emboss: "#88949f",
    recess: "#252d35",
  },
};

export function shell(name: string): ShellColors {
  return SHELLS[name] ?? SHELLS.gray;
}
