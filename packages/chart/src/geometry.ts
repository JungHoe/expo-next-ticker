/**
 * 차트 좌표 계산. 웹(<svg>)과 앱(react-native-svg)이 같은 결과로 각자 그린다.
 * 규칙: docs/spec/stock-detail.md §2(차트 규칙), docs/spec/market-data.md §3(차트 좌표 계산)
 */

export type ChartPoint = { t: number; p: number };

export type ChartInput = {
  points: readonly ChartPoint[];
  /** 그릴 영역(축 라벨 자리를 뺀 크기) */
  width: number;
  height: number;
  /** 기준가. 범위 안일 때만 y 좌표를 준다 */
  reference?: number;
  /** x축 라벨 최대 개수. 기본 4 */
  maxXLabels?: number;
};

export type ChartGeometry = {
  /** SVG path d. "M x y L x y ..." */
  path: string;
  yTicks: { value: number; y: number }[];
  xLabels: { t: number; x: number; text: string }[];
  referenceY: number | null;
  last: { x: number; y: number } | null;
  domain: { min: number; max: number } | null;
};

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const KST_OFFSET = 9 * HOUR;

/**
 * 눈금 간격 = m × 10ⁿ. 간격을 작은 것부터 키우며 처음으로 5개 이하가 되는 간격을 쓴다.
 * 그 간격의 눈금은 항상 3개 이상이다: 바로 앞 간격에서 6개 이상이었다면, 연속한 1의 배수 6개에는
 * 2의 배수가, 2의 배수 6개(폭 10)에는 2.5의 배수가, 2.5·5의 배수 6개에는 5·10의 배수가 3개 이상 있다.
 */
const NICE_MANTISSAS = [1, 2, 2.5, 5];
const TIME_STEPS = [
  MINUTE,
  5 * MINUTE,
  10 * MINUTE,
  15 * MINUTE,
  30 * MINUTE,
  HOUR,
  2 * HOUR,
  3 * HOUR,
  6 * HOUR,
  12 * HOUR,
  DAY,
  2 * DAY,
  3 * DAY,
  7 * DAY,
  14 * DAY,
];

const EMPTY: ChartGeometry = {
  path: "",
  yTicks: [],
  xLabels: [],
  referenceY: null,
  last: null,
  domain: null,
};

const round = (v: number, digits: number) => Number(v.toFixed(digits)) + 0;
const pad2 = (n: number) => String(n).padStart(2, "0");

function ticksWithStep(min: number, max: number, step: number): number[] {
  const values: number[] = [];
  for (let k = Math.floor(min / step); k <= Math.ceil(max / step); k++) {
    const value = round(k * step, 10);
    if (value >= min && value <= max) values.push(value);
  }
  return values;
}

/** [min, max] 안의 등간격 눈금 3~5개 */
function niceTicks(min: number, max: number): number[] {
  // 10^(자릿수-2)부터 시작하면 처음 간격의 눈금은 100개 이상, 10^(자릿수+1)이면 1개 이하
  const magnitude = Math.floor(Math.log10(max - min));
  for (let e = magnitude - 2; e <= magnitude + 1; e++) {
    for (const m of NICE_MANTISSAS) {
      const values = ticksWithStep(min, max, m * 10 ** e);
      if (values.length <= 5) return values;
    }
  }
  throw new Error(`눈금을 만들 수 없는 범위입니다: ${min}~${max}`);
}

function formatKst(t: number, step: number): string {
  const kst = new Date(t + KST_OFFSET);
  return step < DAY
    ? `${pad2(kst.getUTCHours())}:${pad2(kst.getUTCMinutes())}`
    : `${kst.getUTCMonth() + 1}/${kst.getUTCDate()}`;
}

/** 하루보다 짧은 간격은 KST 시계 경계에, 날짜 간격은 가장 최근 0시부터 거꾸로 */
function timeLabelTimes(start: number, end: number, step: number): number[] {
  const times: number[] = [];
  if (step < DAY) {
    const first = Math.ceil((start + KST_OFFSET) / step) * step - KST_OFFSET;
    for (let t = first; t <= end; t += step) times.push(t);
    return times;
  }
  const lastMidnight = Math.floor((end + KST_OFFSET) / DAY) * DAY - KST_OFFSET;
  for (let t = lastMidnight; t >= start; t -= step) times.unshift(t);
  return times;
}

export function chartGeometry({
  points: input,
  width,
  height,
  reference,
  maxXLabels = 4,
}: ChartInput): ChartGeometry {
  // 오염된 응답 하나 때문에 차트 전체가 죽지 않게 유한한 점만 쓴다
  const points = input.filter(
    (point) => Number.isFinite(point.t) && Number.isFinite(point.p),
  );
  const first = points[0];
  const lastPoint = points.at(-1);
  if (!first || !lastPoint) return EMPTY;

  const prices = points.map((point) => point.p);
  const dataMin = Math.min(...prices);
  const dataMax = Math.max(...prices);
  let min = dataMin;
  let max = dataMax;
  // 값이 같거나 부동소수점 한계만큼만 다르면 가운데에 수평선으로 그린다
  if (max - min <= Math.max(Math.abs(min), Math.abs(max)) * 1e-9) {
    const center = (min + max) / 2;
    const pad = Math.max(Math.abs(center) * 0.001, 0.01);
    min = center - pad;
    max = center + pad;
  }

  const start = first.t;
  const end = lastPoint.t;
  const span = end - start;
  const xOf = (t: number) =>
    span === 0 ? width : ((t - start) / span) * width;
  const yOf = (p: number) => ((max - p) / (max - min)) * height;

  const xy = points.map((point) => ({
    x: round(xOf(point.t), 2),
    y: round(yOf(point.p), 2),
  }));
  const path = xy
    .map(({ x, y }, i) => `${i === 0 ? "M" : "L"}${x} ${y}`)
    .join(" ");

  const yTicks = niceTicks(min, max).map((value) => ({ value, y: yOf(value) }));

  let xLabels: ChartGeometry["xLabels"] = [];
  if (span > 0) {
    const step = TIME_STEPS.find(
      (s) => timeLabelTimes(start, end, s).length <= maxXLabels,
    );
    if (step !== undefined) {
      xLabels = timeLabelTimes(start, end, step).map((t) => ({
        t,
        x: xOf(t),
        text: formatKst(t, step),
      }));
    }
  }

  const referenceY =
    reference !== undefined && reference >= dataMin && reference <= dataMax
      ? yOf(reference)
      : null;

  return {
    path,
    yTicks,
    xLabels,
    referenceY,
    last: xy.at(-1) ?? null,
    domain: { min, max },
  };
}

/** 그림 영역 둘레 여백(px). 극값의 선 두께·마지막 점이 잘리지 않게, 오른쪽은 y축 값 자리 */
export const CHART_MARGIN = { top: 8, right: 64, bottom: 28, left: 4 } as const;
/** 마지막 점 반지름(px). 지름 6px(stock-detail.md §2) */
export const LAST_POINT_RADIUS = 3;

const EDGE = 24;

/** x 라벨이 양 끝 24px 안이면 영역 밖으로 넘치지 않게 바깥쪽으로 붙인다 */
export function xLabelAnchor(
  x: number,
  width: number,
): "start" | "middle" | "end" {
  if (x < EDGE) return "start";
  if (x > width - EDGE) return "end";
  return "middle";
}

/** 기준가 라벨 y(글자 기준선). 선 위 6px, 위쪽 경계 가까이면 선 아래 14px */
export function referenceLabelY(referenceY: number): number {
  return referenceY < 14 ? referenceY + 14 : referenceY - 6;
}
