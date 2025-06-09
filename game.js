const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let cloudcover = [];
// 新增：项目列表，替代原来的 poem 数组
let projects = [
  { name: "La Noche Cíclica", url: "work/la-noche-ciclica.html" },
  { name: "And So We Dance", url: "work/and-so-we-dance.html" },
  { name: "Repair Shop", url: "work/repair-shop.html" },
  { name: "How it Slips", url: "work/how-it-slips.html" },
  { name: "L'ami intime", url: "work/lami-intime.html" },
  { name: "Claudia", url: "work/claudia.html" },
  { name: "The Marvelous Clouds", url: "work/the-marvelous-clouds.html" },
  { name: "All the Rivers Sound in My Body", url: "work/all-the-rivers-sound-in-my-body.html" },
  { name: "Barcarolle: June", url: "work/barcarolle-june.html" },
  { name: "God is a Woman sitting in the Bath", url: "work/god-is-a-woman-sitting-in-the-bath.html" },
  { name: "Chungking Express", url: "work/chungking-express.html" },
  { name: "Do Not Feed Alligators", url: "work/do-not-feed-alligators.html" },
  { name: "I Really Like Your Work", url: "work/i-really-like-your-work.html" },
  { name: "Seagull, Untitled (Acquired)", url: "work/seagull-untitled-acquired.html" }
];
let clickedCircles = [];
let lines = [];
// 新增：存储项目名称的点击区域
let projectClickAreas = [];

let hoverX = -1;
let hoverY = -1;
const pixelSize = 1;
const enlargedPixelSize = 20;

const tempCanvas = document.createElement('canvas');
const tempCtx = tempCanvas.getContext('2d');

const dpr = window.devicePixelRatio || 1;

// 添加状态管理
let isImageLoaded = false;
let isDataLoaded = false;

function resize() {
  const rect = canvas.getBoundingClientRect();
  
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  
  ctx.scale(dpr, dpr);

  tempCanvas.width = rect.width * dpr;
  tempCanvas.height = rect.height * dpr;
  tempCtx.scale(dpr, dpr);
}

function setCanvasSize() {
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  resize();
}

window.addEventListener('resize', setCanvasSize);
setCanvasSize();

const bg = new Image();

// 预加载图片
function preloadImage() {
  return new Promise((resolve, reject) => {
    bg.onload = () => {
      isImageLoaded = true;
      console.log('Image loaded');
      resolve();
    };
    bg.onerror = reject;
    bg.src = 'assets/sky.png';
  });
}

// Mapping helper
function map(value, a, b, c, d) {
  return ((value - a) / (b - a)) * (d - c) + c;
}

async function fetchData() {
  try {
    const res1 = await fetch("https://api.open-meteo.com/v1/forecast?latitude=40.6501&longitude=-73.9496&hourly=cloudcover");
    const data1 = await res1.json();
    cloudcover = data1.hourly.cloudcover || [];

    // 移除原来的随机词汇API调用，直接使用项目数据
    
    isDataLoaded = true;
    console.log('Data loaded');
  } catch (err) {
    console.error("API error:", err);
    // 如果API失败，使用模拟数据以便测试
    cloudcover = Array.from({length: 24}, () => Math.floor(Math.random() * 100));
    isDataLoaded = true; // 即使失败也继续渲染
  }
}

canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const panelW = window.innerWidth / 2;
  const panelH = window.innerHeight;

  // 左侧点击逻辑（保持原有逻辑，但添加智能隐藏）
  if (mx <= panelW && cloudcover.length > 0) {
    for (let i = 0; i < cloudcover.length; i++) {
      let x = map(i, 0, cloudcover.length - 1, 50, panelW - 50);
      let y = map(cloudcover[i], 0, 100, panelH - 50, 50);

      const d = Math.hypot(mx - x, my - y);
      if (d < 5) {
        clickedCircles.push({ x, y });

        if (clickedCircles.length > 1) {
          const last = clickedCircles[clickedCircles.length - 2];
          lines.push({ x1: last.x, y1: last.y, x2: x, y2: y });
        }

        // 新增：智能隐藏传统导航
        if (clickedCircles.length === 1) {
          document.getElementById('bottom-right').style.opacity = '0.4';
        }
        break;
      }
    }
  }
  // 新增：右侧点击检测（项目名称点击）
  else if (mx > panelW) {
    for (let area of projectClickAreas) {
      if (mx >= area.x && mx <= area.x + area.width && 
          my >= area.y - area.height && my <= area.y + 5) {
        window.location.href = area.url;
        break;
      }
    }
  }
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const panelW = window.innerWidth / 2;
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  if (mx < panelW && my < window.innerHeight) {
    hoverX = Math.floor(mx / pixelSize) * pixelSize;
    hoverY = Math.floor(my / pixelSize) * pixelSize;
  } else {
    hoverX = -1;
    hoverY = -1;
  }

  // 新增：检查是否悬停在项目名称上，改变鼠标样式
  canvas.style.cursor = 'default';
  for (let area of projectClickAreas) {
    if (mx >= area.x && mx <= area.x + area.width && 
        my >= area.y - area.height && my <= area.y + 5) {
      canvas.style.cursor = 'pointer';
      break;
    }
  }
});

