import { describe, expect, test } from "vitest";
import {
  CHART_MARGIN,
  type ChartPoint,
  chartGeometry,
  LAST_POINT_RADIUS,
  referenceLabelY,
  xLabelAnchor,
} from "./geometry";

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
// 2026-11-08 15:07:30 KST
const END = Date.UTC(2026, 10, 8, 6, 7, 30);
const WIDTH = 600;
const HEIGHT = 200;

function series(values: number[], step: number, end = END): ChartPoint[] {
  return values.map((p, i) => ({ t: end - (values.length - 1 - i) * step, p }));
}

/** "M0 200 L10.5 3 ..." → [[0,200],[10.5,3],...] */
function coords(path: string): [number, number][] {
  return [...path.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((m) => [
    Number(m[1]),
    Number(m[2]),
  ]);
}

const wave = Array.from({ length: 121 }, (_, i) => 230 + Math.sin(i / 7) * 1.6);

describe("경로", () => {
  const g = chartGeometry({
    points: series(wave, 30 * SECOND),
    width: WIDTH,
    height: HEIGHT,
  });

  test("점마다 좌표가 하나씩 있고, 모두 영역 안에 있다", () => {
    const xy = coords(g.path);
    expect(g.path.startsWith("M")).toBe(true);
    expect(xy).toHaveLength(wave.length);
    for (const [x, y] of xy) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(WIDTH);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(HEIGHT);
    }
  });

  test("최댓값은 위쪽 경계(y=0), 최솟값은 아래쪽 경계(y=height)에 닿는다", () => {
    const ys = coords(g.path).map(([, y]) => y);
    expect(Math.min(...ys)).toBe(0);
    expect(Math.max(...ys)).toBe(HEIGHT);
    expect(g.domain).toEqual({
      min: Math.min(...wave),
      max: Math.max(...wave),
    });
  });

  test("첫 점은 왼쪽 경계, 마지막 점은 오른쪽 경계다", () => {
    const xs = coords(g.path).map(([x]) => x);
    expect(xs[0]).toBe(0);
    expect(xs.at(-1)).toBe(WIDTH);
  });

  test("마지막 점의 좌표를 따로 준다", () => {
    expect(g.last).toEqual({ x: WIDTH, y: coords(g.path).at(-1)?.[1] });
  });

  test("x는 시각에 비례한다(간격이 다른 마지막 점도 제자리에)", () => {
    const pts = series([1, 2, 3], 30 * SECOND);
    const lastT = (pts.at(-1)?.t ?? 0) + 10 * SECOND;
    pts.push({ t: lastT, p: 2 });
    const xs = coords(
      chartGeometry({ points: pts, width: 70, height: 10 }).path,
    ).map(([x]) => x);
    expect(xs).toEqual([0, 30, 60, 70]);
  });
});

describe("y축 눈금", () => {
  test.each([
    [229.42, 231.07],
    [0.5, 0.51],
    [100, 1000],
    [205.12, 260.19],
    [139.9, 140.02],
    [418.0, 418.3],
    [1.01, 1.09],
  ])("범위 %d~%d에서 3~5개, 범위 안, 등간격", (min, max) => {
    const g = chartGeometry({
      points: series([min, max, (min + max) / 2], MINUTE),
      width: WIDTH,
      height: HEIGHT,
    });
    const values = g.yTicks.map((tick) => tick.value);
    expect(values.length).toBeGreaterThanOrEqual(3);
    expect(values.length).toBeLessThanOrEqual(5);
    for (const tick of g.yTicks) {
      expect(tick.value).toBeGreaterThanOrEqual(min);
      expect(tick.value).toBeLessThanOrEqual(max);
      expect(tick.y).toBeCloseTo(
        ((max - tick.value) / (max - min)) * HEIGHT,
        6,
      );
    }
    const gaps = values.slice(1).map((v, i) => v - (values[i] ?? Number.NaN));
    for (const gap of gaps) expect(gap).toBeCloseTo(gaps[0] ?? Number.NaN, 9);
  });

  test("무작위 범위 2만 개에서도 항상 3~5개다(눈금 간격 선택 규칙의 성질)", () => {
    let seed = 7;
    const random = () => {
      seed = (seed * 16_807) % 2_147_483_647;
      return seed / 2_147_483_647;
    };
    for (let i = 0; i < 20_000; i++) {
      const min = Math.round(random() * 100_000) / 100;
      const max = min + Math.round(random() * 5_000 + 1) / 100;
      const g = chartGeometry({
        points: series([min, max], MINUTE),
        width: WIDTH,
        height: HEIGHT,
      });
      expect(g.yTicks.length).toBeGreaterThanOrEqual(3);
      expect(g.yTicks.length).toBeLessThanOrEqual(5);
    }
  });

  test("값이 모두 같으면 선은 가운데, 눈금은 3~5개", () => {
    const g = chartGeometry({
      points: series([231.42, 231.42, 231.42], MINUTE),
      width: WIDTH,
      height: HEIGHT,
    });
    for (const [, y] of coords(g.path)) expect(y).toBe(HEIGHT / 2);
    expect(g.yTicks.length).toBeGreaterThanOrEqual(3);
    expect(g.yTicks.length).toBeLessThanOrEqual(5);
  });
});

