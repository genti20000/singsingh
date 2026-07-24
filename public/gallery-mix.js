(() => {
  const WALL_MS = 8000;
  const SINGLE_MS = 7000;
  let wall;
  let timer;

  const css = `
    .mix-wall{position:absolute;z-index:4;inset:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:minmax(0,1fr);gap:8px;padding:clamp(110px,16vh,210px) 18px 54px;background:#08050d}
    .mix-wall figure{position:relative;min-width:0;min-height:0;margin:0;overflow:hidden;background:#160e20}
    .mix-wall img{display:block;width:100%;height:100%;object-fit:contain;background:#0d0813}
    .mix-wall figcaption{position:absolute;inset:auto 0 0;padding:22px 10px 9px;background:linear-gradient(transparent,#08040eee);font-size:clamp(12px,1.2vw,21px);font-weight:900}
    .mix-wall.count-2{grid-template-columns:repeat(2,1fr)}.mix-wall.count-3{grid-template-columns:2fr 1fr}.mix-wall.count-3 figure:first-child{grid-row:span 2}.mix-wall.count-4{grid-template-columns:repeat(2,1fr)}
    @media(orientation:portrait){.mix-wall{display:none}}
  `;

  async function showWall() {
    if (!matchMedia('(orientation: landscape)').matches) return schedule(SINGLE_MS);
    const stage = document.querySelector('.showcase-stage');
    if (!stage) return schedule(1000);
    try {
      const response = await fetch('/api/submissions?status=approved&media=image', { cache: 'no-store' });
      const photos = (await response.json()).submissions || [];
      if (photos.length < 2) return schedule(SINGLE_MS);
      wall?.remove();
      wall = document.createElement('div');
      wall.className = `mix-wall count-${Math.min(photos.length, 6)}`;
      photos.slice(0, 12).forEach(photo => {
        const figure = document.createElement('figure');
        const image = document.createElement('img');
        image.src = `/api/media/${photo.id}?gallery=1`;
        image.alt = photo.caption || 'Guest selfie on the SingShot Live Wall of Fame';
        figure.append(image);
        if (photo.caption) {
          const caption = document.createElement('figcaption');
          caption.textContent = photo.caption;
          figure.append(caption);
        }
        wall.append(figure);
      });
      stage.append(wall);
      schedule(WALL_MS, hideWall);
    } catch {
      schedule(SINGLE_MS);
    }
  }

  function hideWall() {
    wall?.remove();
    wall = undefined;
    schedule(SINGLE_MS, showWall);
  }

  function schedule(delay, next = showWall) {
    clearTimeout(timer);
    timer = setTimeout(next, delay);
  }

  const style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);
  addEventListener('orientationchange', hideWall);
  showWall();
})();