// 分步绘制函数
function drawBasicUI() {
  const panelW = window.innerWidth / 2;
  const panelH = window.innerHeight;

  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  // 绘制左半边背景（即使没有图片也显示占位）
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, panelW, panelH);

  // 绘制右半边白色背景
  ctx.fillStyle = 'white';
  ctx.fillRect(panelW, 0, panelW, panelH);

  // 如果图片已加载，绘制图片
  if (isImageLoaded) {
    tempCtx.clearRect(0, 0, panelW, panelH);
    tempCtx.drawImage(bg, 0, 0, panelW, panelH);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bg, 0, 0, panelW, panelH);
  }
}

function drawDataPoints() {
  const panelW = window.innerWidth / 2;
  const panelH = window.innerHeight;

  // 绘制云量数据点
  if (cloudcover.length > 0) {
    for (let i = 0; i < cloudcover.length; i++) {
      let x = map(i, 0, cloudcover.length - 1, 50, panelW - 50);
      let y = map(cloudcover[i], 0, 100, panelH - 50, 50);

      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'black';
      ctx.fill();
    }
  }

  // 绘制连接线
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 1.5;
  for (let ln of lines) {
    ctx.beginPath();
    ctx.moveTo(ln.x1, ln.y1);
    ctx.lineTo(ln.x2, ln.y2);
    ctx.stroke();
  }

  // 绘制点击的圆圈序号
  ctx.fillStyle = 'red';
  ctx.font = '16px sans-serif';
  for (let i = 0; i < clickedCircles.length; i++) {
    const c = clickedCircles[i];
    ctx.fillText((i + 1).toString(), c.x, c.y - 5);
  }
}

// 修改：将原来的 drawPoem 改为 drawProjects
function drawProjects() {
  const panelW = window.innerWidth / 2;
  projectClickAreas = []; // 重置点击区域
  
  // 绘制项目名称
  ctx.fillStyle = 'black';
  ctx.font = '14px Courier';
  for (let i = 0; i < clickedCircles.length; i++) {
    if (projects[i]) {
      const c = clickedCircles[i];
      const projectName = projects[i].name;
      const x = panelW + c.x + 25;
      const y = c.y;
      ctx.fillText(projectName, x, y);

      // 计算文本宽度并存储点击区域
      const textWidth = ctx.measureText(projectName).width;
      projectClickAreas.push({
        x: x,
        y: y,
        width: textWidth,
        height: 14,
        url: projects[i].url
      });
    }
  }
}

function drawHoverEffect() {
  if (hoverX >= 0 && hoverY >= 0 && isImageLoaded) {
    try {
      const imgData = tempCtx.getImageData(hoverX * dpr, hoverY * dpr, pixelSize * dpr, pixelSize * dpr);
      const [r, g, b, a] = imgData.data;
      ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
      ctx.fillRect(hoverX, hoverY, enlargedPixelSize, enlargedPixelSize);

      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.strokeRect(hoverX, hoverY, enlargedPixelSize, enlargedPixelSize);
    } catch (e) {
      console.warn('Pixel read error:', e);
    }
  }
}

function draw() {
  // 始终绘制基础UI
  drawBasicUI();
  
  // 如果数据已加载，绘制数据相关内容
  if (isDataLoaded) {
    drawDataPoints();
    drawProjects(); // 修改：调用新的项目绘制函数
  }
  
  // 绘制鼠标悬停效果
  drawHoverEffect();

  requestAnimationFrame(draw);
}

// 启动应用
async function init() {
  // 立即开始绘制基础UI
  requestAnimationFrame(draw);
  
  // 并行加载图片和数据
  const imagePromise = preloadImage();
  const dataPromise = fetchData();
  
  // 等待所有资源加载完成
  await Promise.all([imagePromise, dataPromise]);
  console.log('All resources loaded');
}

// 启动应用
init();
