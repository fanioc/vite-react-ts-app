import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Line, MChartOption, SeriesOption } from "@mchart/pc-react";
import { Tooltip } from "@m-ui/react";

interface IRawData {
  key: string;
  onlineVisitorNum: number;
  visitorEnterNum: number;
  visitorExitNum: number;
  gmv: number;
}
interface IGoodsData {
  key: string;
  goodsId: string;
}

const linesConfigs = [
  { name: "在线人数", key: "onlineVisitorNum" },
  { name: "进场人数", key: "visitorEnterNum" },
  { name: "离场人数", key: "visitorExitNum" },
  { name: "GMV", key: "gmv", yAxisIndex: 1 },
];

const mockData = (originData: IRawData[]) => {
  let preGMV = 0;
  return originData.map((item, idx) => ({
    ...item,
    gmv: (preGMV += Math.floor(Math.random() * 1000)),
  }));
};
const mockGoods = (originData: IRawData[]) => {
  let goodsIdx = 0;
  return originData
    .map((item) => {
      const hasGoods = Math.random() < 0.05;
      return {
        key: item.key,
        hasGoods,
        goodsId: hasGoods ? `${goodsIdx++}` : NaN,
      };
    })
    .filter((v) => v.hasGoods) as IGoodsData[];
};

const ChartDemo = () => {
  const [rawData, setRawData] = useState<IRawData[]>([]);
  const [goodsData, setGoodsData] = useState<IGoodsData[]>([]);
  const [selectGoodsId, setSelectedGoodsId] = useState<null | string>(null);
  const [dataZoomValue, setDataZoomValue] = useState({ start: 0, end: 100 });
  const chartTooltip = useRef<ChartTooltipRef>(null);

  useEffect(() => {
    fetch(
      "https://cdnfile.corp.kuaishou.com/kc/files/a/Mchart/chart-data/live-data.json"
    )
      .then((v) => v.json())
      .then((_data) => {
        const data = mockData(_data);
        setRawData(data);
        const goodsData = mockGoods(data);
        setGoodsData(goodsData);
        setSelectedGoodsId(goodsData[0].goodsId);
      });
  }, []);

  const chartOption = useMemo<MChartOption>(() => {
    if (!rawData?.length) {
      return {};
    }
    return {
      grid: { bottom: 50, right: 16, left: 12 },
      xAxis: {
        type: "category",
        axisLabel: {
          formatter: (v) => {
            return v.split(" ")[1];
          },
        },
      },
      yAxis: [
        {
          name: "人数",
        },
        {
          name: "GMV",
        },
      ],
      dataZoom: {
        type: "slider",
        xAxisIndex: 0,
        labelFormatter(_, v) {
          return v.split(" ")[1];
        },
      },
      // 数据源
      dataset: [{ source: rawData as any }, { source: goodsData }],
      series: [
        ...linesConfigs.map<SeriesOption>((v) => {
          return {
            type: "line",
            name: v.name,
            yAxisIndex: v.yAxisIndex,
            encode: { x: "key", y: v.key },
          };
        }),
        {
          // 商品上架标记
          type: "custom",
          encode: { x: "key", y: -1 },
          xAxisIndex: 0,
          datasetIndex: 1,
          name: "商品上架",
          color: "#8A8A8A",
          tooltip: { trigger: "none" },
          renderItem(params, api) {
            const context = params.context as any;
            // 坐标系定位，grid 位置
            const coordSys = params.coordSys as ICoord2D;
            // x轴定位
            const curData = goodsData[params.dataIndex];
            let [xPoint] = api.coord?.([curData.key]) as number[];
            // 避免重叠
            if (
              context.preDataIndex < params.dataIndex &&
              context.preXPoint + 16 > xPoint
            ) {
              xPoint = context.preXPoint + 16;
            }
            context.preXPoint = xPoint;
            context.preDataIndex = params.dataIndex;

            const isSelected = selectGoodsId === curData.goodsId;
            return {
              type: "group",
              name: `goodsId-${curData.goodsId}`,
              children: [
                {
                  type: "rect",
                  shape: {
                    x: xPoint,
                    y: coordSys.y,
                    width: 16,
                    height: 16,
                  },
                  style: isSelected
                    ? {
                        fill: "#1d59f2",
                        fillOpacity: 0.8,
                      }
                    : {
                        fill: "#8A8A8A",
                        fillOpacity: 0.2,
                      },
                  emphasis: {
                    style: {
                      fill: "#1d59f2",
                      fillOpacity: 0.8,
                    },
                  },
                },
                {
                  type: "text",
                  shape: {
                    x: xPoint,
                    y: coordSys.y,
                    width: 16,
                    height: 16,
                  },
                  style: {
                    x: xPoint + 8,
                    y: coordSys.y + 8,
                    width: 16,
                    height: 16,
                    align: "center",
                    verticalAlign: "middle",
                    text: `${params.dataIndex + 1}`,
                    fill: isSelected ? "#ffffff" : "#434343",
                  },
                  emphasis: {
                    style: {
                      fill: "#ffffff",
                    },
                  },
                  select: {},
                },
                {
                  type: "rect",
                  shape: {
                    x: xPoint,
                    y: coordSys.y,
                    width: 16,
                    height: coordSys.height,
                  },
                  style: isSelected
                    ? {
                        fill: "#1d59f2",
                        fillOpacity: 0.1,
                      }
                    : {
                        fill: "#B5B5B5",
                        fillOpacity: 0.05,
                      },
                  emphasis: {
                    style: {
                      fill: "#1d59f2",
                      fillOpacity: 0.1,
                    },
                  },
                },
              ],
            };
          },
        },
      ],
    };
  }, [rawData, goodsData, selectGoodsId]);

  return (
    <div style={{ display: "flex" }}>
      <Line
        style={{ flex: 1 }}
        height={600}
        option={chartOption}
        datazoomValue={dataZoomValue}
        onDatazoomChange={(e) => {
          setDataZoomValue(e);
        }}
        zrenderEvents={{
          click(e) {
            const parentGroup = e.target?.parent;
            if (parentGroup?.name?.startsWith("goodsId-")) {
              const goodsId = parentGroup.name.split("-")[1];
              setSelectedGoodsId(goodsId);
            }
          },
          mousemove(e) {
            const parentGroup = e.target?.parent;
            if (parentGroup?.name?.startsWith("goodsId-")) {
              const goodsId = parentGroup.name.split("-")[1];
              const rect = parentGroup.getBoundingRect();
              // showTooltip
              chartTooltip.current?.setPosition({
                x: rect.x + rect.width / 2,
                y: 45,
              });
              chartTooltip.current?.setVisible(true);
            } else {
              // hideTooltip
              chartTooltip.current?.setVisible(false);
            }
          },
        }}
      >
        <ChartTooltip title="点击查看商品" ref={chartTooltip} />
      </Line>
      <div
        style={{
          flex: "0 0 100px",
          paddingTop: 45,
          marginLeft: 16,
          paddingRight: 16,
          maxHeight: 600,
          overflow: "auto",
        }}
      >
        {goodsData.map((item) => (
          <div
            style={{
              background:
                item.goodsId === selectGoodsId ? "#1d59f2aa" : "#B5B5B588",
              color: item.goodsId === selectGoodsId ? "#fff" : "#191919",
              padding: "2px 4px",
              marginBottom: 8,
              borderRadius: 2,
              cursor: "pointer",
            }}
            onClick={() => {
              setSelectedGoodsId(item.goodsId);
              setDataZoomValue({ start: 0, end: 100 });
            }}
          >
            商品-{item.goodsId}
          </div>
        ))}
      </div>
    </div>
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

// ===== 将组件tooltip渲染在图表上 ===== //

interface ChartTooltipRef {
  getPosition: () => { x: number; y: number };
  setPosition: (pos: { x: number; y: number }) => void;
  setVisible: (visible: boolean) => void;
}

const ChartTooltip = React.memo(
  React.forwardRef(
    (props: { title?: React.ReactNode }, ref: React.Ref<ChartTooltipRef>) => {
      const [visible, setVisible] = useState(false);
      const [position, setPosition] = useState({ x: 0, y: 0 });
      const $position = useRef(position);
      $position.current = position;

      useImperativeHandle(
        ref,
        () => ({
          setPosition: (pos) => {
            if (
              pos.x !== $position.current.x ||
              pos.y !== $position.current.y
            ) {
              $position.current = pos;
              setPosition(pos);
            }
          },
          setVisible: setVisible,
          getPosition: () => $position.current,
        }),
        []
      );

      return (
        <Tooltip
          visible={visible}
          title={props.title}
          align={{ offset: [position.x, position.y] }}
          overlayStyle={{ pointerEvents: "none" }}
          placement={"top"}
          getTooltipContainer={(e) => e}
        >
          <div style={{ width: 0 }} />
        </Tooltip>
      );
    }
  )
);
