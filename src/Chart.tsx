import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MChart,
  MChartOption,
  MChartRef,
  SeriesOption,
} from "@mchart/pc-react";
import type { CustomSeriesRenderItemReturn } from "echarts";

interface IRawData {
  continent: string;
  Country: string;
  LifeExpectancy: number;
  GDP: number;
  Population: number;
}

const CATEGORY_LIST = ["Europe", "Oceania", "Americas", "Asia"];

const ChartDemo = () => {
  const [rawData, setRawData] = useState<IRawData[]>([]);
  const chartRef = useRef<MChartRef>(null);
  const [center, setCenter] = useState({ x: 0, y: 0, needInit: true });
  useEffect(() => {
    fetch("https://gw.alipayobjects.com/os/antvdemo/assets/data/bubble.json")
      .then((res) => res.json())
      .then((data: IRawData[]) => {
        setRawData(data);
      });
  }, []);

  const chartData = useMemo(() => {
    const obj: Record<string, { name: string; value: number[] }[]> = {};
    rawData.map((item) => {
      if (!obj[item.continent]) {
        obj[item.continent] = [];
      }
      obj[item.continent].push({
        name: item.Country,
        // x,y,size
        value: [item.LifeExpectancy, item.GDP, item.Population],
      });
    });
    return obj;
  }, [rawData]);

  const chartOption = useMemo<MChartOption>(() => {
    if (!rawData?.length) {
      return {};
    }
    return {
      grid: {
        bottom: 50,
        right: 100,
      },
      tooltip: {
        trigger: "item",
      },
      xAxis: {
        type: "value",
        name: "人均寿命",
        nameLocation: "end",
        axisLabel: {
          formatter: "{value} 岁",
        },
      },
      yAxis: {
        name: "人均GDP",
        axisLabel: {
          formatter: "${value}",
        },
      },
      dataZoom: [
        { type: "slider", yAxisIndex: 0 },
        { type: "slider", xAxisIndex: 0 },
      ],
      series: [
        ...CATEGORY_LIST.map<SeriesOption>((area) => ({
          type: "scatter",
          name: area,
          data: chartData[area],
          symbolSize: (value, params) => {
            const symbolArr = rawData.map((item) => item.Population);
            symbolArr.sort((a, b) => a - b);
            const min = symbolArr[0];
            const max = symbolArr[symbolArr.length - 1];
            const range = max - min;
            const res = 20 + (100 * (value[2] - min)) / range;
            return res;
          },
        })),
        {
          type: "custom",
          silent: true,
          data: center.needInit
            ? []
            : [
                // 中心点坐标, x,y
                [center.x, center.y],
              ],
          encode: { x: -1, y: -1 },
          // https://echarts.apache.org/zh/option.html#series-custom.renderItem
          renderItem(params, api) {
            // 坐标系定位，grid 位置
            const coordSys = params.coordSys as ICoord2D;
            // 中心点定位
            const centerPos = api.coord?.([center.x, center.y]) as number[];
            // 警告区域是否显示标记
            const warnAreas = {
              topLeft: true,
              topRight: true,
              bottomRight: true,
              bottomLeft: true,
            };
            // 中心点x，超出可视区域左边
            if (centerPos[0] <= coordSys.x) {
              warnAreas.topLeft = false;
              warnAreas.bottomLeft = false;
            }
            // 中心点x，超出可视区域右边
            if (centerPos[0] >= coordSys.x + coordSys.width) {
              warnAreas.topRight = false;
              warnAreas.bottomRight = false;
            }
            // 中心点y，超出可视区域上边
            if (centerPos[1] <= coordSys.y) {
              warnAreas.topLeft = false;
              warnAreas.topRight = false;
            }
            // 中心点y，超出可视区域下边
            if (centerPos[1] >= coordSys.y + coordSys.height) {
              warnAreas.bottomLeft = false;
              warnAreas.bottomRight = false;
            }
            const renderWarnArea = (opts: {
              position: WarnAreaPosition;
            }): Exclude<CustomSeriesRenderItemReturn, undefined | null>[] => {
              const showArea = warnAreas[opts.position];
              let [x, y, width, height] = [0, 0, 0, 0];
              const centerAnchor = [
                minmax(coordSys.x, centerPos[0], coordSys.x + coordSys.width),
                minmax(coordSys.y, centerPos[1], coordSys.y + coordSys.height),
              ];
              // 四象限定位
              if (!showArea) {
                [x, y] = [0, 0];
              } else if (opts.position === "topLeft") {
                x = coordSys.x;
                y = coordSys.y;
                width = centerAnchor[0] - x;
                height = centerAnchor[1] - y;
              } else if (opts.position === "topRight") {
                x = centerAnchor[0];
                y = coordSys.y;
                width = coordSys.x + coordSys.width - x;
                height = centerAnchor[1] - y;
              } else if (opts.position === "bottomLeft") {
                x = coordSys.x;
                y = centerAnchor[1];
                width = centerAnchor[0] - x;
                height = coordSys.y + coordSys.height - y;
              } else if (opts.position === "bottomRight") {
                x = centerAnchor[0];
                y = centerAnchor[1];
                width = coordSys.x + coordSys.width - x;
                height = coordSys.y + coordSys.height - y;
              }
              const showAreaText = showArea && width > 64 && height > 80;
              return [
                {
                  type: "rect",
                  shape: { x, y, width, height },
                  style: {
                    fill: AreaColorMap[opts.position],
                    fillOpacity: showArea ? 0.12 : 0,
                  },
                },
                {
                  type: "text",
                  style: {
                    x: x + 16,
                    y: y + 16,
                    width: width - 32,
                    height: width - 32,
                    rich: {
                      title: { fontWeight: 600, fill: "#333840" },
                      errorIcon: {
                        height: 18,
                        margin: 20,
                        backgroundColor: {
                          image:
                            "https://echarts.apache.org/examples/data/asset/img/weather/sunny_128.png",
                        },
                      },
                    },
                    opacity: showAreaText ? 1 : 0,
                    fill: "#646b73",
                    overflow: "breakAll",
                    lineOverflow: "truncate",
                    lineHeight: 20,
                    text: AreaTextMap[opts.position],
                  },
                },
              ];
            };
            return {
              type: "group",
              children: positionArr.map((pos) => ({
                type: "group",
                children: renderWarnArea({ position: pos }),
              })),
            };
          },
        },
      ],
    };
  }, [rawData, center.x, center.y]);

  return (
    <MChart
      height={600}
      ref={chartRef}
      events={{
        // 图表完成渲染时，获取图表中心点
        "chart:rendered"() {
          const ecInstance = chartRef.current?.chart;
          const ecModel = (ecInstance as any)?.getModel();
          if (!ecModel) {
            return;
          }
          const xAxisModel = ecModel.getComponent("xAxis");
          const yAxisModel = ecModel.getComponent("yAxis");
          if (!xAxisModel || !yAxisModel) {
            return;
          }
          const yAxisMinmax: [number, number] =
            yAxisModel.axis.scale.getExtent();
          const xAxisMinmax: [number, number] =
            xAxisModel.axis.scale.getExtent();
          const centerPoint = {
            x: (xAxisMinmax[0] + xAxisMinmax[1]) / 2,
            y: (yAxisMinmax[0] + yAxisMinmax[1]) / 2,
          };
          if (center.x !== centerPoint.x || center.y !== centerPoint.y) {
            setCenter({
              needInit: false,
              ...centerPoint,
            });
          }
        },
      }}
      option={chartOption}
    />
  );
};

export default React.memo(ChartDemo);

type ICoord2D = {
  type: "cartesian2d";
  x: number;
  y: number;
  width: number;
  height: number;
};

type WarnAreaPosition = "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

const positionArr: WarnAreaPosition[] = [
  "topLeft",
  "topRight",
  "bottomLeft",
  "bottomRight",
];

const AreaColorMap: Record<WarnAreaPosition, string> = {
  topLeft: "green",
  topRight: "red",
  bottomLeft: "gray",
  bottomRight: "yellow",
};

const AreaTextMap: Record<WarnAreaPosition, string> = {
  topLeft:
    "{title|潜力品：}该区域商品类目虽表现欠佳，但文字过长文字过长，但文字过长文字过长，但文字过长文字过长",
  topRight:
    "{title|热卖品：}该区域商品类目虽表现欠佳，但文字过长文字过长，但文字过长文字过长，但文字过长文字过长",
  bottomLeft: "{errorIcon| }不推荐该商品区域",
  bottomRight:
    "{title|衰退品：}该区域商品类目虽表现欠佳，但文字过长文字过长，但文字过长文字过长，但文字过长文字过长",
};

const minmax = (min: number, val: number, max: number) => {
  return Math.max(min, Math.min(val, max));
};
