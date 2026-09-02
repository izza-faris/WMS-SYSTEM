import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { RouterOutlet } from '@angular/router';

interface NetworkNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  pulsePhase: number;
}

interface TransitPacket {
  fromIndex: number;
  toIndex: number;
  progress: number;
  speed: number;
  color: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <!-- Global Animated Background Stage for Full Web Application -->
    <div class="global-animation-stage" aria-hidden="true">
      <!-- Floating Aurora Ambient Spheres -->
      <div class="aurora-orb orb-indigo"></div>
      <div class="aurora-orb orb-cyan"></div>
      <div class="aurora-orb orb-purple"></div>
      <div class="aurora-orb orb-emerald"></div>

      <!-- Cyber Logistics Perspective Grid -->
      <div class="cyber-grid"></div>
      <div class="grid-scan-beam"></div>

      <!-- Global Logistics Constellation Network Canvas -->
      <canvas #globalNetworkCanvas class="global-logistics-canvas"></canvas>
    </div>

    <!-- Routed Application Views -->
    <div class="app-content-root position-relative">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background-color: #080c15;
      position: relative;
    }

    .app-content-root {
      position: relative;
      z-index: 2;
      min-height: 100vh;
    }

    /* Fixed Global Animation Stage Behind All Pages */
    .global-animation-stage {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    }

    .global-logistics-canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      z-index: 3;
      pointer-events: none;
    }

    /* Ambient Aurora Gradient Orbs */
    .aurora-orb {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
      z-index: 1;
      will-change: transform, opacity;
    }

    .orb-indigo {
      width: 600px;
      height: 600px;
      top: -120px;
      left: -120px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.38) 0%, rgba(79, 70, 229, 0.12) 50%, transparent 75%);
      filter: blur(100px);
      animation: driftOrb1 20s ease-in-out infinite alternate;
    }

    .orb-cyan {
      width: 540px;
      height: 540px;
      top: 20%;
      right: -140px;
      background: radial-gradient(circle, rgba(6, 182, 212, 0.32) 0%, rgba(14, 165, 233, 0.1) 50%, transparent 75%);
      filter: blur(90px);
      animation: driftOrb2 24s ease-in-out infinite alternate;
    }

    .orb-purple {
      width: 560px;
      height: 560px;
      bottom: -140px;
      left: 15%;
      background: radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, rgba(147, 51, 234, 0.08) 50%, transparent 75%);
      filter: blur(105px);
      animation: driftOrb3 22s ease-in-out infinite alternate;
    }

    .orb-emerald {
      width: 440px;
      height: 440px;
      bottom: 8%;
      right: 8%;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.06) 50%, transparent 75%);
      filter: blur(95px);
      animation: driftOrb4 26s ease-in-out infinite alternate;
    }

    @keyframes driftOrb1 {
      0% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(140px, 90px) scale(1.1); }
      100% { transform: translate(70px, 160px) scale(0.95); }
    }

    @keyframes driftOrb2 {
      0% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(-120px, 100px) scale(1.12); }
      100% { transform: translate(-60px, -70px) scale(0.92); }
    }

    @keyframes driftOrb3 {
      0% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(90px, -100px) scale(1.08); }
      100% { transform: translate(-50px, -70px) scale(0.96); }
    }

    @keyframes driftOrb4 {
      0% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(-90px, -80px) scale(1.15); }
      100% { transform: translate(80px, -40px) scale(0.9); }
    }

    /* Cyber Logistics Coordinate Grid */
    .cyber-grid {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
      background-size: 52px 52px;
      mask-image: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.8) 30%, transparent 80%);
      -webkit-mask-image: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.8) 30%, transparent 80%);
      z-index: 2;
      pointer-events: none;
    }

    /* Ambient Laser Scan Beam */
    .grid-scan-beam {
      position: absolute;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent 0%, rgba(99, 102, 241, 0.5) 30%, rgba(6, 182, 212, 0.7) 50%, rgba(99, 102, 241, 0.5) 70%, transparent 100%);
      box-shadow: 0 0 16px rgba(6, 182, 212, 0.6);
      z-index: 2;
      opacity: 0.45;
      animation: scanGridBeam 12s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      pointer-events: none;
    }

    @keyframes scanGridBeam {
      0% { top: -5%; opacity: 0; }
      15% { opacity: 0.5; }
      85% { opacity: 0.5; }
      100% { top: 105%; opacity: 0; }
    }
  `]
})
export class AppComponent implements AfterViewInit, OnDestroy {
  title = 'AeroWMS';

  @ViewChild('globalNetworkCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private animationFrameId: number | null = null;
  private resizeListener: (() => void) | null = null;
  private mouseMoveListener: ((e: MouseEvent) => void) | null = null;

  private nodes: NetworkNode[] = [];
  private packets: TransitPacket[] = [];
  private mousePos = { x: -9999, y: -9999, radius: 150 };

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    // Run canvas animation completely outside Angular's zone for continuous 60 FPS
    this.ngZone.runOutsideAngular(() => {
      this.initNetworkSimulation();
    });
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
    if (this.mouseMoveListener) {
      window.removeEventListener('mousemove', this.mouseMoveListener);
    }
  }

  private initNetworkSimulation(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setupDimensions = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    setupDimensions();

    this.resizeListener = () => {
      setupDimensions();
      this.populateNodes(canvas);
    };
    window.addEventListener('resize', this.resizeListener);

    this.mouseMoveListener = (e: MouseEvent) => {
      this.mousePos.x = e.clientX;
      this.mousePos.y = e.clientY;
    };
    window.addEventListener('mousemove', this.mouseMoveListener);

    this.populateNodes(canvas);

    let lastPacketTime = 0;

    const render = (time: number) => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      ctx.clearRect(0, 0, width, height);

      // Periodically spawn transit pulses between connected nodes
      if (time - lastPacketTime > 650 && this.nodes.length > 5 && this.packets.length < 18) {
        lastPacketTime = time;
        const fromIdx = Math.floor(Math.random() * this.nodes.length);
        let closestIdx = -1;
        let minD = Infinity;
        for (let i = 0; i < this.nodes.length; i++) {
          if (i === fromIdx) continue;
          const dx = this.nodes[fromIdx].x - this.nodes[i].x;
          const dy = this.nodes[fromIdx].y - this.nodes[i].y;
          const dist = Math.hypot(dx, dy);
          if (dist < 180 && dist < minD) {
            minD = dist;
            closestIdx = i;
          }
        }

        if (closestIdx !== -1) {
          const colors = ['#818cf8', '#38bdf8', '#34d399', '#c084fc'];
          this.packets.push({
            fromIndex: fromIdx,
            toIndex: closestIdx,
            progress: 0,
            speed: 0.007 + Math.random() * 0.006,
            color: colors[Math.floor(Math.random() * colors.length)]
          });
        }
      }

      // Draw and update network nodes
      for (let i = 0; i < this.nodes.length; i++) {
        const node = this.nodes[i];

        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        // Interactive mouse avoidance
        const mdx = node.x - this.mousePos.x;
        const mdy = node.y - this.mousePos.y;
        const mDist = Math.hypot(mdx, mdy);
        if (mDist < this.mousePos.radius && mDist > 0) {
          const force = (1 - mDist / this.mousePos.radius) * 0.7;
          node.x += (mdx / mDist) * force;
          node.y += (mdy / mDist) * force;
        }

        node.pulsePhase += 0.025;
        const pulsingRadius = node.radius + Math.sin(node.pulsePhase) * 0.8;

        // Draw node dot
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulsingRadius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.globalAlpha = node.alpha;
        ctx.fill();

        // Outer glow circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulsingRadius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = node.color;
        ctx.globalAlpha = node.alpha * 0.28;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw connecting route lines
        for (let j = i + 1; j < this.nodes.length; j++) {
          const nodeB = this.nodes[j];
          const dx = node.x - nodeB.x;
          const dy = node.y - nodeB.y;
          const dist = Math.hypot(dx, dy);

          const maxDist = 160;
          if (dist < maxDist) {
            const linkAlpha = (1 - dist / maxDist) * 0.18;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(nodeB.x, nodeB.y);
            ctx.strokeStyle = '#6366f1';
            ctx.globalAlpha = linkAlpha;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Draw and update moving pulses (transit packets)
      for (let p = this.packets.length - 1; p >= 0; p--) {
        const pkt = this.packets[p];
        pkt.progress += pkt.speed;

        if (pkt.progress >= 1) {
          this.packets.splice(p, 1);
          continue;
        }

        const nodeA = this.nodes[pkt.fromIndex];
        const nodeB = this.nodes[pkt.toIndex];
        if (!nodeA || !nodeB) {
          this.packets.splice(p, 1);
          continue;
        }

        const px = nodeA.x + (nodeB.x - nodeA.x) * pkt.progress;
        const py = nodeA.y + (nodeB.y - nodeA.y) * pkt.progress;

        ctx.beginPath();
        ctx.arc(px, py, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = pkt.color;
        ctx.globalAlpha = 0.9;
        ctx.shadowColor = pkt.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.globalAlpha = 1;
      this.animationFrameId = requestAnimationFrame(render);
    };

    this.animationFrameId = requestAnimationFrame(render);
  }

  private populateNodes(canvas: HTMLCanvasElement): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Responsive node count
    const count = Math.floor(Math.min(50, Math.max(22, (width * height) / 26000)));
    this.nodes = [];
    this.packets = [];

    const palette = ['#818cf8', '#38bdf8', '#34d399', '#c084fc'];

    for (let i = 0; i < count; i++) {
      this.nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: 2 + Math.random() * 2,
        color: palette[Math.floor(Math.random() * palette.length)],
        alpha: 0.3 + Math.random() * 0.35,
        pulsePhase: Math.random() * Math.PI * 2
      });
    }
  }
}
