import {
  chartGeometry,
  LAST_POINT_RADIUS,
  CHART_MARGIN as MARGIN,
  referenceLabelY,
  xLabelAnchor,
} from "@ticker/chart";
import {
  changeTone,
  chartDescription,
  formatPrice,
  HISTORY_RANGE_LABEL,
  HISTORY_RANGES,
  parseHistoryRange,
} from "@ticker/market";
import { useHistory, useQuote, withLivePoint } from "@ticker/market/react";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { type LayoutChangeEvent, Pressable, Text, View } from "react-native";
import Svg, {
  Circle,
  G,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import { useTheme } from "../lib/theme";
import { Message } from "./message";

const CHART_HEIGHT = 220;
const AXIS_FONT = 11;
/** react-native-svg의 dominantBaseline은 플랫폼마다 달라 글자 세로 가운데를 dy로 맞춘다(#15 리뷰) */
const AXIS_CENTER_DY = AXIS_FONT * 0.35;

/** 기간 버튼 + 차트. 좌표·라벨 배치·설명은 웹과 같은 패키지 함수를 쓰고, 그리기와 크기 측정만 앱 방식이다 */
export function PriceChart({ ticker }: { ticker: string }) {
  // 기간은 경로 파라미터에 둔다(stock-detail.md §3)
  const range = parseHistoryRange(
    useLocalSearchParams<{ range?: string }>().range,
  );
  const { colors, fonts, space, text, rule, radius } = useTheme();
  return (
    <View style={{ gap: space.md }}>
      <View style={{ flexDirection: "row" }} accessibilityRole="tablist">
        {HISTORY_RANGES.map((value) => {
          const selected = value === range;
          return (
            <Pressable
              key={value}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => router.setParams({ range: value })}
              style={({ pressed }) => ({
                minHeight: 44,
                justifyContent: "center",
                paddingHorizontal: space.md,
                marginRight: -1,
                borderWidth: rule.hair,
                borderColor: selected ? colors.ink : colors.rule,
                borderRadius: radius.control,
                backgroundColor: pressed ? colors["paper-2"] : "transparent",
                zIndex: selected ? 1 : 0,
              })}
            >
              <Text
                style={{
                  fontFamily: fonts.displayMedium,
                  fontSize: text.label,
                  color: selected ? colors.ink : colors.muted,
                }}
              >
                {HISTORY_RANGE_LABEL[value]}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Chart ticker={ticker} range={range} />
    </View>
  );
}

function Chart({
  ticker,
  range,
}: {
  ticker: string;
  range: ReturnType<typeof parseHistoryRange>;
}) {
  const history = useHistory(ticker, range);
  const { data: quote } = useQuote(ticker);
  const { colors, fonts } = useTheme();
  const [width, setWidth] = useState(0);

  const points = useMemo(() => {
    const base = history.data?.points ?? [];
    // 1시간 차트는 폴링한 최신 시세를 이어 붙여 매초 움직인다
    return range === "1h" ? withLivePoint(base, quote) : base;
  }, [history.data, quote, range]);

  const plotWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const plotHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;
  const base = quote?.base;
  const geometry = useMemo(
    () =>
      plotWidth > 0
        ? chartGeometry({
            points,
            width: plotWidth,
            height: plotHeight,
            reference: base,
          })
        : null,
    [points, plotWidth, plotHeight, base],
  );

  const last = points.at(-1);
  const tone = quote && last ? changeTone(last.p - quote.base) : "flat";
  const lineColor =
    tone === "up" ? colors.up : tone === "down" ? colors.down : colors["ink-2"];
  const description = history.isPlaceholderData
    ? "차트를 불러오는 중"
    : chartDescription(ticker, range, points);

  const referenceY = geometry?.referenceY ?? null;
  const referenceTextY = referenceY === null ? 0 : referenceLabelY(referenceY);

  const onLayout = (event: LayoutChangeEvent) =>
    setWidth(event.nativeEvent.layout.width);

  if (history.isError && !history.data) {
    return (
      <View style={{ height: CHART_HEIGHT }}>
        <Message
          text="차트를 불러오지 못했습니다"
          action={{ label: "다시 시도", onPress: () => history.refetch() }}
        />
      </View>
    );
  }

  return (
    <View
      onLayout={onLayout}
      accessible
      accessibilityRole="image"
      accessibilityLabel={description ?? "차트를 불러오는 중"}
      accessibilityState={{ busy: history.isPlaceholderData || !history.data }}
      style={{
        // 높이를 고정해 값·기간이 바뀌어도 아래가 밀리지 않는다
        height: CHART_HEIGHT,
        backgroundColor: geometry?.path ? "transparent" : colors["paper-2"],
        // 기간을 바꾸는 동안 이전 차트를 흐리게 둔다
        opacity: history.isPlaceholderData ? 0.45 : 1,
      }}
    >
      {geometry?.path ? (
        <Svg width={width} height={CHART_HEIGHT}>
          <G x={MARGIN.left} y={MARGIN.top}>
            {geometry.yTicks.map((tick) => (
              <G key={tick.value}>
                <Line
                  x1={0}
                  x2={plotWidth}
                  y1={tick.y}
                  y2={tick.y}
                  stroke={colors.rule}
                  strokeWidth={1}
                />
                <SvgText
                  x={plotWidth + 8}
                  y={tick.y}
                  dy={AXIS_CENTER_DY}
                  fontFamily={fonts.num}
                  fontSize={AXIS_FONT}
                  fill={colors.muted}
                >
                  {formatPrice(tick.value)}
                </SvgText>
              </G>
            ))}
            {referenceY !== null && quote && (
              <G>
                <Line
                  x1={0}
                  x2={plotWidth}
                  y1={referenceY}
                  y2={referenceY}
                  stroke={colors["rule-2"]}
                  strokeWidth={1}
                />
              </G>
            )}
            {geometry.xLabels.map((label) => (
              <SvgText
                key={label.t}
                x={label.x}
                y={plotHeight + 20}
                textAnchor={xLabelAnchor(label.x, plotWidth)}
                fontFamily={fonts.num}
                fontSize={AXIS_FONT}
                fill={colors.muted}
              >
                {label.text}
              </SvgText>
            ))}
            <Path
              d={geometry.path}
              fill="none"
              stroke={lineColor}
              strokeWidth={2}
              strokeLinejoin="round"
            />
            {geometry.last && (
              <Circle
                cx={geometry.last.x}
                cy={geometry.last.y}
                r={LAST_POINT_RADIUS}
                fill={lineColor}
              />
            )}
            {/* 기준가 라벨은 가격 선 위에 그린다(SVG는 나중에 그린 것이 위에 온다) */}
            {referenceY !== null && quote && (
              <G>
                {/* 선과 겹쳐도 읽히게 바탕색 사각형을 깔고 그 위에 글자를 쓴다.
                    react-native-svg는 글자 테두리(halo)가 플랫폼마다 다르게 그려져 사각형으로 한다.
                    폭은 잴 수 없어 한글 3자(12px)와 숫자·점(7px)으로 넉넉히 잡는다 */}
                <Rect
                  x={2}
                  y={referenceTextY - 11}
                  width={3 * 12 + 4 + formatPrice(quote.base).length * 7 + 4}
                  height={15}
                  fill={colors.paper}
                />
                <SvgText
                  x={4}
                  y={referenceTextY}
                  fontFamily={fonts.body}
                  fontSize={12}
                  fill={colors.muted}
                >
                  {`기준가 ${formatPrice(quote.base)}`}
                </SvgText>
              </G>
            )}
          </G>
        </Svg>
      ) : null}
    </View>
  );
}
