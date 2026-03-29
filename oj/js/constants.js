'use strict';

const DIFFICULTY_LABEL = { easy: '⭐ 入门', medium: '🔥 进阶', hard: '💎 高级' };

// ── GOC-022: Curriculum mapping ────────────────────────────────────
const CURRICULUM_MAP = {
  '正多边形': ['001','002','003','008','032','004'],
  '轴对称':   ['010','018','026','004','003'],
  '圆与弧':   ['005','016','021','023','036','037'],
  '坐标系':   ['013','027','029'],
  '螺旋线':   ['009','012','015','020','022','024','040','041'],
  '色彩规律': ['007','014','017','019','028','034','039'],
  '旋转':     ['010','025','026','028','033'],
};

// ── GOC-014: Highlight token definitions ──────────────────────────
const HL_KEYWORDS    = new Set(['for','if','else','while','return']);
const HL_TYPES       = new Set(['int','double','float','string']);
const HL_IO          = new Set(['cin','cout','endl']);
const HL_PEN_METHODS = new Set([
  'fd','bk','rt','lt','up','down','c','size','o','oo','r','rr',
  'moveTo','lineTo','e','ee','text','pic','picL','show','hide',
  'speed','wait','pause','ctime','sound','soundL'
]);

// ── GOC-015: Autocomplete items ────────────────────────────────────
const AC_ITEMS = [
  { code:'fd(n)',       desc:'前进n步',   insert:'fd(100)' },
  { code:'bk(n)',       desc:'后退n步',   insert:'bk(100)' },
  { code:'rt(a)',       desc:'右转a度',   insert:'rt(90)' },
  { code:'lt(a)',       desc:'左转a度',   insert:'lt(90)' },
  { code:'up()',        desc:'抬笔',      insert:'up()' },
  { code:'down()',      desc:'落笔',      insert:'down()' },
  { code:'c(n)',        desc:'颜色0-15',  insert:'c(1)' },
  { code:'size(n)',     desc:'线宽',      insert:'size(2)' },
  { code:'o(r)',        desc:'画圆',      insert:'o(50)' },
  { code:'oo(r)',       desc:'实心圆',    insert:'oo(50)' },
  { code:'r(w,h)',      desc:'矩形',      insert:'r(100,60)' },
  { code:'rr(w,h)',     desc:'实心矩形',  insert:'rr(100,60)' },
  { code:'e(a,b)',      desc:'椭圆',      insert:'e(60,40)' },
  { code:'ee(a,b)',     desc:'实心椭圆',  insert:'ee(60,40)' },
  { code:'moveTo(x,y)', desc:'移动到',   insert:'moveTo(0,0)' },
  { code:'lineTo(x,y)', desc:'画线到',   insert:'lineTo(100,0)' },
  { code:'text(s)',     desc:'画文字',    insert:'text("hello")' },
  { code:'speed(n)',    desc:'速度',      insert:'speed(5)' },
  { code:'wait(t)',     desc:'等待ms',    insert:'wait(500)' },
  { code:'pause()',     desc:'暂停',      insert:'pause()' },
  { code:'show()',      desc:'显示',      insert:'show()' },
  { code:'hide()',      desc:'隐藏',      insert:'hide()' },
];

// ── Instruction reference data ─────────────────────────────────────
const REF_INSTRUCTIONS = [
  { category:'移动', items:[
    { code:'pen.fd(n)', desc:'前进n步', snippet:'pen.fd(100);' },
    { code:'pen.bk(n)', desc:'后退n步', snippet:'pen.bk(100);' },
  ]},
  { category:'转向', items:[
    { code:'pen.rt(a)', desc:'右转a度', snippet:'pen.rt(90);' },
    { code:'pen.lt(a)', desc:'左转a度', snippet:'pen.lt(90);' },
  ]},
  { category:'画笔', items:[
    { code:'pen.c(n)',    desc:'颜色0-15', snippet:'pen.c(1);' },
    { code:'pen.size(n)', desc:'线宽',     snippet:'pen.size(2);' },
    { code:'pen.up()',    desc:'抬笔',     snippet:'pen.up();' },
    { code:'pen.down()',  desc:'落笔',     snippet:'pen.down();' },
  ]},
  { category:'坐标', items:[
    { code:'pen.moveTo(x,y)', desc:'移动到坐标', snippet:'pen.up().moveTo(0,0).down();' },
    { code:'pen.lineTo(x,y)', desc:'画线到坐标', snippet:'pen.lineTo(100,0);' },
  ]},
  { category:'图形', items:[
    { code:'pen.o(r)',    desc:'画圆',     snippet:'pen.o(50);' },
    { code:'pen.oo(r)',   desc:'实心圆',   snippet:'pen.oo(50);' },
    { code:'pen.r(w,h)',  desc:'矩形',     snippet:'pen.r(100,60);' },
    { code:'pen.rr(w,h)', desc:'实心矩形', snippet:'pen.rr(100,60);' },
    { code:'pen.e(a,b)',  desc:'椭圆',     snippet:'pen.e(60,40);' },
    { code:'pen.ee(a,b)', desc:'实心椭圆', snippet:'pen.ee(60,40);' },
  ]},
  { category:'文字', items:[
    { code:'pen.text(s)', desc:'画文字', snippet:'pen.text("Hello");' },
  ]},
  { category:'控制', items:[
    { code:'for循环',  desc:'for循环',  snippet:'for(int i=0; i<4; i++){\n    \n}' },
    { code:'if/else', desc:'条件判断',  snippet:'if(i%2==0){\n    \n}else{\n    \n}' },
    { code:'int变量',  desc:'整数变量', snippet:'int n = 10;' },
    { code:'cin>>n',  desc:'读取输入',  snippet:'int n;\ncin >> n;' },
  ]},
];

// ── GOC-150: Code snippet templates ────────────────────────────────
const SNIPPET_TEMPLATES = [
  { name:'正方形',      desc:'for循环画4条边',      code:'for(int i=0; i<4; i++){\n    pen.fd(100).rt(90);\n}' },
  { name:'等边三角形',  desc:'for循环画3条边',      code:'for(int i=0; i<3; i++){\n    pen.fd(100).rt(120);\n}' },
  { name:'正多边形',    desc:'n边形（修改n的值）',   code:'int n = 6;\nfor(int i=0; i<n; i++){\n    pen.fd(80).rt(360/n);\n}' },
  { name:'同心圆',      desc:'for循环画多个圆',     code:'for(int i=1; i<=5; i++){\n    pen.o(i*20);\n}' },
  { name:'螺旋线',      desc:'边长递增右转螺旋',    code:'for(int i=1; i<=20; i++){\n    pen.fd(i*5).rt(90);\n}' },
  { name:'自定义函数',  desc:'函数定义+调用框架',   code:'void drawShape(int n){\n    for(int i=0; i<n; i++){\n        pen.fd(80).rt(360/n);\n    }\n}\n\ndrawShape(6);' },
  { name:'for循环',     desc:'通用for循环框架',     code:'for(int i=0; i<10; i++){\n    \n}' },
  { name:'cin读入',     desc:'读取一个整数n',       code:'int n;\ncin >> n;\n' },
];
