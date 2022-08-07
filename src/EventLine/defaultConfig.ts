export default {
  padding: [24, 24, 48, 0], // canvas的padding
  axis: {
    height: 15,
    color: '#666',
  },
  scale: {
    lineWidth: 1,
    space: 10,
    textSpace: 6,
    textSize: 6,
    firstHeight: 15,
    firstColor: '#333',
    secondHeight: 10,
    secondColor: '#666',
    thirdHeight: 6,
    thirdColor: '#999',
  },
  fieldNames: {
    eventUniqueField: 'id',
    eventTitleField: 'title',
    eventStartField: 'startDate',
    eventEndField: 'endDate',
    eventSeriesField: 'type',
    lineUniqueField: 'id',
    lineXField: 'dt',
    lineYField: 'value',
    lineSeriesField: 'type',
  },
  eventTypeStyle: {
    width: 100,
    height: 40,
    textStyle: {
      font: 'bold 14px "Hiragino Sans GB", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif',
    },
  },
  eventStyle: {
    height: 30,
    minWidth: 60,
    radius: 4,
    textStyle: {
      fillStyle: '#fff',
      font: '14px "Hiragino Sans GB", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif',
    },
  },
  lineStyle: {
    yScaleSpace: 50, // 通过space乘以count获取折线的高度
    yScaleCount: 6,
  },
};
