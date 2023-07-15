import type { ColumnsType, ColumnType, TableRef } from "@m-ui-next/react";
import { Button, Table, MUI_LIGHT } from "@m-ui-next/react";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Popover, Checkbox, Tooltip } from "@m-ui/react";
import "@m-ui/react/dist/@m-ui/react.css";
import "@m-ui-next/react/dist/style.css";

export default function () {
  const [data, setData] = useState<MockData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSelection, setShowSelection] = useState(false);
  const [selectedRows, setSelectedRows] = useState<MockData[]>([]);
  const tableRef = useRef<TableRef>(null);

  const columns = useMemo<ColumnsType<MockData>>(
    () => [
      {
        colType: "rowSelection",
        fixed: "left",
        hidden: !showSelection,
      },
      {
        title: "广告计划",
        dataIndex: "planName",
        width: 150,
        fixed: "left",
        render(name, row) {
          if (row.isSummary) {
            return name;
          }
          return (
            <Popover
              content={<div>广告计划名称：{name}</div>}
              placement="topLeft"
            >
              <div
                style={{
                  margin: 0,
                  height: 22,
                  overflow: "hidden",
                  maxWidth: "100%",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  width: "fit-content",
                }}
              >
                {name}
              </div>
            </Popover>
          );
        },
      },
      { title: "广告计划ID", dataIndex: "planId", key: "planId", width: 100 },
      {
        title: "广告组",
        dataIndex: "unitName",
        key: "unitName",
        width: 100,
      },
      {
        title: "花费",
        dataIndex: "cost",
        key: "cost",
        align: "right",
        width: 120,
        sorter: (a, b) => a.cost - b.cost,
        sortDirections: ["descend", "ascend"],
        render(val) {
          return (
            <div style={{ whiteSpace: "nowrap" }}>{formatNumber(val)}</div>
          );
        },
      },
      ...mockedColumns,
    ],
    [showSelection]
  );

  const handleResetColWidth = () => {
    tableRef.current?.resetColumnWidth();
  };

  const refreshDataSource = () => {
    setLoading(true);
    setTimeout(() => {
      setData(new Array(200).fill(0).map((v, i) => mockData()));
      setLoading(false);
    }, 2 * 1000);
  };

  useEffect(refreshDataSource, []);

  const summaryData = useMemo(() => [], [data]);

  return (
    <div style={{ margin: 24, marginTop: 120 }} className={MUI_LIGHT}>
      <div style={{ marginBottom: 12 }}>
        <Checkbox
          checked={showSelection}
          onChange={(e) => setShowSelection(e.target.checked)}
        >
          批量操作
        </Checkbox>
        <Button onClick={handleResetColWidth}>重置列宽</Button>
        <Button onClick={refreshDataSource} loading={loading}>
          刷新数据
        </Button>
      </div>
      <Table
        ref={tableRef}
        scroll={{
          type: "virtual",
          columnVirtual: true,
          /** 设置虚拟列宽度，用于性能优化 */
          columnWidth: 120,
          columnBufferSize: 10,
          y: 2200,
        }}
        loading={loading}
        // 如果不使用行选中、行展开，可不传 rowKey
        // rowKey="planId"
        dataSource={data}
        bordered
        customNodes={{
          theadCell: {
            style: {
              // 表头，单行展示，不换行，不撑开单元格高度
              whiteSpace: "nowrap",
            },
          },
          tbodyCell: {
            style: {
              // 单行展示，不换行，不撑开单元格高度
              whiteSpace: "nowrap",
            },
          },
        }}
        colResizable
        colMaxWidth={300}
        colMinWidth={100}
        theadBackground
        rowKey="planId"
        rowSelection={{
          selections: [
            // 'SELECTION_ALL',
            // 'SELECTION_INVERT',
            // 'SELECTION_NONE',
            // 可自定义选中行为
            {
              key: "clear",
              text: "清空已选",
              onSelect: (info) => info.handleSelectNone(),
            },
          ],
          selectedRowKeys: selectedRows.map((v) => v.planId),
          onChange(selectedRowKeys, selectedRows, info) {
            setSelectedRows(selectedRows);
          },
          getDisabled(r) {
            return r.cost < 20000;
          },
          getTooltip(r) {
            if (r.cost < 20000) {
              return "花费低于 2w，不允许批量操作";
            }
          },
        }}
        affixedScrollbarBottom
        columns={columns}
        summary={(data) =>
          showSelection && selectedRows.length > 0 ? (
            // ReactNode 节点，通栏显示
            <div style={{ textAlign: "center" }}>
              已选择 {selectedRows.length} 项进行批量操作，总花费{" "}
              {formatNumber(selectedRows.reduce((t, v) => t + v.cost, 0))}
            </div>
          ) : (
            // 数组格式，固定列显示
            summaryData
          )
        }
        scrollbarProps={{
          xRailOffset: 14,
          trigger: "none",
        }}
      />
    </div>
  );
}

const getSummaryData = (data: MockData[]) => {
  const summaryData: MockData = {
    planName: `共${data.length}条数据`,
    planId: "-" as any,
    unitName: "-",
    cost: data.reduce((t, v) => t + v.cost, 0),
    isSummary: true,
  };
  for (let index = 0; index <= mockColumnIdx; index++) {
    const key = `data-key-${index}`;
    summaryData[key] = data.reduce((t, v) => t + v[key], 0);
  }
  return [summaryData];
};

let mockColumnIdx = 0;
function mockColumn(): ColumnType<MockData> {
  mockColumnIdx++;
  const dataKey = `data-key-${mockColumnIdx}`;
  const titles = [
    "展示数",
    "单日付费ROI",
    "平均千次素材曝光花费(元)",
    "行为率",
  ];
  const title = `${titles[mockColumnIdx % 4]}`;
  return {
    title: (
      <div
        // 只是示例，生产需要写在样式文件中
        style={{
          height: 40,
          margin: "-6px 0",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "right",
          whiteSpace: "break-spaces",
        }}
      >
        <Tooltip title={`释义：${title}`}>
          <div
            // 只是示例，生产需要写在样式文件中
            style={{
              width: "fit-content",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {title}
            {mockColumnIdx}
          </div>
        </Tooltip>
      </div>
    ),
    dataIndex: dataKey,
    key: dataKey,
    align: "right",
    width: 120,
    sorter: (a, b) => a[dataKey] - b[dataKey],
    sortDirections: ["descend", "ascend"],
    render(val) {
      return <div style={{ whiteSpace: "nowrap" }}>{formatNumber(val)}</div>;
    },
  };
}

const mockedColumns = new Array(500).fill(0).map((_, i) => mockColumn());

function formatNumber(val: any) {
  const num = Number(val);
  return Number.isNaN(num) ? "-" : (+num.toFixed(2)).toLocaleString();
}

interface MockData {
  planName: string;
  planId: number;
  unitName: string;
  cost: number;
  [key: string]: any;
  isSummary?: boolean;
}

let mockDataIdx = 1000;
function mockData(): MockData {
  mockDataIdx++;
  const namePrefix = [
    "北京达佳互联信息技术有限公司",
    "北京快手科技",
    "快手科技",
    "杭州快手科技",
  ];
  const data: MockData = {
    planName: `${
      namePrefix[Math.floor(Math.random() * 10) % 4]
    }-${mockDataIdx}`,
    planId: mockDataIdx,
    cost: Math.random() * 100000,
    unitName: `广告组${mockDataIdx}`,
  };
  for (let index = 0; index <= mockColumnIdx; index++) {
    data[`data-key-${index}`] = Math.random() * 10000;
  }
  return data;
}
