{
  const canvas: HTMLCanvasElement = document.getElementById("canvas") as HTMLCanvasElement;
  const ctx: CanvasRenderingContext2D = canvas.getContext("2d");

  let CELL_SIZE = 50;
  const W = 900;
  const H = 700;

  let COLS = W / CELL_SIZE;
  let ROWS = H / CELL_SIZE;

  let renderBalls = true;
  let renderSamplesGrid = false;
  let renderOutline = false;
  let smoothOutline = false;

  canvas.height = H;
  canvas.width = W;

  const tick = () => {
    update();
    draw();

    requestAnimationFrame(tick);
  };

  const update = () => {
    COLS = W / CELL_SIZE;
    ROWS = H / CELL_SIZE;

    balls.forEach((ball) => {
      ball.x += ball.vx;
      ball.y += ball.vy;

      if (ball.x - ball.r < 0) {
        ball.x = ball.r;
        ball.vx *= -1;
      }

      if (ball.x + ball.r > W) {
        ball.x = W - ball.r;
        ball.vx *= -1;
      }

      if (ball.y - ball.r < 0) {
        ball.y = ball.r;
        ball.vy *= -1;
      }

      if (ball.y + ball.r > H) {
        ball.y = H - ball.r;
        ball.vy *= -1;
      }
    });

    samples = [];
    for (let x = 0; x < COLS; x++) {
      samples[x] = [];
      for (let y = 0; y < ROWS; y++) {
        let sample = 0;
        const sampleX = x * CELL_SIZE + CELL_SIZE * 0.5;
        const sampleY = y * CELL_SIZE + CELL_SIZE * 0.5;

        for (const ball of balls) {
          sample +=
            ball.r2 /
            ((sampleX - ball.x) * (sampleX - ball.x) +
              (sampleY - ball.y) * (sampleY - ball.y));
        }

        samples[x][y] = sample;
      }
    }
  };

  const draw = () => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    // debug info
    if (renderSamplesGrid) {
      ctx.strokeStyle = "#fff3";
      for (let x = 0; x < COLS; x++) {
        for (let y = 0; y < ROWS; y++) {
          let fill = false;
          if (samples[x][y] >= 1) {
            fill = true;
          }

          if (fill) {
            ctx.fillStyle = "#0f02";
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

            ctx.fillStyle = "#0f0b";
            ctx.beginPath();
            ctx.arc(
              x * CELL_SIZE + CELL_SIZE * 0.5,
              y * CELL_SIZE + CELL_SIZE * 0.5,
              2,
              0,
              Math.PI * 2
            );
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.fillStyle = "#f00b";
            ctx.beginPath();
            ctx.arc(
              x * CELL_SIZE + CELL_SIZE * 0.5,
              y * CELL_SIZE + CELL_SIZE * 0.5,
              2,
              0,
              Math.PI * 2
            );
            ctx.closePath();
            ctx.fill();
          }

          // ctx.fillStyle = "#fff";
          // ctx.fillText(
          //   samples[x][y].toFixed(2),
          //   x * CELL_SIZE + CELL_SIZE * 0.5,
          //   y * CELL_SIZE + CELL_SIZE * 0.5,
          //   CELL_SIZE
          // );

          // ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }
    }

    // balls
    if (renderBalls) {
      ctx.strokeStyle = "#fff";
      balls.forEach((ball) => {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.r, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.stroke();
      });
    }

    // contour
    ctx.strokeStyle = "#990f";
    if (renderOutline) {
      for (let x = 0; x < COLS - 1; x++) {
        for (let y = 0; y < ROWS - 1; y++) {
          const sampleX = x * CELL_SIZE + CELL_SIZE * 0.5;
          const sampleY = y * CELL_SIZE + CELL_SIZE * 0.5;

          const s1 = samples[x][y];
          const s2 = samples[x + 1][y];
          const s3 = samples[x + 1][y + 1];
          const s4 = samples[x][y + 1];

          const v1 = s1 > 1 ? 1 : 0;
          const v2 = s2 > 1 ? 1 : 0;
          const v3 = s3 > 1 ? 1 : 0;
          const v4 = s4 > 1 ? 1 : 0;

          let value = 0;

          value += v1 << 3;
          value += v2 << 2;
          value += v3 << 1;
          value += v4 << 0;

          let Nx = 0.5;
          let Sx = 0.5;
          let Wy = 0.5;
          let Ey = 0.5;

          if (smoothOutline) {
            Nx = (value & 4) === (value & 8) ? 0.5 : lerp(s1, s2, 0, 1, 1);
            Sx = (value & 1) === (value & 2) ? 0.5 : lerp(s4, s3, 0, 1, 1);
            Wy = (value & 1) === (value & 8) ? 0.5 : lerp(s1, s4, 0, 1, 1);
            Ey = (value & 2) === (value & 4) ? 0.5 : lerp(s2, s3, 0, 1, 1);
          }

          const N = {
            x: sampleX + Nx * CELL_SIZE,
            y: sampleY,
          };
          const S = { x: sampleX + Sx * CELL_SIZE, y: sampleY + CELL_SIZE };
          const W = { x: sampleX, y: sampleY + Wy * CELL_SIZE };
          const E = { x: sampleX + CELL_SIZE, y: sampleY + Ey * CELL_SIZE };

          switch (value) {
            case 1:
              drawLine(S, W);
              break;
            case 2:
              drawLine(S, E);
              break;
            case 3:
              drawLine(W, E);
              break;
            case 4:
              drawLine(N, E);
              break;
            case 5:
              drawLine(S, E);
              drawLine(N, W);
              break;
            case 6:
              drawLine(N, S);
              break;
            case 7:
              drawLine(N, W);
              break;
            case 8:
              drawLine(N, W);
              break;
            case 9:
              drawLine(N, S);
              break;
            case 10:
              drawLine(N, E);
              drawLine(S, W);
              break;
            case 11:
              drawLine(N, E);
              break;
            case 12:
              drawLine(W, E);
              break;
            case 13:
              drawLine(S, E);
              break;
            case 14:
              drawLine(S, W);
              break;
            case 15:
              break;
          }
        }
      }
    }

    ctx.fillStyle = "#fffd";
    ctx.strokeStyle = "#fffd";
    ctx.font = "18px arial";
    ctx.fillText("resolution: " + CELL_SIZE, 10, 30);

    ctx.fillText("smooth: " + (smoothOutline ? 'on' : 'off'), 10, 60);
  };

  const drawLine = (A, B) => {
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.closePath();
    ctx.stroke();
  };

  const lerp = (x0, x1, y0, y1, x) => {
    if (x0 === x1) {
      return null;
    }

    return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  };

  const balls = [];
  for (var i = 0; i < 6; i++) {
    const r = 50 + Math.random() * 50;
    balls.push({
      x: Math.random() * (W - 200) + 100,
      y: Math.random() * (H - 200) + 100,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      r,
      r2: r * r,
    });
  }

  let samples = [];

  tick();

  window.addEventListener("keypress", function (e) {
    if (e.key === "1") {
      renderBalls = !renderBalls;
    } else if (e.key === "2") {
      renderSamplesGrid = !renderSamplesGrid;
    } else if (e.key === "3") {
      renderOutline = !renderOutline;
    } else if (e.key === "4") {
      smoothOutline = !smoothOutline;
    } else if (e.key === "+" || e.key === "=") {
      CELL_SIZE = Math.min(100, CELL_SIZE + 10)
    } else if (e.key === "-") {
      CELL_SIZE = Math.max(10, CELL_SIZE - 10)
    }
  });
}
