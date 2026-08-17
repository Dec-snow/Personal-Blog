import { useCallback, useEffect, useState } from "react";
import { FiUpload, FiSend, FiTrash2, FiImage, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import { authMe, authLogin, authLogout } from "../services/authApi";
import {
  deleteOwnerMoment,
  fetchOwnerStatus,
  fetchPublicMoments,
  isPublicImageURL,
  publishOwnerMoment,
  uploadOwnerAsset,
} from "../services/ownerApi";
import {
  ownerConsoleModules,
  ownerConsoleScreens,
} from "../pwa/appConsoleBlueprint";
import {
  getBackendHealthLabel,
  getOwnerSessionLabel,
} from "../pwa/appConsoleState";
import {
  getOwnerGalleryAlbumSelection,
  ownerCustomGalleryAlbumValue,
  ownerGalleryAlbumOptions,
} from "../lib/ownerGalleryAlbums";
import { moments as publishedMoments } from "../data/moments";

const screenMap = Object.fromEntries(ownerConsoleScreens.map((screen) => [screen.id, screen]));

const defaultMoment = {
  year: "",
  date: "",
  type: "",
  content: "",
};

const fetchBackendHealth = async () => {
  const res = await fetch("/api/v1/health", {
    headers: { Accept: "application/json" },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`);
  return data;
};

const moduleToneClass = {
  rose: "owner-module-icon owner-module-icon--rose",
  green: "owner-module-icon owner-module-icon--green",
  sun: "owner-module-icon owner-module-icon--sun",
  blue: "owner-module-icon owner-module-icon--blue",
};

const StatusTag = ({ children }) => <span className="owner-tag">{children}</span>;

const AppConsolePage = () => {
  const [activeScreen, setActiveScreen] = useState("home");
  const [auth, setAuth] = useState(null);
  const [health, setHealth] = useState(null);
  const [ownerStatus, setOwnerStatus] = useState(null);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  // ── Login state ──
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // ── Moments state ──
  const [momentYear, setMomentYear] = useState(defaultMoment.year);
  const [momentDate, setMomentDate] = useState(defaultMoment.date);
  const [momentType, setMomentType] = useState(defaultMoment.type);
  const [momentContent, setMomentContent] = useState(defaultMoment.content);
  const [momentPublishBusy, setMomentPublishBusy] = useState(false);
  const [momentImages, setMomentImages] = useState([]);
  const [momentImageBusy, setMomentImageBusy] = useState(false);
  const [momentImageURL, setMomentImageURL] = useState("");
  const [momentImageMode, setMomentImageMode] = useState("upload"); // "upload" | "url"
  const [momentList, setMomentList] = useState(publishedMoments);
  const [deleteBusyKey, setDeleteBusyKey] = useState("");
  const [deleteConfirmKey, setDeleteConfirmKey] = useState("");

  // ── Gallery state ──
  const [galleryAlbum, setGalleryAlbum] = useState(ownerGalleryAlbumOptions[0]?.value || "");
  const [customGalleryAlbum, setCustomGalleryAlbum] = useState("");
  const [galleryURLInput, setGalleryURLInput] = useState("");
  const [galleryUploads, setGalleryUploads] = useState([]);
  const [uploadBusy, setUploadBusy] = useState(false);

  const showError = (msg) => {
    setError(msg);
    setSuccessMsg("");
    // 会话过期时自动返回登录界面
    if (msg.includes("请先登录") || msg.includes("UNAUTHORIZED")) {
      setAuth({ loggedIn: false });
    }
  };
  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setError("");
    setTimeout(() => setSuccessMsg(""), 5000);
  };

  const loadConsole = useCallback(async () => {
    setError("");
    const [authResult, healthResult, ownerStatusResult, momentsResult] =
      await Promise.allSettled([
        authMe(),
        fetchBackendHealth(),
        fetchOwnerStatus(),
        fetchPublicMoments(),
      ]);

    if (authResult.status === "fulfilled") {
      setAuth(authResult.value.ok ? authResult.value.data : { loggedIn: false });
    }
    if (healthResult.status === "fulfilled") setHealth(healthResult.value);
    if (ownerStatusResult.status === "fulfilled") setOwnerStatus(ownerStatusResult.value);
    if (momentsResult.status === "fulfilled" && momentsResult.value?.items) {
      setMomentList(momentsResult.value.items);
    }

    const requiredFailures = [authResult, healthResult].some(
      (result) => result.status === "rejected",
    );
    if (requiredFailures) {
      setError("部分后端信号暂时不可用，可以继续操作随笔与相册。");
    }
  }, []);

  useEffect(() => {
    loadConsole();
  }, [loadConsole]);

  // ── Login handlers ──
  const handleLogin = async () => {
    setLoginBusy(true);
    setError("");
    try {
      const result = await authLogin(loginEmail, loginPassword);
      if (result.ok) {
        setLoginPassword("");
        await loadConsole();
      } else {
        setError(result.data?.message || "登录失败");
      }
    } catch (e) {
      setError(e.message || "登录请求失败");
    } finally {
      setLoginBusy(false);
    }
  };

  const handleLogout = async () => {
    setError("");
    try {
      await authLogout();
    } catch {
      // 即使登出请求失败也清除本地状态
    }
    setAuth({ loggedIn: false });
    setLoginEmail("");
    setLoginPassword("");
  };

  const isOwnerReady = Boolean(auth?.loggedIn && auth?.user?.isOwner && auth?.unlimited);

  const activeMeta = screenMap[activeScreen] || screenMap.home;
  const ownerLabel = getOwnerSessionLabel(auth);
  const healthLabel = getBackendHealthLabel(health);

  const openScreen = (screenId) => {
    setActiveScreen(screenId);
    setError("");
    setSuccessMsg("");
    setDeleteConfirmKey(""); // cancel any pending delete confirmation
  };

  // ── Gallery handlers ──
  const handleGalleryUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadBusy(true);
    setError("");
    try {
      const albumSelection = getOwnerGalleryAlbumSelection(galleryAlbum, customGalleryAlbum);
      const uploadAlbum = albumSelection.albumId || albumSelection.albumTitle;
      if (!uploadAlbum) {
        throw new Error("请选择相册，或填写自定义相册名。");
      }
      const data = await uploadOwnerAsset(file, { kind: "gallery", album: uploadAlbum });
      const item = data.item || {};
      setGalleryUploads((current) => [
        {
          name: item.path || item.name || file.name,
          url: item.url || "",
          albumId: albumSelection.albumId,
          albumTitle: albumSelection.albumTitle,
        },
        ...current,
      ]);
      showSuccess("图片上传成功！");
      await loadConsole();
    } catch (e) {
      showError(e.message || "图片上传失败");
    } finally {
      event.target.value = "";
      setUploadBusy(false);
    }
  };

  const handleAddGalleryURL = () => {
    const next = galleryURLInput.trim();
    if (!isPublicImageURL(next)) {
      showError("请输入有效的公开图片 URL。");
      return;
    }
    const albumSelection = getOwnerGalleryAlbumSelection(galleryAlbum, customGalleryAlbum);
    if (!albumSelection.albumId && !albumSelection.albumTitle) {
      showError("请选择相册，或填写自定义相册名。");
      return;
    }
    setError("");
    setGalleryUploads((current) => [
      {
        name: "PicGo 图片 URL",
        url: next,
        albumId: albumSelection.albumId,
        albumTitle: albumSelection.albumTitle,
      },
      ...current,
    ]);
    setGalleryURLInput("");
  };

  // ── Moment image handlers ──
  const handleMomentImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setMomentImageBusy(true);
    setError("");
    try {
      const data = await uploadOwnerAsset(file, { kind: "moment", album: "moments" });
      const item = data.item || {};
      setMomentImages((current) => [
        ...current,
        { url: item.url, name: item.path || item.name || file.name },
      ]);
      showSuccess("图片上传成功！");
    } catch (e) {
      const msg = e.message || "";
      if (msg.includes("COS") || msg.includes("cos") || msg.includes("上传尚未配置") || msg.includes("not configured")) {
        showError("COS 上传服务尚未配置。你可以切换到「粘贴图片 URL」模式来添加图片链接。");
      } else {
        showError(msg || "图片上传失败，可尝试使用图片 URL 代替。");
      }
    } finally {
      event.target.value = "";
      setMomentImageBusy(false);
    }
  };

  const handleAddMomentImageURL = () => {
    const url = momentImageURL.trim();
    if (!url) return;
    if (!isPublicImageURL(url)) {
      showError("请输入有效的公开图片 URL（以 http:// 或 https:// 开头）。");
      return;
    }
    setMomentImages((current) => [
      ...current,
      { url, name: "图片链接" },
    ]);
    setMomentImageURL("");
    showSuccess("图片链接已添加！");
  };

  const handleRemoveMomentImage = (index) => {
    setMomentImages((current) => current.filter((_, i) => i !== index));
  };

  // ── Moment publish handler ──
  const handlePublishMoment = async () => {
    const year = momentYear.trim();
    const date = momentDate.trim();
    const type = momentType.trim();
    const content = momentContent.trim();
    if (!year || !type || !content) {
      showError("请填写碎语年份、分类和内容。");
      return;
    }

    setMomentPublishBusy(true);
    setError("");
    try {
      const payload = { year, date, type, content };
      if (momentImages.length > 0) {
        payload.imageUrl = momentImages[0].url;
        payload.imageAlt = type;
      }
      await publishOwnerMoment(payload);
      showSuccess("碎语发布成功！");
      setMomentYear(defaultMoment.year);
      setMomentDate(defaultMoment.date);
      setMomentType(defaultMoment.type);
      setMomentContent(defaultMoment.content);
      setMomentImages([]);
      await loadConsole();
    } catch (e) {
      showError(e.message || "碎语发布失败");
    } finally {
      setMomentPublishBusy(false);
    }
  };

  // ── Moment delete handler ──
  const handleDeleteMoment = async (moment, idx) => {
    const uniqueKey = moment.id ? `id-${moment.id}` : `${moment.year}-${moment.date}-${moment.type}-${idx}`;

    // First click: ask for confirmation
    if (deleteConfirmKey !== uniqueKey) {
      setDeleteConfirmKey(uniqueKey);
      setError("");
      return;
    }

    // Second click: execute delete
    setDeleteConfirmKey("");
    setDeleteBusyKey(uniqueKey);
    setError("");
    try {
      const payload = { year: moment.year, date: moment.date, type: moment.type };
      // Prefer ID-based deletion to avoid deleting multiple moments that share year/date/type
      if (moment.id) payload.id = moment.id;
      await deleteOwnerMoment(payload);
      showSuccess("碎语删除成功！");
      setMomentList((current) =>
        current.filter((m) => {
          // Remove by ID if available, otherwise by index
          if (moment.id) return m.id !== moment.id;
          return current.indexOf(m) !== idx;
        }),
      );
    } catch (e) {
      showError(e.message || "碎语删除失败");
    } finally {
      setDeleteBusyKey("");
    }
  };

  if (!isOwnerReady) {
    return (
      <main className="owner-console">
        <div className="owner-login-wrap">
          <div className="owner-login-card owner-glass">
            <h2 className="owner-login-title">
              <FiLock aria-hidden /> 站长登录
            </h2>
            {error ? (
              <p className="owner-login-error">{error}</p>
            ) : null}
            <>
              <div className="owner-field">
                <label>邮箱</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="站长邮箱"
                  autoComplete="off"
                  name="owner-email"
                />
              </div>
              <div className="owner-field">
                <label>密码</label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !loginBusy) handleLogin(); }}
                    placeholder="请输入密码"
                    autoComplete="new-password"
                    name="owner-password"
                    style={{ paddingRight: 40, width: "100%" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{
                      position: "absolute",
                      right: 8,
                      background: "none",
                      border: "none",
                      color: "#8a7078",
                      cursor: "pointer",
                      padding: 4,
                      display: "flex",
                      alignItems: "center",
                      fontSize: 18,
                    }}
                    aria-label={showPassword ? "隐藏密码" : "显示密码"}
                    tabIndex={-1}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
              <button
                type="button"
                className="owner-login-btn"
                onClick={handleLogin}
                disabled={loginBusy || !loginPassword}
              >
                <FiLock aria-hidden /> {loginBusy ? "登录中..." : "登录"}
              </button>
            </>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="owner-console">
      <div className="owner-console-app">
        {/* ── Sidebar ── */}
        <aside className="owner-console-sidebar owner-glass" aria-label="后端控制台分区">
          <button
            type="button"
            className="owner-brand"
            onClick={() => openScreen("home")}
            aria-label="打开后端控制台"
          >
            <img
              className="owner-brand-mark"
              src="https://my-blog-static-1464122491.cos.ap-guangzhou.myqcloud.com/%E5%A4%B4%E5%83%8F/01.jpg"
              alt="站长头像"
            />
            <span>
              <strong>后端控制台</strong>
              <small>站长后台</small>
            </span>
          </button>
          <nav className="owner-nav">
            {ownerConsoleScreens.map((screen) => (
              <button
                type="button"
                key={screen.id}
                className={activeScreen === screen.id ? "active" : ""}
                onClick={() => openScreen(screen.id)}
              >
                <span className="owner-nav-icon">{screen.icon}</span>
                <span>{screen.navLabel}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Workspace ── */}
        <section className="owner-workspace">
          {/* ── Top bar ── */}
          <header className="owner-topbar owner-glass">
            <div>
              <h1 className="owner-page-title">{activeMeta.title}</h1>
              <p className="owner-page-sub">{activeMeta.subtitle}</p>
            </div>
            <div className="owner-top-actions">
              <button
                type="button"
                className="owner-secondary"
                onClick={handleLogout}
                style={{ marginRight: 8, fontSize: "0.78rem", padding: "5px 12px" }}
                title="退出登录"
              >
                退出登录
              </button>
              <span className="owner-pill">
                <span className="owner-status-dot" />
                最新部署：等待发布阶段
              </span>
              <img
                src="https://my-blog-static-1464122491.cos.ap-guangzhou.myqcloud.com/%E5%A4%B4%E5%83%8F/01.jpg"
                alt="站长头像"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid rgba(200,130,145,0.35)",
                  flexShrink: 0,
                }}
              />
            </div>
          </header>

          {/* ── Notifications ── */}
          {error ? (
            <p className="owner-alert" role="alert">{error}</p>
          ) : null}
          {successMsg ? (
            <p className="owner-alert" style={{ background: "rgba(156, 201, 168, 0.12)", color: "#3a6850", borderColor: "rgba(156, 201, 168, 0.22)" }} role="status">
              {successMsg}
            </p>
          ) : null}

          {/* ══════════ HOME SCREEN ══════════ */}
          <section className={`owner-screen ${activeScreen === "home" ? "active" : ""}`}>
            <div className="owner-home-main">
              <div className="owner-section-title">
                <div>
                  <h2>快捷模块</h2>
                  <p>管理随笔与相册内容，监控后端状态。</p>
                </div>
                <StatusTag>在线</StatusTag>
              </div>
              <div className="owner-module-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                {ownerConsoleModules.map((module) => (
                  <button
                    type="button"
                    key={module.id}
                    className="owner-module-card"
                    onClick={() => openScreen(module.id)}
                  >
                    <span className="owner-module-head">
                      <span>
                        <strong>{module.title}</strong>
                        <small>{module.description}</small>
                      </span>
                      <span className={moduleToneClass[module.tone]}>{module.icon}</span>
                    </span>
                    <span className="owner-tiny-status">{module.status}</span>
                  </button>
                ))}
              </div>

              <section className="owner-panel owner-glass">
                <div className="owner-panel-title">
                  <h2>服务器状态</h2>
                  <StatusTag>{ownerStatus ? "实时" : "备用"}</StatusTag>
                </div>
                <div className="owner-stats-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                  <article className="owner-stat-card">
                    <span>站长会话</span>
                    <strong>{ownerLabel}</strong>
                    <em>{healthLabel}</em>
                  </article>
                  <article className="owner-stat-card">
                    <span>已上传图片</span>
                    <strong>{galleryUploads.length}</strong>
                    <em>本会话</em>
                  </article>
                </div>
                <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="owner-primary"
                    onClick={() => openScreen("moments")}
                  >
                    <FiSend aria-hidden /> 发布新随笔
                  </button>
                </div>
              </section>
            </div>
          </section>

          {/* ══════════ GALLERY SCREEN ══════════ */}
          <section className={`owner-screen ${activeScreen === "gallery" ? "active" : ""}`}>
            <div className="owner-form-shell owner-glass">
              <div>
                <div className="owner-field">
                  <label htmlFor="galleryAlbum">目标相册</label>
                  <select
                    id="galleryAlbum"
                    value={galleryAlbum}
                    onChange={(e) => setGalleryAlbum(e.target.value)}
                  >
                    {ownerGalleryAlbumOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                {galleryAlbum === ownerCustomGalleryAlbumValue ? (
                  <div className="owner-field owner-field--spaced">
                    <label htmlFor="customGalleryAlbum">自定义相册名</label>
                    <input
                      id="customGalleryAlbum"
                      value={customGalleryAlbum}
                      placeholder="请输入自定义相册名"
                      onChange={(e) => setCustomGalleryAlbum(e.target.value)}
                    />
                  </div>
                ) : null}

                <label className="owner-dropzone" htmlFor="galleryUpload">
                  <strong>📁 点击选择图片上传</strong>
                  <span>支持 PNG、JPEG、WebP、GIF 格式，上传到 COS。</span>
                </label>
                <input
                  id="galleryUpload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleGalleryUpload}
                  hidden
                />

                <div className="owner-field owner-field--spaced">
                  <label htmlFor="galleryURLInput">或粘贴公开图片 URL（PicGo）</label>
                  <input
                    id="galleryURLInput"
                    value={galleryURLInput}
                    placeholder="https://cdn.example/gallery/demo.png"
                    onChange={(e) => setGalleryURLInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddGalleryURL(); }}
                  />
                </div>

                {galleryUploads.length > 0 ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
                      gap: 10,
                      marginTop: 12,
                    }}
                  >
                    {galleryUploads.map((item, i) => (
                      <div
                        key={item.url || item.name}
                        title={item.url || item.name}
                        style={{
                          position: "relative",
                          borderRadius: 12,
                          overflow: "hidden",
                          aspectRatio: "1",
                          background: "rgba(255,240,235,0.6)",
                          border: i === 0 ? "2px solid rgba(200,130,145,0.5)" : "1px solid rgba(210,180,140,0.25)",
                        }}
                      >
                        <img
                          src={item.url}
                          alt={item.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                        <span
                          style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: "2px 4px",
                            fontSize: 9,
                            color: "#fff",
                            background: "rgba(0,0,0,0.55)",
                            textAlign: "center",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.albumTitle || item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="owner-quick-line">
                  <label
                    className={`owner-secondary ${uploadBusy ? "owner-secondary--disabled" : ""}`}
                    htmlFor="galleryUpload"
                    aria-disabled={uploadBusy}
                  >
                    <FiUpload aria-hidden /> {uploadBusy ? "上传中..." : "上传到 COS"}
                  </label>
                  <button type="button" className="owner-secondary" onClick={handleAddGalleryURL}>
                    添加 PicGo URL
                  </button>
                </div>
              </div>

              <aside className="owner-preview-card">
                <div className="owner-kicker">上传预览</div>
                {galleryUploads[0]?.url ? (
                  <>
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "16/10",
                        borderRadius: 16,
                        overflow: "hidden",
                        background: "rgba(255,240,235,0.5)",
                        border: "1px solid rgba(210,180,140,0.2)",
                        marginBottom: 10,
                      }}
                    >
                      <img
                        src={galleryUploads[0].url}
                        alt="预览"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.parentElement.style.display = "none";
                        }}
                      />
                    </div>
                    <h2 style={{ fontSize: "0.95rem", margin: "0 0 2px", fontWeight: 600 }}>
                      {galleryUploads[0].name}
                    </h2>
                    <p style={{ fontSize: "0.72rem", color: "#8a7078", lineHeight: 1.5, margin: 0 }}>
                      目标相册：{getOwnerGalleryAlbumSelection(galleryAlbum, customGalleryAlbum).albumTitle || "相册"}
                      <br />
                      图片 URL：{galleryUploads[0].url.length > 60
                        ? galleryUploads[0].url.slice(0, 60) + "…"
                        : galleryUploads[0].url}
                    </p>
                  </>
                ) : (
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "16/10",
                      borderRadius: 16,
                      border: "2px dashed rgba(210,180,140,0.35)",
                      background: "rgba(255,248,240,0.5)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#b8a0a8",
                      fontSize: "0.85rem",
                      marginBottom: 10,
                    }}
                  >
                    <span style={{ textAlign: "center" }}>
                      点击上方
                      <br />
                      「📁 选择图片上传」
                      <br />
                      预览缩略图
                    </span>
                  </div>
                )}
                <p style={{ fontSize: "0.72rem", color: "#8a7078", lineHeight: 1.5, margin: 0 }}>
                  上传图片到 COS 或添加公开图片 URL，用于在随笔或相册中引用。
                </p>
              </aside>
            </div>
          </section>

          {/* ══════════ MOMENTS SCREEN ══════════ */}
          <section className={`owner-screen ${activeScreen === "moments" ? "active" : ""}`}>
            <div className="owner-form-shell owner-glass">
              <div>
                <div className="owner-field-row">
                  <div className="owner-field">
                    <label htmlFor="momentYear">年份</label>
                    <input
                      id="momentYear"
                      value={momentYear}
                      placeholder="例如：2026"
                      onChange={(e) => setMomentYear(e.target.value)}
                    />
                  </div>
                  <div className="owner-field">
                    <label htmlFor="momentDate">日期</label>
                    <input
                      id="momentDate"
                      value={momentDate}
                      placeholder="例如：8.10"
                      onChange={(e) => setMomentDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="owner-field">
                  <label htmlFor="momentType">分类</label>
                  <input
                    id="momentType"
                    value={momentType}
                    placeholder="例如：碎碎念"
                    onChange={(e) => setMomentType(e.target.value)}
                  />
                </div>
                <div className="owner-field">
                  <label htmlFor="momentContent">内容</label>
                  <textarea
                    id="momentContent"
                    value={momentContent}
                    placeholder="写下今天的一点点心情…"
                    onChange={(e) => setMomentContent(e.target.value)}
                  />
                </div>

                {/* ── 图片选择区 ── */}
                <div className="owner-field">
                  <label>
                    附图 <small>可选 · 上传到 COS 或粘贴公开图片 URL</small>
                  </label>
                  <div className="owner-quick-line" style={{ marginTop: 0 }}>
                    <button
                      type="button"
                      className={`owner-secondary ${momentImageMode === "upload" ? "owner-secondary--active" : ""}`}
                      onClick={() => setMomentImageMode("upload")}
                      style={momentImageMode === "upload" ? { borderColor: "rgba(200, 130, 145, 0.5)", background: "rgba(255, 240, 235, 0.85)" } : {}}
                    >
                      上传图片
                    </button>
                    <button
                      type="button"
                      className={`owner-secondary ${momentImageMode === "url" ? "owner-secondary--active" : ""}`}
                      onClick={() => setMomentImageMode("url")}
                      style={momentImageMode === "url" ? { borderColor: "rgba(200, 130, 145, 0.5)", background: "rgba(255, 240, 235, 0.85)" } : {}}
                    >
                      粘贴 URL
                    </button>
                  </div>

                  {momentImageMode === "upload" ? (
                    <div style={{ marginTop: 8 }}>
                      <label
                        className={`owner-secondary ${momentImageBusy ? "owner-secondary--disabled" : ""}`}
                        htmlFor="momentImageUpload"
                        aria-disabled={momentImageBusy}
                      >
                        <FiImage aria-hidden /> {momentImageBusy ? "上传中..." : "选择图片文件"}
                      </label>
                      <input
                        id="momentImageUpload"
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={handleMomentImageUpload}
                        hidden
                      />
                      <small style={{ display: "block", marginTop: 4, color: "#8a7078", fontSize: 11 }}>
                        若 COS 未配置会提示错误，可切换到「粘贴 URL」模式。
                      </small>
                    </div>
                  ) : (
                    <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                      <input
                        value={momentImageURL}
                        placeholder="https://example.com/image.jpg"
                        onChange={(e) => setMomentImageURL(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleAddMomentImageURL(); }}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className="owner-secondary"
                        onClick={handleAddMomentImageURL}
                        disabled={!momentImageURL.trim()}
                      >
                        添加
                      </button>
                    </div>
                  )}

                  {momentImages.length > 0 ? (
                    <div className="owner-thumb-grid" style={{ marginTop: 10 }}>
                      {momentImages.map((img, index) => (
                        <span
                          key={img.url || index}
                          style={{ display: "flex", alignItems: "center", gap: 6 }}
                        >
                          <img
                            src={img.url}
                            alt={img.name}
                            style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8 }}
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveMomentImage(index)}
                            style={{ cursor: "pointer", border: "none", background: "none", color: "#c92a2a", fontSize: 14 }}
                            aria-label="移除图片"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="owner-quick-line">
                  <button
                    type="button"
                    className="owner-primary"
                    onClick={handlePublishMoment}
                    disabled={momentPublishBusy}
                  >
                    <FiSend aria-hidden /> {momentPublishBusy ? "发布中..." : "发布碎语"}
                  </button>
                </div>
              </div>
              <aside className="owner-preview-card">
                <div className="owner-kicker">碎语预览</div>
                <div className="owner-friend-preview">
                  <span>{momentYear.slice(0, 2) || "20"}</span>
                  <div>
                    <h2>{momentType || "分类"}</h2>
                    <p>{momentContent || "碎语内容"}</p>
                  </div>
                </div>
                {momentImages[0]?.url ? (
                  <img
                    src={momentImages[0].url}
                    alt="预览"
                    style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 12, marginTop: 8 }}
                  />
                ) : null}
                <p>发布后会写入首页导航的「随笔」页面，支持附图展示。</p>
              </aside>
            </div>

            {/* ── 已发布随笔列表（支持删除） ── */}
            <div className="owner-form-shell owner-glass" style={{ marginTop: 16 }}>
              <div className="owner-panel-title">
                <h2>已发布随笔</h2>
                <StatusTag>{momentList.length} 条</StatusTag>
              </div>
              {momentList.length === 0 ? (
                <p style={{ color: "#8a7078", fontSize: 14, padding: "8px 0" }}>
                  暂无已发布的随笔。
                </p>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  onClick={(e) => { if (!e.target.closest("button")) setDeleteConfirmKey(""); }}
                >
                  {momentList.map((moment, idx) => {
                    const uniqueKey = moment.id ? `id-${moment.id}` : `${moment.year}-${moment.date}-${moment.type}-${idx}`;
                    const isConfirming = deleteConfirmKey === uniqueKey;
                    const isDeleting = deleteBusyKey === uniqueKey;
                    return (
                      <div
                        key={uniqueKey}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "10px 12px",
                          borderRadius: 12,
                          border: isConfirming
                            ? "1px solid rgba(212, 104, 124, 0.45)"
                            : "1px solid rgba(210, 180, 140, 0.2)",
                          background: isConfirming
                            ? "rgba(255, 235, 230, 0.75)"
                            : "rgba(255, 248, 240, 0.6)",
                          transition: "border 0.15s, background 0.15s",
                        }}
                      >
                        {moment.image?.src ? (
                          <img
                            src={moment.image.src}
                            alt={moment.image.alt || ""}
                            style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8, flexShrink: 0 }}
                          />
                        ) : null}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <strong style={{ fontSize: 13 }}>{moment.year} · {moment.date}</strong>
                            <span style={{ fontSize: 11, color: "#8a7078" }}>{moment.type}</span>
                          </div>
                          <p style={{
                            fontSize: 12,
                            color: "#6B7280",
                            margin: "4px 0 0",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}>
                            {moment.lines?.join(" / ") || ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="owner-secondary"
                          onClick={() => handleDeleteMoment(moment, idx)}
                          disabled={isDeleting}
                          style={{
                            flexShrink: 0,
                            padding: "6px 10px",
                            fontSize: 12,
                            ...(isConfirming ? {
                              borderColor: "rgba(212, 104, 124, 0.5)",
                              background: "rgba(212, 104, 124, 0.12)",
                              color: "#a04050",
                            } : {}),
                          }}
                        >
                          <FiTrash2 aria-hidden />{" "}
                          {isDeleting ? "删除中..." : isConfirming ? "确认删除？" : "删除"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <p style={{ fontSize: 11, color: "#aaa", marginTop: 8 }}>
                列表展示数据库中的随笔，发布和删除即时生效。
              </p>
            </div>
          </section>
        </section>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="owner-bottom-nav" aria-label="移动端后端控制台分区">
        {ownerConsoleScreens.map((screen) => (
          <button
            type="button"
            key={screen.id}
            className={activeScreen === screen.id ? "active" : ""}
            onClick={() => openScreen(screen.id)}
          >
            {screen.navLabel}
          </button>
        ))}
      </nav>
    </main>
  );
};

export default AppConsolePage;
