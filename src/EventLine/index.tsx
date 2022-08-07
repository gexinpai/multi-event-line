import React, { useCallback, useEffect, useRef, useState } from 'react';
import Moment from 'moment';
import { extendMoment } from 'moment-range';
import useMouseMove from './hooks/useMouseMove';
import { EMouseStatus, ETooltipStatus, IEventItem, ILineItem } from './type';
import { analysisEventLineData, getLineDashYList } from './utils/data';
import defaultConfig from './defaultConfig';
import {
  drawActiveEventGuides,
  drawAxisScale,
  drawChartLines,
  drawEventRectWidthText,
  drawHorizontalLine,
} from './utils/draw';
import Tooltip from './components/Tooltip';
import './index.css';

const moment = extendMoment(Moment as any);

interface IProps {
  id?: string;
  events: IEventItem[];
  eventTypes?: any;
  lines?: ILineItem[];
  [_: string]: any;
}

interface IArea {
  x: number;
  y: number;
  w?: number;
  h?: number;
  pointX?: number;
  pointY?: number;
}

const eventType0 = {
  value: 'zero',
  label: '趋势图',
  sort: 0,
  primaryColor: '#fff',
  secondaryColor: '#fff',
};

export default React.memo(
  ({
    id = 'event-line',
    events,
    eventTypes: eTypes,
    lines = [],
    customTooltip,
    config: customConfig,
  }: IProps) => {
    const withLine = lines?.length > 0; // 是否展示折线
    const config = {
      ...defaultConfig,
      ...customConfig,
      axis: { ...defaultConfig?.axis, ...customConfig?.axis },
      scale: { ...defaultConfig?.scale, ...customConfig?.scale },
      fieldNames: { ...defaultConfig?.fieldNames, ...customConfig?.fieldNames },
      eventTypeStyle: { ...defaultConfig?.eventTypeStyle, ...customConfig?.eventTypeStyle },
      eventStyle: { ...defaultConfig?.eventStyle, ...customConfig?.eventStyle },
      lineStyle: { ...defaultConfig?.lineStyle, ...customConfig?.lineStyle },
    };

    const eventTypes = [{ ...eventType0, label: config.lineTitle }, ...eTypes];
    const [paddingTop = 0, paddingRight, paddingBottom = 25, paddingLeft] = config?.padding || [];
    const { width: eventTypeWidth, height: eventTypeHeight } = config?.eventTypeStyle || {};
    const { height: axisXHeight } = config?.axis || {};
    const { height: eventHeight, minWidth: eventMinWidth } = config?.eventStyle || {};
    const { yScaleSpace: scaleLineSpace = 50, yScaleCount: scaleLineCount = 6 } =
      config?.lineStyle || {};
    //事件高度计算；
    const eventsHeight = eventTypeHeight * eTypes.length;
    const lineHeight = withLine ? scaleLineSpace * scaleLineCount : 0;
    const dashLineList = getLineDashYList(scaleLineCount, scaleLineSpace) || [
      250, 200, 150, 100, 50,
    ];

    const canvasRef = useRef<any>(null);
    const getContext = useCallback(() => {
      return canvasRef.current.getContext('2d');
    }, [canvasRef.current]);
    const [tooltipStatus, setTooltipStatus] = useState(ETooltipStatus.NOTHING);
    const [tooltipData, setTooltipData] = useState<any>();
    const [linePoint, setLinePoint] = useState<any>();
    const [activeEventId, setActiveEventId] = useState();

    const { axisXStart, axisXEnd, lineMinValue, lineMaxValue, axisYMax, axisYMin, axisXWidth } =
      analysisEventLineData(events, lines, config);
    const axisXData = Array.from(moment.range(moment(axisXStart), moment(axisXEnd)).by('days')).map(
      (item) => item.format('YYYYMMDD'),
    );

    const { mouseMoveX, mouseXY, mouseStatus } = useMouseMove(`#${id}`, -100, axisXWidth - 200);

    const showTooltip = (type: ETooltipStatus, area: IArea, data: any) => {
      if (
        mouseXY &&
        mouseXY.x >= area.x &&
        mouseXY.x <= area.x + (area.w || 2) &&
        mouseXY.y >= area.y &&
        mouseXY.y <= area.y + (area.h || 2)
      ) {
        if (type === ETooltipStatus.LINE) {
          setLinePoint({ x: area?.pointX, y: area?.pointY });
        }
        if (mouseStatus === EMouseStatus.HOVER) {
          setTooltipStatus(type);
          setTooltipData(data);
        }
        return true;
      } else if (tooltipStatus === type && tooltipData?.id === data.id) {
        setTooltipStatus(ETooltipStatus.NOTHING);
        setTooltipData(undefined);
      }
      return false;
    };

    const clearCanvas = () => {
      const context = getContext();
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    };

    const drawXAxis = (offsetX: number, offsetY: number, moveX: number) => {
      const context = getContext();
      // 事件x轴
      drawHorizontalLine(context, offsetX, [offsetY], {
        isAxis: true,
        axisXData,
        strokeStyle: '#999',
        lineMinValue,
        lineMaxValue,
        scale: config.scale,
      });
      drawAxisScale(context, offsetX - moveX, offsetY, { axisXData, scale: config.scale }); // 绘制刻度
    };

    const drawAxisAndLine = (offsetX: number, offsetY: number, moveX: number) => {
      const context = getContext();
      drawXAxis(offsetX, offsetY + axisXHeight, moveX); // + 间距
      withLine && drawXAxis(offsetX, offsetY + lineHeight + axisXHeight, moveX); // + 间距
      // 画事件类型 不加间距
      drawEventTypes(offsetX, offsetY);
      // 画辅助线 + 间距
      withLine &&
        drawHorizontalLine(
          context,
          offsetX,
          dashLineList.map((val: number) => offsetY + axisXHeight + val),
          {
            lineWidth: 1,
            strokeStyle: '#999',
            isDashLine: true,
            axisXData,
            lineMinValue,
            lineMaxValue,
            scale: config.scale,
            axisYMax,
            axisYMin,
          },
        );
    };

    const drawEventTypes = (offsetX: number, offsetY: number) => {
      const context = getContext();
      const { eventTypeStyle } = config;
      eventTypes.forEach(({ label, sort, primaryColor, secondaryColor }: any) => {
        if (sort === 0) {
          drawEventRectWidthText(
            context,
            offsetX - eventTypeWidth,
            offsetY - eventTypeHeight * sort,
            eventTypeWidth,
            axisXHeight + lineHeight + paddingBottom, // 0趋势图背景覆盖折线图左侧区域
            withLine ? label : '',
            {
              strokeStyle: primaryColor,
              fillStyle: secondaryColor,
              radius: 0,
              textStyle: {
                fillStyle: '#999',
              },
            },
          );
          return;
        }
        drawEventRectWidthText(
          context,
          offsetX - eventTypeWidth,
          offsetY - eventTypeHeight * (eventTypes.length - sort),
          eventTypeWidth,
          eventTypeHeight,
          label,
          {
            strokeStyle: primaryColor,
            fillStyle: secondaryColor,
            radius: 0,
            textStyle: {
              fillStyle: primaryColor,
              ...eventTypeStyle,
            },
          },
        );
      });
    };

    const drawEvents = (offsetX: number, offsetY: number) => {
      const context = getContext();
      const { scale, fieldNames, eventStyle } = config;
      const { minWidth, height, radius } = eventStyle;
      const {
        eventStartField,
        eventEndField,
        eventSeriesField,
        eventTitleField,
        eventUniqueField,
      } = fieldNames;
      let activeEvent: any;
      events.forEach((item, index) => {
        const { sort, primaryColor, secondaryColor } = eventTypes.find(
          ({ value }: any) => value === item?.[eventSeriesField],
        ) || {
          sort: 1,
        };
        const rangeStartX = moment(item?.[eventStartField]).diff(moment(axisXStart), 'days');
        const count = moment(item?.[eventEndField]).diff(moment(item?.[eventStartField]), 'days');
        const rectX = offsetX + rangeStartX * scale.space;
        const rectY = offsetY - eventTypeHeight * (eventTypes.length - sort); // 使用事件类型高度
        let rectW = count * scale.space;
        let guideW = count * scale.space;
        if (!item?.[eventEndField] || rectW < minWidth) {
          if (!item?.[eventEndField]) {
            guideW = 0;
          }
          rectW = minWidth;
        }
        const rectH = height;
        const isActive = showTooltip(
          ETooltipStatus.EVENT,
          { x: rectX - 1, y: rectY - 1, w: rectW + 1, h: rectH + 1 }, // +1 -1为了方便感应
          item,
        );
        if (isActive && mouseStatus === EMouseStatus.CLICK) {
          setActiveEventId(item?.[eventUniqueField] || `mel_id_${index}`);
        }
        if (isActive || activeEventId === (item?.[eventUniqueField] || `mel_id_${index}`)) {
          // 如果事件重合，则后绘制的事件优先级更高, 需要先绘制前此事件，不展示辅助线
          if (activeEvent) {
            activeEvent();
          }
          activeEvent = () => {
            if (activeEventId === (item?.[eventUniqueField] || `mel_id_${index}`)) {
              drawActiveEventGuides(
                context,
                rectX,
                rectY + radius,
                guideW,
                offsetY + axisXHeight - 4,
                {
                  strokeStyle: primaryColor,
                },
              );
            }
            drawEventRectWidthText(
              context,
              rectX, // x
              rectY, // y
              rectW, // 宽
              rectH, // 高
              item?.[eventTitleField] || '',
              {
                strokeStyle: primaryColor,
                fillStyle: secondaryColor,
                lineWidth: 2,
                radius,
                textStyle: {
                  fillStyle: primaryColor,
                  ...eventStyle.textStyle,
                },
              },
            );
          };
          return;
        }
        drawEventRectWidthText(
          context,
          rectX, // x
          rectY, // y
          rectW, // 宽
          rectH, // 高
          item?.[eventTitleField] || '',
          {
            strokeStyle: primaryColor,
            fillStyle: secondaryColor,
            lineWidth: 2,
            radius,
            textStyle: {
              fillStyle: primaryColor,
              ...eventStyle.textStyle,
            },
          },
        );
      });
      activeEvent && activeEvent();
    };
    const drawLines = (offsetX: number, offsetY: number) => {
      const context = getContext();
      drawChartLines(context, axisXStart, offsetX, offsetY, lines, {
        scaleSpace: config.scale.space,
        axisYMax,
        axisYMin,
        scaleLineSpace,
        dashLineCount: dashLineList.length,
        showTooltip,
      });
    };

    const draw = (startX: number, startY: number, moveX: number) => {
      clearCanvas();
      // 画事件 不考虑事件和折线之间的间距
      drawEvents(paddingLeft + startX - moveX, startY + (eventTypeHeight - eventHeight) / 2);
      // 画折线 + 事件和折线之间的间距
      withLine && drawLines(paddingLeft + startX - moveX, startY + lineHeight + axisXHeight);
      // 画X轴 Y轴 和 辅助线
      drawAxisAndLine(paddingLeft + startX, startY, moveX);
    };

    useEffect(() => {
      const ele = document.querySelector('.EventLine');
      canvasRef.current.width = ele?.clientWidth;
      // canvasRef.current.height = ele?.clientHeight;
      draw(eventTypeWidth, eventsHeight + paddingTop, mouseMoveX);
    }, [mouseMoveX, mouseXY, mouseStatus, activeEventId]);
    const canvasHeight = eventsHeight + lineHeight + axisXHeight + paddingTop + paddingBottom;
    return (
      <div className="EventLine">
        <canvas id={id} ref={canvasRef} width="900" height={canvasHeight} />
        <Tooltip
          type={tooltipStatus}
          location={mouseXY}
          pointLocation={linePoint}
          customContent={customTooltip}
          data={tooltipData}
          title={tooltipData?.title || tooltipData?.dt}
          desc={tooltipData?.desc || tooltipData?.value}
          guideLineStyle={{
            top: eventsHeight + axisXHeight,
            height: lineHeight,
          }}
        />
      </div>
    );
  },
);
