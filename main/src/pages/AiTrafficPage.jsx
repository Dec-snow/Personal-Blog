import ServerInfoPanel from "../components/ServerInfoPanel";

const AiTrafficPage = () => {
  return (
    <section
      className="ai-traffic-page relative min-h-screen overflow-x-hidden pb-16 pt-16 md:pb-20 md:pt-20"
      style={{
        background:
          "linear-gradient(135deg, #FFF8E7 0%, #FFFDF5 45%, #EAF6FF 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute -left-16 top-24 h-56 w-56 rounded-full bg-[#FFD43B]/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-10 bottom-32 h-64 w-64 rounded-full bg-[#FF8FAB]/15 blur-3xl"
        aria-hidden
      />

      <div className="ai-traffic-shell relative mx-auto w-full max-w-[1100px] px-3 sm:px-4 md:px-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#FF8FAB]">
          Site Monitor
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-[#2B2B2B] md:text-5xl">
          <span className="text-[#FF8FAB]">✦</span> 数据中心
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#6B7280]">
          实时呈现服务器运行状态，让每一次访问都留下可被回看的痕迹。
        </p>

        <div className="mt-8">
          <ServerInfoPanel />
        </div>

        <div className="mt-10 mb-3 flex items-center gap-3">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#F2E6C9] to-transparent" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#FF8FAB]">
            ✦ 站点信息
          </span>
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#F2E6C9] to-transparent" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-[20px] border border-[#F2E6C9] bg-white p-5 shadow-[0_12px_30px_rgba(255,143,171,0.12)]">
            <div className="flex items-center gap-2">
              <span className="text-lg text-[#74C0FC]">◆</span>
              <h3 className="text-sm font-bold text-[#2B2B2B]">技术栈</h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#6B7280]">
              React 18 + Vite + Tailwind CSS 3 + GSAP，前端单页应用架构。
            </p>
          </div>

          <div className="rounded-[20px] border border-[#F2E6C9] bg-white p-5 shadow-[0_12px_30px_rgba(255,143,171,0.12)]">
            <div className="flex items-center gap-2">
              <span className="text-lg text-[#FFD43B]">◆</span>
              <h3 className="text-sm font-bold text-[#2B2B2B]">资源存储</h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#6B7280]">
              静态资源托管于腾讯云 COS 对象存储，壁纸、相册等媒体文件按需加载。
            </p>
          </div>

          <div className="rounded-[20px] border border-[#F2E6C9] bg-white p-5 shadow-[0_12px_30px_rgba(255,143,171,0.12)] sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <span className="text-lg text-[#FF8FAB]">◆</span>
              <h3 className="text-sm font-bold text-[#2B2B2B]">部署方式</h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#6B7280]">
              本地开发与构建，静态文件部署至云端，无需后端服务即可运行。
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AiTrafficPage;
