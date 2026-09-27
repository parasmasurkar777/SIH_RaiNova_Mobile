"use client";

import React, { useState, useEffect } from "react";
import { Activity, Clock, Waves, Compass, AlertTriangle, Radio, CloudRain, Droplets, Wind, CloudSun, MapPin, Languages, Menu, X, RotateCcw, GitBranch, Trophy } from "lucide-react";
import { LiveTelemetry } from "../lib/api";
import { useLanguage, Language } from "../lib/i18n/LanguageContext";

interface NavbarProps {
  viewMode: "2D" | "3D";
  onToggleViewMode: () => void;
  disruptionSeverity: string;
  overallHealth: number;
  highTideWarning: boolean;
  onOpenCitizenModal: () => void;
  onResetSimulation: () => void;
  isLiveMode?: boolean;
  onToggleLiveMode?: () => void;
  liveTelemetry?: LiveTelemetry | null;
  portalViewMode?: "PORTAL" | "MAP";
  onTogglePortalViewMode?: () => void;
  isVisible?: boolean;
  onOpenPriorityModal?: () => void;
  onOpenGraphModal?: () => void;
  onApplyPreset?: (presetName: string, rain: number, tide: number, silt: number) => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
  onCloseMobileMenu?: () => void;
}

const NavbarComponent: React.FC<NavbarProps> = ({
  viewMode,
  onToggleViewMode,
  disruptionSeverity,
  overallHealth,
  highTideWarning,
  onOpenCitizenModal,
  onResetSimulation,
  isLiveMode = false,
  onToggleLiveMode,
  liveTelemetry,
  portalViewMode = "MAP",
  onTogglePortalViewMode,
  isVisible = true,
  onOpenPriorityModal,
  onOpenGraphModal,
  onApplyPreset,
  isMobileMenuOpen: externalMobileMenuOpen,
  onToggleMobileMenu,
  onCloseMobileMenu,
}) => {
  const [time, setTime] = useState<string>("");
  const [internalMobileMenuOpen, setInternalMobileMenuOpen] = useState<boolean>(false);
  const isMobileMenuOpen = externalMobileMenuOpen !== undefined ? externalMobileMenuOpen : internalMobileMenuOpen;

  const toggleMobileMenu = () => {
    if (onToggleMobileMenu) {
      onToggleMobileMenu();
    } else {
      setInternalMobileMenuOpen((prev) => !prev);
    }
  };

  const closeMobileMenu = () => {
    if (onCloseMobileMenu) {
      onCloseMobileMenu();
    } else {
      setInternalMobileMenuOpen(false);
    }
  };

  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-IN", { hour12: false }) + " IST");
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const isCritical = disruptionSeverity.includes("RED") || disruptionSeverity.includes("HIGH");
  const rainVal = liveTelemetry?.rainfall_mm_hr ?? 0;
  const tideVal = liveTelemetry?.tide_level_m ?? 3.59;
  const tempVal = liveTelemetry?.temperature_c ?? 28.8;
  const humidityVal = liveTelemetry?.humidity_pct ?? 74;
  const windVal = liveTelemetry?.wind_speed_kmh ?? 18;

  const [isScrolledVisible, setIsScrolledVisible] = useState<boolean>(true);

  // Local auto-hide on scroll in Weather Portal mode (isolated to Navbar, zero parent re-renders)
  useEffect(() => {
    if (portalViewMode === "MAP") {
      setIsScrolledVisible(true);
      return;
    }

    let lastScrollTop = 0;
    let ticking = false;

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement | Document | null;
      let currentScrollTop = 0;

      if (target && "scrollTop" in target && typeof (target as HTMLElement).scrollTop === "number") {
        currentScrollTop = (target as HTMLElement).scrollTop;
      } else if (typeof window !== "undefined") {
        currentScrollTop = window.scrollY || document.documentElement?.scrollTop || 0;
      }

      if (!ticking) {
        window.requestAnimationFrame(() => {
          const delta = currentScrollTop - lastScrollTop;
          if (currentScrollTop <= 30) {
            setIsScrolledVisible(true);
          } else if (delta > 8 && currentScrollTop > 60) {
            setIsScrolledVisible(false);
          } else if (delta < -8) {
            setIsScrolledVisible(true);
          }
          lastScrollTop = Math.max(0, currentScrollTop);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll, { capture: true });
    };
  }, [portalViewMode]);

  // In 3D Twin Map mode, Navbar is ALWAYS visible and must never hide
  const shouldShow = portalViewMode === "MAP" ? true : (isVisible !== undefined ? isVisible && isScrolledVisible : isScrolledVisible);

  const LANGUAGES: { code: Language; label: string; short: string }[] = [
    { code: "en", label: "English", short: "EN" },
    { code: "hi", label: "हिंदी", short: "हिं" },
    { code: "mr", label: "मराठी", short: "मरा" },
  ];

  return (
    <>
      <header
        className={`h-14 sm:h-16 bg-slate-950/75 backdrop-blur-2xl border-b border-white/10 px-2.5 sm:px-4 flex items-center justify-between select-none z-30 sticky top-0 text-white shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 ease-in-out ${
          shouldShow
            ? "translate-y-0 opacity-100 mt-0"
            : "-translate-y-full opacity-0 -mt-14 sm:-mt-16 pointer-events-none"
        }`}
      >
        {/* Left: Mode Switcher (Always accessible on Mobile & Desktop) */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {onTogglePortalViewMode && (
            <div className="flex items-center p-0.5 sm:p-1 bg-white/[0.06] rounded-xl border border-white/10 backdrop-blur-md shadow-inner">
              <button
                type="button"
                onClick={() => portalViewMode !== "PORTAL" && onTogglePortalViewMode()}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                  portalViewMode === "PORTAL"
                    ? "bg-amber-600/80 text-white shadow-[0_0_12px_rgba(245,158,11,0.4),inset_0_1px_0_rgba(255,255,255,0.25)] border border-amber-400/50"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Switch to Weather & Hydrology Intelligence Portal"
              >
                <CloudSun className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span className="hidden xs:inline">{t("weatherPortal", "Weather Portal")}</span>
                <span className="xs:hidden">Weather</span>
              </button>
              <button
                type="button"
                onClick={() => portalViewMode !== "MAP" && onTogglePortalViewMode()}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
                  portalViewMode === "MAP"
                    ? "bg-cyan-600/80 text-white shadow-[0_0_12px_rgba(6,182,212,0.4),inset_0_1px_0_rgba(255,255,255,0.25)] border border-cyan-400/50"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Switch to 3D Digital Twin Map View"
              >
                <MapPin className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                <span className="hidden xs:inline">{t("twinMap", "3D Twin Map")}</span>
                <span className="xs:hidden">3D Map</span>
              </button>
            </div>
          )}
        </div>

        {/* Middle: Live Weather Feed + Telemetry Bar (Responsive) */}
        <div className="hidden lg:flex items-center gap-2.5 shrink-0">
          {onToggleLiveMode && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleLiveMode(); }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-md backdrop-blur-xl ${
                isLiveMode
                  ? "bg-emerald-950/40 border-emerald-400/50 text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.3),inset_0_1px_0_rgba(255,255,255,0.2)]"
                  : "glass-button text-slate-300 hover:text-white"
              }`}
              title="Toggle Real-Time Open-Meteo Weather Feed"
            >
              <Radio className={`w-3.5 h-3.5 ${isLiveMode ? "text-emerald-400 animate-pulse" : "text-slate-400"}`} />
              <span className="whitespace-nowrap">{isLiveMode ? t("liveTelemetryOn", "LIVE TELEMETRY ON") : t("simulationMode", "SIMULATION MODE")}</span>
              {isLiveMode && (
                <span className="px-1.5 py-0.2 text-[9px] bg-emerald-500 text-black font-black rounded-full uppercase">
                  {t("realtimeBadge", "REAL-TIME")}
                </span>
              )}
            </button>
          )}

          {/* Live Weather Metrics Pill */}
          <div className="flex items-center gap-3 bg-white/[0.04] backdrop-blur-xl border border-white/10 px-3.5 py-1.5 rounded-xl text-xs font-mono text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]">
            <div className="flex items-center gap-1 text-cyan-300 whitespace-nowrap" title="Precipitation Intensity">
              <CloudRain className="w-3.5 h-3.5" />
              <span>{rainVal} {t("rainMetric", "mm/h")}</span>
            </div>

            <div className="flex items-center gap-1 text-blue-300 whitespace-nowrap" title="Arabian Sea Coastal Tide Level">
              <Waves className="w-3.5 h-3.5" />
              <span>{tideVal} {t("tideMetric", "m Tide")}</span>
            </div>

            <div className="text-amber-300 font-bold whitespace-nowrap" title="Ambient Air Temperature">
              {tempVal}°C
            </div>

            <div className="flex items-center gap-1 text-teal-300 font-semibold bg-teal-950/40 px-2 py-0.5 rounded-lg border border-teal-700/40 whitespace-nowrap backdrop-blur-md" title="Relative Humidity">
              <Droplets className="w-3.5 h-3.5 text-teal-400" />
              <span>{t("humidityMetric", "Humidity")}: {humidityVal}%</span>
            </div>

            <div className="hidden 2xl:flex items-center gap-1 text-indigo-300 whitespace-nowrap" title="Wind Velocity">
              <Wind className="w-3.5 h-3.5 text-indigo-400" />
              <span>{windVal} {t("windMetric", "km/h")}</span>
            </div>
          </div>

          {/* Overall Health Meter */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] backdrop-blur-xl border border-white/10 text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400">{t("healthMetric", "Health")}:</span>
            <span className={`font-mono font-bold ${
              overallHealth >= 70 ? "text-emerald-400" : overallHealth >= 45 ? "text-amber-400" : "text-red-400"
            }`}>
              {overallHealth}%
            </span>
          </div>
        </div>

        {/* Compact Mid Chip for Medium Screens (768px - 1023px) */}
        <div className="hidden sm:flex lg:hidden items-center gap-2 bg-white/[0.04] backdrop-blur-xl border border-white/10 px-2.5 py-1 rounded-xl text-[11px] font-mono text-slate-300">
          <div className="flex items-center gap-1 text-cyan-300">
            <CloudRain className="w-3 h-3" />
            <span>{rainVal}mm</span>
          </div>
          <div className="flex items-center gap-1 text-blue-300">
            <Waves className="w-3 h-3" />
            <span>{tideVal}m</span>
          </div>
          <span className="text-amber-300 font-bold">{tempVal}°C</span>
        </div>

        {/* Right: Language Selector + View Toggle & Citizen Grievance */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Compact Language Selector for 3D Twin Map Mode / Top Bar */}
          {portalViewMode === "MAP" && (
            <div className="flex items-center p-0.5 bg-white/[0.06] rounded-xl border border-white/10 backdrop-blur-md shadow-inner gap-0.5">
              {LANGUAGES.map((lang) => {
                const isSelected = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setLanguage(lang.code)}
                    className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[9.5px] sm:text-[11px] font-bold transition-all ${
                      isSelected
                        ? "bg-cyan-600 text-white shadow-[0_0_8px_rgba(6,182,212,0.4)] border border-cyan-400/50"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                    title={`Switch language to ${lang.label}`}
                  >
                    <span>{lang.short}</span>
                  </button>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleViewMode(); }}
            className="glass-button flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-medium text-slate-200"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="hidden sm:inline">{t("viewToggle", "VIEW")}: <strong className="text-cyan-400">{viewMode}</strong></span>
            <strong className="sm:hidden text-cyan-400 text-[10px]">{viewMode}</strong>
          </button>

          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenCitizenModal(); }}
            className="glass-button flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-red-600/80 to-rose-600/80 hover:from-red-500/90 hover:to-rose-500/90 text-white text-[11px] sm:text-xs font-medium shadow-[0_4px_20px_rgba(239,68,68,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] border border-red-400/40"
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">{t("citizenReportBtn", "Citizen Report")}</span>
            <span className="sm:hidden whitespace-nowrap text-[10px]">Report</span>
          </button>

          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.04] backdrop-blur-xl border border-white/10 text-[11px] font-mono text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{time}</span>
          </div>

          {/* Mobile Telemetry & Actions Drawer Toggle Button */}
          <button
            type="button"
            onClick={toggleMobileMenu}
            className="lg:hidden glass-button p-1.5 rounded-xl text-slate-300 hover:text-white"
            title="Toggle Live Telemetry & Options"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Telemetry & Command Center Drawer (Slide-down under header) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed top-14 sm:top-16 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-2xl border-b border-white/15 p-3.5 shadow-2xl animate-fadeIn flex flex-col gap-3 text-xs max-h-[calc(100dvh-4rem)] overflow-y-auto custom-scrollbar">
          {/* Top Row: Live Feed Toggle & Time */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
            {onToggleLiveMode && (
              <button
                type="button"
                onClick={() => {
                  onToggleLiveMode();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-md ${
                  isLiveMode
                    ? "bg-emerald-950/50 border-emerald-400/60 text-emerald-300"
                    : "glass-button text-slate-300"
                }`}
              >
                <Radio className={`w-3.5 h-3.5 ${isLiveMode ? "text-emerald-400 animate-pulse" : "text-slate-400"}`} />
                <span>{isLiveMode ? t("liveTelemetryOn", "LIVE TELEMETRY ON") : t("simulationMode", "SIMULATION MODE")}</span>
              </button>
            )}

            <div className="flex items-center gap-1 font-mono text-[11px] text-slate-300 bg-white/[0.05] px-2 py-1 rounded-lg border border-white/10">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{time}</span>
            </div>
          </div>

          {/* Section 1: Live Telemetry Metric Grid */}
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
              Live Weather & Sensor Telemetry
            </div>
            <div className="grid grid-cols-3 gap-2 font-mono text-center">
              <div className="glass-panel-subtle p-2 rounded-xl">
                <div className="text-[10px] text-slate-400 mb-0.5">Rain Rate</div>
                <div className="text-cyan-300 font-bold text-xs">{rainVal} mm/h</div>
              </div>
              <div className="glass-panel-subtle p-2 rounded-xl">
                <div className="text-[10px] text-slate-400 mb-0.5">Coastal Tide</div>
                <div className="text-blue-300 font-bold text-xs">{tideVal} m</div>
              </div>
              <div className="glass-panel-subtle p-2 rounded-xl">
                <div className="text-[10px] text-slate-400 mb-0.5">Temperature</div>
                <div className="text-amber-300 font-bold text-xs">{tempVal}°C</div>
              </div>
              <div className="glass-panel-subtle p-2 rounded-xl">
                <div className="text-[10px] text-slate-400 mb-0.5">Humidity</div>
                <div className="text-teal-300 font-bold text-xs">{humidityVal}%</div>
              </div>
              <div className="glass-panel-subtle p-2 rounded-xl">
                <div className="text-[10px] text-slate-400 mb-0.5">Wind Speed</div>
                <div className="text-indigo-300 font-bold text-xs">{windVal} km/h</div>
              </div>
              <div className="glass-panel-subtle p-2 rounded-xl">
                <div className="text-[10px] text-slate-400 mb-0.5">Health</div>
                <div className={`font-bold text-xs ${overallHealth >= 70 ? "text-emerald-400" : "text-amber-400"}`}>{overallHealth}%</div>
              </div>
            </div>
          </div>

          {/* Section 2: AI & Analytics Diagnostics Modals */}
          {(onOpenPriorityModal || onOpenGraphModal) && (
            <div className="pt-2 border-t border-white/10">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                AI Diagnostics & Dispatch Matrix
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {onOpenPriorityModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenPriorityModal();
                      closeMobileMenu();
                    }}
                    className="glass-button flex items-center justify-between p-2.5 rounded-xl border border-amber-500/30 bg-amber-950/20 text-left hover:border-amber-400 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <div className="font-bold text-amber-200 text-xs">SIH Priority Matrix</div>
                        <div className="text-[9.5px] text-slate-400">Multi-sector repair & dispatch queue</div>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 shrink-0">
                      OPEN
                    </span>
                  </button>
                )}

                {onOpenGraphModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenGraphModal();
                      closeMobileMenu();
                    }}
                    className="glass-button flex items-center justify-between p-2.5 rounded-xl border border-purple-500/30 bg-purple-950/20 text-left hover:border-purple-400 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-purple-400 shrink-0" />
                      <div>
                        <div className="font-bold text-purple-200 text-xs">Cascading Failure Graph</div>
                        <div className="text-[9.5px] text-slate-400">NetworkX coupled vulnerability explorer</div>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-400/30 shrink-0">
                      OPEN
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Section 3: Quick Scenario Presets */}
          {onApplyPreset && (
            <div className="pt-2 border-t border-white/10">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                Simulation Scenarios
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onApplyPreset("Normal Monsoon", 35, 2.5, 20);
                    closeMobileMenu();
                  }}
                  className="glass-button p-2 rounded-xl text-left border border-white/10 hover:border-blue-400/50"
                >
                  <div className="font-bold text-blue-300 text-[11px]">Normal Monsoon</div>
                  <div className="text-[9px] font-mono text-slate-400">35 mm/h • 2.5m Tide</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onApplyPreset("Cloudburst Event", 100, 3.2, 40);
                    closeMobileMenu();
                  }}
                  className="glass-button p-2 rounded-xl text-left border border-red-500/30 bg-red-950/20 hover:border-red-400/50"
                >
                  <div className="font-bold text-red-300 text-[11px]">Cloudburst Storm</div>
                  <div className="text-[9px] font-mono text-slate-400">100 mm/h • 3.2m Tide</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onApplyPreset("High Tide Lockout", 65, 4.8, 55);
                    closeMobileMenu();
                  }}
                  className="glass-button p-2 rounded-xl text-left border border-amber-500/30 bg-amber-950/20 hover:border-amber-400/50"
                >
                  <div className="font-bold text-amber-300 text-[11px]">Tidal Lockout</div>
                  <div className="text-[9px] font-mono text-slate-400">65 mm/h • 4.8m Surge</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onApplyPreset("Cyclone Inundation", 140, 5.2, 70);
                    closeMobileMenu();
                  }}
                  className="glass-button p-2 rounded-xl text-left border border-purple-500/30 bg-purple-950/20 hover:border-purple-400/50"
                >
                  <div className="font-bold text-purple-300 text-[11px]">Cyclone Extreme</div>
                  <div className="text-[9px] font-mono text-slate-400">140 mm/h • 5.2m Surge</div>
                </button>
              </div>
            </div>
          )}

          {/* Section 4: Language & Reset Settings */}
          <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                <Languages className="w-3.5 h-3.5 text-slate-400" />
                Language:
              </span>
              <div className="flex items-center gap-1 bg-white/[0.06] p-1 rounded-xl border border-white/10">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setLanguage(lang.code);
                      closeMobileMenu();
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      language === lang.code
                        ? "bg-cyan-600 text-white shadow-sm border border-cyan-400/50"
                        : "text-slate-400"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onResetSimulation();
                closeMobileMenu();
              }}
              className="glass-button w-full py-2 rounded-xl text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Reset Simulation Baseline</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const Navbar = React.memo(NavbarComponent);