describe("기준값", () => {
  const points = series([229, 231, 230], MINUTE);

  test("범위 안이면 y 좌표를 준다", () => {
    const g = chartGeometry({
      points,
      width: WIDTH,
      height: HEIGHT,
      reference: 230,
    });
    expect(g.referenceY).toBe(HEIGHT / 2);
  });

  test("범위 밖이면 null이다", () => {
    for (const reference of [228.99, 231.01]) {
      const g = chartGeometry({
        points,
        width: WIDTH,
        height: HEIGHT,
        reference,
      });
      expect(g.referenceY).toBeNull();
    }
  });

  test("주지 않으면 null이다", () => {
    expect(
      chartGeometry({ points, width: WIDTH, height: HEIGHT }).referenceY,
    ).toBeNull();
  });
});

describe("x축 라벨", () => {
  test("1시간(30초 간격): KST 기준 정각·15분 경계에 HH:mm, 최대 4개", () => {
    const g = chartGeometry({
      points: series(wave, 30 * SECOND),
      width: WIDTH,
      height: HEIGHT,
    });
    expect(g.xLabels.map((l) => l.text)).toEqual([
      "14:15",
      "14:30",
      "14:45",
      "15:00",
    ]);
    for (const label of g.xLabels) {
      expect(label.x).toBeGreaterThanOrEqual(0);
      expect(label.x).toBeLessThanOrEqual(WIDTH);
    }
  });

  test("1주(1시간 간격): KST 날짜 경계에 M/D", () => {
    const week = Array.from({ length: 169 }, () => 230);
    const g = chartGeometry({
      points: series(week, HOUR, END - (END % HOUR)),
      width: WIDTH,
      height: HEIGHT,
      maxXLabels: 4,
    });
    expect(g.xLabels.map((l) => l.text)).toEqual([
      "11/2",
      "11/4",
      "11/6",
      "11/8",
    ]);
  });

  test("1개월(6시간 간격)도 라벨이 maxXLabels를 넘지 않는다", () => {
    const month = Array.from({ length: 121 }, () => 230);
    const g = chartGeometry({
      points: series(month, 6 * HOUR, END - (END % (6 * HOUR))),
      width: WIDTH,
      height: HEIGHT,
      maxXLabels: 4,
    });
    expect(g.xLabels.length).toBeGreaterThanOrEqual(2);
    expect(g.xLabels.length).toBeLessThanOrEqual(4);
    for (const label of g.xLabels)
      expect(label.text).toMatch(/^\d{1,2}\/\d{1,2}$/);
  });
});

describe("이상한 입력에서도 죽지 않는다", () => {
  test("폭이 부동소수점 한계만큼 작으면 값이 같은 것처럼 그린다", () => {
    const g = chartGeometry({
      points: series([230, 230 + 1e-13], MINUTE),
      width: WIDTH,
      height: HEIGHT,
    });
    for (const [, y] of coords(g.path)) expect(y).toBe(HEIGHT / 2);
    expect(new Set(g.yTicks.map((t) => t.value)).size).toBe(g.yTicks.length);
  });

  test("NaN·Infinity 점은 빼고 그린다", () => {
    const points = series(
      [229, Number.NaN, 231, Number.POSITIVE_INFINITY, 230],
      MINUTE,
    );
    const g = chartGeometry({ points, width: WIDTH, height: HEIGHT });
    expect(coords(g.path)).toHaveLength(3);
    expect(g.domain).toEqual({ min: 229, max: 231 });
  });

  test("유한한 점이 하나도 없으면 빈 결과", () => {
    const g = chartGeometry({
      points: series([Number.NaN, Number.NaN], MINUTE),
      width: WIDTH,
      height: HEIGHT,
    });
    expect(g.path).toBe("");
  });
});

test("점이 없으면 빈 결과", () => {
  const g = chartGeometry({
    points: [],
    width: WIDTH,
    height: HEIGHT,
    reference: 1,
  });
  expect(g).toEqual({
    path: "",
    yTicks: [],
    xLabels: [],
    referenceY: null,
    last: null,
    domain: null,
  });
});

test("점이 하나면 오른쪽 끝 가운데에 놓고 x축 라벨은 없다", () => {
  const g = chartGeometry({
    points: series([230], 10 * MINUTE),
    width: WIDTH,
    height: HEIGHT,
  });
  expect(g.last).toEqual({ x: WIDTH, y: HEIGHT / 2 });
  expect(g.xLabels).toEqual([]);
});

describe("그리는 쪽이 같이 쓰는 배치 규칙", () => {
  test("x 라벨은 양 끝 24px 안이면 바깥쪽으로 붙인다", () => {
    expect(xLabelAnchor(10, 600)).toBe("start");
    expect(xLabelAnchor(300, 600)).toBe("middle");
    expect(xLabelAnchor(590, 600)).toBe("end");
  });

  test("기준가 라벨은 선 위에, 위쪽 경계 가까이면 선 아래에", () => {
    expect(referenceLabelY(100)).toBe(94);
    expect(referenceLabelY(5)).toBe(19);
  });

  test("여백은 극값의 선 두께·마지막 점이 잘리지 않을 만큼, 오른쪽은 y축 값 자리", () => {
    expect(CHART_MARGIN.left).toBeGreaterThanOrEqual(LAST_POINT_RADIUS);
    expect(CHART_MARGIN.top).toBeGreaterThanOrEqual(LAST_POINT_RADIUS);
    expect(CHART_MARGIN.right).toBeGreaterThanOrEqual(56);
  });
});
