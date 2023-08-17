import React from "react";
import { Map } from "@mchart/pc-react";

export default () => {
  const data = [
    { name: "北京", value: 1000 },
    { name: "天津", value: 300 },
    {
      name: "青海",
      value: 100,
    },
    {
      name: "四川",
      value: 100,
    },
    {
      name: "广西",
      value: 300,
    },
    {
      name: "贵州",
      value: 100,
    },
    {
      name: "江西",
      value: 100,
    },
    {
      name: "黑龙江",
      value: 800,
    },
    {
      name: "山西",
      value: 300,
    },
    { name: "陕西", value: 500 },
    { name: "河南", value: 100 },
    { name: "吉林", value: 200 },
    { name: "宁夏", value: 200 },
    { name: "甘肃", value: 100 },
    { name: "福建", value: 400 },
    { name: "浙江", value: 400 },
    { name: "辽宁", value: 300 },
    { name: "重庆", value: 900 },
    { name: "河北", value: 400 },
    { name: "云南", value: 500 },
    { name: "江苏", value: 500 },
    { name: "海南", value: 500 },
    { name: "安徽", value: 600 },
    { name: "湖北", value: 720 },
    { name: "上海", value: 150 },
    { name: "广州", value: 520 },
    { name: "广东", value: 900 },
    { name: "南海诸岛", value: 100 },
    { name: "新疆", value: 50 },
    { name: "西藏", value: 500 },
    { name: "湖南", value: 210 },
    { name: "台湾", value: 210 },
    { name: "内蒙古", value: 150 },
  ];
  return (
    <Map
      name="销售量"
      mapType="china"
      visualMap={[
        {
          max: 1000,
          min: 0,
        },
      ]}
      drill={{
        enabled: true,
        steps: ["country", "province"],
        onDown: (from, to) => {
          return {
            ifContinue: true,
            data:
              to.mapType === "230000" ? [{ name: "黑河市", value: 100 }] : [],
          };
        },
        onUp: (from, to) => {
          return {};
        },
      }}
      data={data}
    />
  );
};
